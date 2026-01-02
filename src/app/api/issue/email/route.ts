import fs from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

// SMTP credentials provided by the user
const SMTP_CONFIG = {
  host: "mail.dcglobalcertify.com",
  port: 465,
  secure: true,
  auth: {
    user: "admin@dcglobalcertify.com",
    pass: "e?Z+dvqF;a?}",
  },
};

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
    color: rgb(183/255, 184/255, 240/255),
  });
  return pdfDoc.save();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const UPLOADS_DIR = path.join(process.cwd(), "db", "uploads");
  const filePath = path.join(UPLOADS_DIR, `${id}.json`);
  let record: any = null;
  try {
    const txt = await fs.readFile(filePath, "utf8");
    record = JSON.parse(txt);
  } catch (err) {
    return NextResponse.json({ error: "upload not found" }, { status: 404 });
  }

  const data: Array<Record<string, string>> = record.data || [];
  const type: string = record.type || "dli-basic";

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
    return NextResponse.json({ error: "template not found" }, { status: 500 });
  }

  // create transporter
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  // verify transporter before sending
  try {
    await transporter.verify();
  } catch (err: any) {
    return NextResponse.json({ error: `SMTP connection failed: ${err?.message || err}` }, { status: 500 });
  }

  const results: { to: string; ok: boolean; error?: string }[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const fullName = getFullName(row);
    const to = getEmail(row);
    if (!to) {
      results.push({ to: "", ok: false, error: "no email provided" });
      continue;
    }

    try {
      const pdfBytes = await generatePdfForName(templateBytes, fullName);
      const safeName = fullName.replace(/[^a-z0-9-_\.]/gi, "_");
      const filename = `${i + 1}-${safeName}.pdf`;

      await transporter.sendMail({
        from: SMTP_CONFIG.auth.user,
        to,
        subject: `Your Certificate from DC Certificate Portal`,
        text: `Dear ${fullName},\n\nPlease find attached your certificate.\n\nBest regards,\nDC Certificate Team`,
        attachments: [
          { filename, content: Buffer.from(pdfBytes) },
        ],
      });

      results.push({ to, ok: true });
    } catch (err: any) {
      results.push({ to, ok: false, error: err?.message || String(err) });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;
  return NextResponse.json({ message: `Emails processed: ${okCount} sent, ${failCount} failed`, results });
}
