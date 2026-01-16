import fs from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { readUploadRecord, Row } from "@/lib/uploads";
import { CertificateRecord } from "@/lib/certs";
import { upsertTrainee } from "@/lib/trainees";

// Brevo SMTP configuration
const SMTP_CONFIG = {
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
};

const FROM_EMAIL = process.env.FROM_EMAIL || "admin@dcglobalcertify.com";
const FROM_NAME = "Dominion City";

function getFullName(row: Record<string, string>) {
  const candidates = ["Full Name", "FullName", "Name", "name", "full_name", "first_name", "firstname"];
  for (const key of candidates) {
    if (row[key]) return row[key];
  }
  const first = row["First Name"] || row["first_name"] || row["first"] || "";
  const last = row["Last Name"] || row["last_name"] || row["last"] || "";
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return row["Email"] || row["email"] || "participant";
}

function getEmail(row: Record<string, string>) {
  return row["Email"] || row["email"] || "";
}

async function generatePdfForName(templateBytes: Uint8Array, name: string) {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();
  const fontSize = Math.max(20, Math.min(36, Math.floor(width / 20)));
  const textWidth = timesBold.widthOfTextAtSize(name, fontSize);
  const x = (width - textWidth) / 2;
  const y = height * 0.51;

  page.drawText(name, {
    x,
    y,
    size: fontSize,
    font: timesBold,
    color: rgb(183 / 255, 184 / 255, 240 / 255),
  });

  return pdfDoc.save();
}

interface UploadRecord {
  data?: Array<Record<string, string>>;
  type?: string;
}

interface CertificateData {
  code: string;
  name: string;
  type: string;
  data: Row;
  courseName: string | null;
  issuedAt: string;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = (body as { id?: string })?.id;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const record = (await readUploadRecord(id)) as UploadRecord | null;

  if (!record) {
    return NextResponse.json({ error: "record not found" }, { status: 404 });
  }

  const data: Array<Record<string, string>> = record.data ?? [];
  const type: string = record.type ?? "dli-basic";

  const templateMap: Record<string, string> = {
    "dli-basic": "dli-basic.pdf",
    "dli-advanced": "dli-advanced.pdf",
    "discipleship": "discipleship.pdf",
  };

  const templateFile = templateMap[type] || templateMap["dli-basic"];
  const templatePath = path.join(process.cwd(), "pdfs", templateFile);

  let templateBytes: Uint8Array;
  try {
    templateBytes = await fs.readFile(templatePath);
  } catch (err) {
    console.error("Template file error:", err);
    return NextResponse.json({ error: "template not found" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  try {
    await transporter.verify();
    console.log("Brevo SMTP connection verified");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Brevo SMTP verification failed:", err);

    return NextResponse.json(
      {
        error: `SMTP connection failed: ${errorMessage}`,
        hint: "Check BREVO_SMTP_USER & BREVO_SMTP_KEY in environment variables",
      },
      { status: 500 },
    );
  }

  const results: { to: string; ok: boolean; error?: string }[] = [];

  const { generateUniqueCode, upsertCertificate } = await import("@/lib/certs");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const fullName = getFullName(row);
    const to = getEmail(row);

    if (!to) {
      results.push({ to: "", ok: false, error: "no email provided" });
      continue;
    }

    try {
      const code = await generateUniqueCode();

      const pdfBytes = await generatePdfForName(templateBytes, fullName);

      const pdfWithCode = await PDFDocument.load(pdfBytes);
      const timesBold = await pdfWithCode.embedFont(StandardFonts.TimesRomanBold);
      const page = pdfWithCode.getPages()[0];
      const { width, height } = page.getSize();
      const codeFontSize = 15;
      const codeWidth = timesBold.widthOfTextAtSize(code, codeFontSize);
      const margin = 60;
      const codeX = width - margin - codeWidth;
      const codeY = height * 0.88;

      page.drawText(code, {
        x: codeX,
        y: codeY,
        size: codeFontSize,
        font: timesBold,
        color: rgb(183 / 255, 184 / 255, 240 / 255),
      });

      const finalPdf = await pdfWithCode.save();

      const safeName = fullName.replace(/[^a-z0-9-_\.]/gi, "_");
      const filename = `${i + 1}-${safeName}.pdf`;

      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to,
        subject: "Your Certificate from DC Certificate Portal",
        text: `Dear ${fullName},\n\nPlease find attached your certificate.\nYour certificate ID is ${code}.\n\nBest regards,\nDC Certificate Team`,
        attachments: [{ filename, content: Buffer.from(finalPdf) }],
      });

      const issuedAt = new Date().toISOString();
      const courseNameVal = row["Course Name"] || row["courseName"] || row["course"] || null;

      try {
        const certificateData: CertificateData = {
          code,
          name: fullName,
          type,
          data: row,
          courseName: courseNameVal,
          issuedAt,
        };
        await upsertCertificate(certificateData as unknown as CertificateRecord);
      } catch (err) {
        console.error("Failed to save certificate record:", err);
      }

      try {
        await upsertTrainee({
          name: fullName,
          email: to,
          courseName: courseNameVal,
          location: row["Location"] || row["location"] || null,
          phone: row["Phone"] || row["phone"] || null,
          date: issuedAt,
          dc_id: code,
        });
      } catch (err) {
        console.error("Failed to save trainee record:", err);
      }

      results.push({ to, ok: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Failed for ${to}:`, err);
      results.push({ to, ok: false, error: errorMessage });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;

  return NextResponse.json({
    message: `Processed ${results.length} emails: ${okCount} sent, ${failCount} failed`,
    results,
  });
}