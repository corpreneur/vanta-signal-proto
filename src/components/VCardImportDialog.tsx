import { useState, useRef } from "react";
import { Upload, FileUp, User, Building, Mail, Phone, Briefcase, Check, X } from "lucide-react";
import { parseVCards, type VCardData } from "@/lib/vcard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Motion } from "@/components/ui/motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function VCardImportDialog({ open, onClose }: Props) {
  const [parsed, setParsed] = useState<VCardData[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const cards = parseVCards(text);
      setParsed(cards);
      setSelected(new Set(cards.map((_, i) => i)));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".vcf") || file.type === "text/vcard")) {
      handleFile(file);
    } else {
      toast.error("Please drop a .vcf file");
    }
  };

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === parsed.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(parsed.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const toImport = parsed.filter((_, i) => selected.has(i));
    if (!toImport.length) return;

    setImporting(true);
    try {
      // Create a CONTEXT signal for each imported contact
      const rows = toImport.map((c) => ({
        sender: c.name,
        signal_type: "CONTEXT" as const,
        source: "manual" as const,
        priority: "medium" as const,
        summary: `Contact imported from vCard${c.role ? ` — ${c.role}` : ""}${c.company ? ` at ${c.company}` : ""}`,
        source_message: [
          c.email && `Email: ${c.email}`,
          c.phone && `Phone: ${c.phone}`,
          c.role && `Role: ${c.role}`,
          c.company && `Company: ${c.company}`,
          c.note && `Note: ${c.note}`,
        ]
          .filter(Boolean)
          .join("\n"),
        status: "Captured" as const,
      }));

      const { error } = await supabase.from("signals").insert(rows);
      if (error) throw error;

      toast.success(`${toImport.length} contact${toImport.length > 1 ? "s" : ""} imported`);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsed([]);
    setSelected(new Set());
    setFileName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <Motion>
        <div className="relative w-[90vw] max-w-lg max-h-[80vh] flex flex-col bg-card border border-border shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              <h2 className="font-display text-lg text-foreground">Import Contacts</h2>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* File picker / drop zone */}
            {parsed.length === 0 && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer flex flex-col items-center justify-center py-12 px-6"
              >
                <FileUp className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="font-mono text-xs text-foreground mb-1">
                  Drop a .vcf file here or click to browse
                </p>
                <p className="font-mono text-[9px] text-muted-foreground">
                  Supports single and multi-contact vCard files
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".vcf,text/vcard"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            )}

            {/* Parsed contacts preview */}
            {parsed.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    {fileName} — {parsed.length} contact{parsed.length > 1 ? "s" : ""} found
                  </p>
                  <button
                    onClick={toggleAll}
                    className="font-mono text-[9px] text-primary hover:underline"
                  >
                    {selected.size === parsed.length ? "Deselect all" : "Select all"}
                  </button>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {parsed.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => toggleSelect(i)}
                      className={`border p-3 cursor-pointer transition-colors ${
                        selected.has(i)
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          selected.has(i) ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {selected.has(i) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground shrink-0" />
                            <p className="font-mono text-[12px] font-semibold text-foreground truncate">
                              {c.name}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {c.role && (
                              <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                                <Briefcase className="w-2.5 h-2.5" /> {c.role}
                              </span>
                            )}
                            {c.company && (
                              <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                                <Building className="w-2.5 h-2.5" /> {c.company}
                              </span>
                            )}
                            {c.email && (
                              <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                                <Mail className="w-2.5 h-2.5" /> {c.email}
                              </span>
                            )}
                            {c.phone && (
                              <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                                <Phone className="w-2.5 h-2.5" /> {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {parsed.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <button
                onClick={() => { setParsed([]); setFileName(""); }}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Choose different file
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {importing ? "Importing…" : `Import ${selected.size} contact${selected.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          )}
        </div>
      </Motion>
    </div>
  );
}