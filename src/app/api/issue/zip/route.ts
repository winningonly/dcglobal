import fs from "fs/promises";
import path from "path";
import { PassThrough, Readable } from "stream";
import archiver from "archiver";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readUploadRecord, Row } from "@/lib/uploads";
import { CertificateRecord } from "@/lib/certs";
import { upsertTrainee } from "@/lib/trainees";

// Define the shape expected by upsertCertificate
interface CertificateInput {
  code: string;
  name: string;
  type: string;
  data: Row;
  courseName: string | null;
  issuedAt: string;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
  }

  const record = (await readUploadRecord(id)) as
    | { data: Row[]; type?: string }
    | null;

  if (!record) {
    return new Response(JSON.stringify({ error: "upload not found" }), {
      status: 404,
    });
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
  } catch {
    return new Response(JSON.stringify({ error: "template not found" }), {
      status: 500,
    });
  }

  // create zip stream
  const zipStream = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(zipStream);

  // helper to get full name
  function getFullName(row: Record<string, string>): string {
    const candidates = [
      "Full Name",
      "FullName",
      "Name",
      "name",
      "full_name",
      "first_name",
      "firstname",
    ];
    for (const key of candidates) {
      if (row[key]) return row[key];
    }
    // try first/last
    const first =
      row["First Name"] || row["first_name"] || row["first"] || "";
    const last = row["Last Name"] || row["last_name"] || row["last"] || "";
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    // fallback to email
    return row["Email"] || row["email"] || "participant";
  }

  // generate pdf per trainee and create certificate records
  const { generateUniqueCode, upsertCertificate } = await import("@/lib/certs");

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const fullName = getFullName(row);

    try {
      const pdfDoc = await PDFDocument.load(templateBytes);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const pages = pdfDoc.getPages();
      const page = pages[0];
      const { width, height } = page.getSize();

      // draw name centered
      const fontSize = Math.max(20, Math.min(36, Math.floor(width / 20)));
      const textWidth = timesBold.widthOfTextAtSize(fullName, fontSize);
      const x = (width - textWidth) / 2;
      const y = height * 0.51;
      page.drawText(fullName, {
        x,
        y,
        size: fontSize,
        font: timesBold,
        color: rgb(183 / 255, 184 / 255, 240 / 255),
      });

      // generate unique code and draw at top-right
      const code = await generateUniqueCode();
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

      const pdfBytes = await pdfDoc.save();

      // persist certificate record (best-effort)
      try {
        const issuedAt = new Date().toISOString();
        const courseNameVal = row["Course"] || row["course"] || null;
        const certData: CertificateInput = {
          code,
          name: fullName,
          type,
          data: row,
          courseName: courseNameVal,
          issuedAt,
        };

        await upsertCertificate(certData as unknown as CertificateRecord);

        // persist trainee details (best-effort)
        try {
          await upsertTrainee({
            name: fullName,
            email: row["Email"] || row["email"] || null,
            courseName: courseNameVal,
            location: row["Location"] || row["location"] || null,
            phone: row["Phone"] || row["phone"] || null,
            date: issuedAt,
            dc_id: code,
          });
        } catch (e) {
          console.error("Failed saving trainee record", fullName, e);
        }
      } catch (err) {
        console.error("Failed saving certificate record", fullName, err);
      }

      const safeName = fullName.replace(/[^a-z0-9-_\.]/gi, "_");
      const filename = `${i + 1}-${safeName}.pdf`;
      archive.append(Buffer.from(pdfBytes), { name: filename });
    } catch (err) {
      console.error("Failed to create PDF for", fullName, err);
      // continue to next row (skip failed one)
    }
  }

  // finalize archive
  archive.finalize().catch((e) => console.error("archive finalize error", e));

  return new Response(Readable.toWeb(zipStream) as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="certificates-${id}.zip"`,
    },
  });
}