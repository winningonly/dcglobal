import fs from "fs/promises";
import path from "path";
import { PassThrough, Readable } from "stream";
import archiver from "archiver";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });

  const UPLOADS_DIR = path.join(process.cwd(), "db", "uploads");
  const filePath = path.join(UPLOADS_DIR, `${id}.json`);
  let record: any = null;
  try {
    const txt = await fs.readFile(filePath, "utf8");
    record = JSON.parse(txt);
  } catch (err) {
    return new Response(JSON.stringify({ error: "upload not found" }), { status: 404 });
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
    return new Response(JSON.stringify({ error: "template not found" }), { status: 500 });
  }

  // create zip stream
  const zipStream = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(zipStream);

  // helper to get full name
  function getFullName(row: Record<string, string>) {
    const candidates = ["Full Name", "FullName", "Name", "name", "full_name", "first_name", "firstname"];
    for (const key of candidates) {
      if (row[key]) return row[key];
    }
    // try first/last
    const first = row["First Name"] || row["first_name"] || row["first"] || "";
    const last = row["Last Name"] || row["last_name"] || row["last"] || "";
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    // fallback to email
    return row["Email"] || row["email"] || "participant";
  }

  // generate pdf per trainee and create certificate records
  const { generateUniqueCode, saveCertificate } = await import("../../../lib/certs");

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
      const y = height * 0.51;  // From 0.45 → 0.50
      page.drawText(fullName, {
        x,
        y,
        size: fontSize,
        font: timesBold,
        color: rgb(183/255, 184/255, 240/255),
      });

      // generate unique code and draw at top-right
      const code = await generateUniqueCode();
      const codeFontSize = 10;
      const codeWidth = timesBold.widthOfTextAtSize(code, codeFontSize);
      const margin = 40;
      const codeX = width - margin - codeWidth;
      const codeY = height - margin;
      page.drawText(code, {
        x: codeX,
        y: codeY,
        size: codeFontSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const safeName = fullName.replace(/[^a-z0-9-_\.]/gi, "_");
      const filename = `${i + 1}-${safeName}.pdf`;
      archive.append(Buffer.from(pdfBytes), { name: filename });

      // save certificate record
      await saveCertificate({
        code,
        uploadId: id,
        name: fullName,
        email: row["Email"] || row["email"] || "",
        filename,
        issuedAt: new Date().toISOString(),
        method: "download",
      });
    } catch (err) {
      // skip failed row
      console.error("Failed to create PDF for", fullName, err);
    }
  }

  // finalize
  archive.finalize().catch((e) => console.error("archive finalize error", e));

  return new Response(Readable.toWeb(zipStream) as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="certificates-${id}.zip"`,
    },
  });
}

