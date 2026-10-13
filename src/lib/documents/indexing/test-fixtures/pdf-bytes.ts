/** Minimal valid single-page PDF containing the given plain text (Helvetica). */
export function buildMinimalTextPdf(text: string): Buffer {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET\n`;
  const streamLen = Buffer.byteLength(stream, "utf8");

  const objects: Array<{ num: number; body: string }> = [
    { num: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { num: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    {
      num: 3,
      body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    },
    { num: 4, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
    { num: 5, body: `<< /Length ${streamLen} >>\nstream\n${stream}endstream` },
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets[obj.num] = Buffer.byteLength(pdf, "utf8");
    pdf += `${obj.num} 0 obj\n${obj.body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const obj of objects) {
    pdf += `${String(offsets[obj.num]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

/** PDF with no text operators (image-only surrogate for tests). */
export function buildEmptyContentPdf(): Buffer {
  const stream = "\n";
  const streamLen = Buffer.byteLength(stream, "utf8");
  const objects: Array<{ num: number; body: string }> = [
    { num: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { num: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    {
      num: 3,
      body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>",
    },
    { num: 4, body: `<< /Length ${streamLen} >>\nstream\n${stream}endstream` },
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets[obj.num] = Buffer.byteLength(pdf, "utf8");
    pdf += `${obj.num} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const obj of objects) {
    pdf += `${String(offsets[obj.num]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

export function buildCorruptPdfBytes(): Buffer {
  return Buffer.from("%PDF-not-really\n", "utf8");
}
