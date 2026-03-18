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

/**
 * Parse a .vcf file string into an array of VCardData objects.
 * Handles multi-contact files (multiple BEGIN:VCARD blocks).
 */
export function parseVCards(vcfString: string): VCardData[] {
  const results: VCardData[] = [];
  const blocks = vcfString.split(/(?=BEGIN:VCARD)/i).filter((b) => b.trim());

  for (const block of blocks) {
    const lines = unfoldLines(block.split(/\r?\n/));
    let name = "";
    let role: string | undefined;
    let company: string | undefined;
    let email: string | undefined;
    let phone: string | undefined;
    let note: string | undefined;

    for (const line of lines) {
      const [field, ...valueParts] = line.split(":");
      const value = valueParts.join(":").trim();
      const fieldUpper = field.split(";")[0].toUpperCase();

      switch (fieldUpper) {
        case "FN":
          name = value;
          break;
        case "N":
          if (!name) {
            const [last, first] = value.split(";");
            name = [first, last].filter(Boolean).join(" ").trim();
          }
          break;
        case "ORG":
          company = value.replace(/;/g, " ").trim() || undefined;
          break;
        case "TITLE":
          role = value || undefined;
          break;
        case "EMAIL":
          if (!email) email = value || undefined;
          break;
        case "TEL":
          if (!phone) phone = value || undefined;
          break;
        case "NOTE":
          note = value.replace(/\\n/g, "\n") || undefined;
          break;
      }
    }

    if (name) {
      results.push({ name, role, company, email, phone, note });
    }
  }

  return results;
}

/** Unfold continuation lines per RFC 6350 */
function unfoldLines(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      if (result.length) result[result.length - 1] += line.slice(1);
    } else {
      result.push(line);
    }
  }
  return result;
}
