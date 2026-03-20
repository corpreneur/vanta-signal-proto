import { Download } from "lucide-react";
import { downloadVCard, type VCardData } from "@/lib/vcard";
import { toast } from "sonner";

interface Props {
  contactName: string;
  profile?: { role?: string; company?: string; email?: string; phone?: string };
  compact?: boolean;
}

export default function SaveToContactsButton({ contactName, profile, compact }: Props) {
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const data: VCardData = {
      name: contactName,
      role: profile?.role || undefined,
      company: profile?.company || undefined,
      email: profile?.email || undefined,
      phone: profile?.phone || undefined,
      note: "Exported from Vanta Signal",
    };
    downloadVCard(data);
    toast.success(`${contactName}.vcf downloaded — tap to add to Contacts`);
  };

  if (compact) {
    return (
      <button
        onClick={handleSave}
        title="Save to iPhone Contacts"
        className="p-1 text-muted-foreground hover:text-primary transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
    >
      <Download className="w-3 h-3" /> Save to Contacts
    </button>
  );
}
