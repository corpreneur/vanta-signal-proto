/**
 * Generate a vCard (.vcf) string and trigger download.
 */
export interface VCardData {
  name: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  note?: string;
}

export function generateVCard(data: VCardData): string {
  const parts = data.name.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.name}`,
    `N:${lastName};${firstName};;;`,
  ];

  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.role) lines.push(`TITLE:${data.role}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);
  if (data.note) lines.push(`NOTE:${data.note.replace(/\n/g, "\\n")}`);

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCard(data: VCardData) {
  const vcf = generateVCard(data);
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.name.replace(/\s+/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
