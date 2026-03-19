import { useState, useRef, useEffect } from "react";
import { Upload, FileUp, User, Building, Mail, Phone, Briefcase, Check, X, AlertTriangle, GitMerge, SkipForward } from "lucide-react";
import { parseVCards, type VCardData } from "@/lib/vcard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Motion } from "@/components/ui/motion";

interface Props {
  open: boolean;
  onClose: () => void;
}

type DuplicateAction = "merge" | "skip" | "new";

interface ContactWithStatus extends VCardData {
  index: number;
  duplicateOf?: string; // existing signal sender name
  action: DuplicateAction;
}

export default function VCardImportDialog({ open, onClose }: Props) {
  const [contacts, setContacts] = useState<ContactWithStatus[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [checking, setChecking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setChecking(true);

    const text = await file.text();
    const cards = parseVCards(text);

    // Fetch existing contact names from signals
    const names = cards.map((c) => c.name);
    const { data: existing } = await supabase
      .from("signals")
      .select("sender")
      .in("sender", names);

    const existingNames = new Set((existing || []).map((r) => r.sender.toLowerCase()));

    const withStatus: ContactWithStatus[] = cards.map((c, i) => {
      const isDuplicate = existingNames.has(c.name.toLowerCase());
      return {
        ...c,
        index: i,
        duplicateOf: isDuplicate ? c.name : undefined,
        action: isDuplicate ? "merge" as const : "new" as const,
      };
    });

    setContacts(withStatus);
    // Select all non-skip contacts
    setSelected(new Set(withStatus.filter((c) => c.action !== "skip").map((c) => c.index)));
    setChecking(false);
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

  const setAction = (index: number, action: DuplicateAction) => {
    setContacts((prev) =>
      prev.map((c) => (c.index === index ? { ...c, action } : c))
    );
    if (action === "skip") {
      setSelected((prev) => { const next = new Set(prev); next.delete(index); return next; });
    } else {
      setSelected((prev) => new Set(prev).add(index));
    }
  };

  const toggleSelect = (i: number) => {
    const contact = contacts.find((c) => c.index === i);
    if (contact?.action === "skip") return; // Can't select skipped
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    const selectable = contacts.filter((c) => c.action !== "skip");
    if (selected.size === selectable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable.map((c) => c.index)));
    }
  };

  const handleImport = async () => {
    const toImport = contacts.filter((c) => selected.has(c.index) && c.action !== "skip");
    if (!toImport.length) return;

    setImporting(true);
    try {
      const rows = toImport.map((c) => ({
        sender: c.name,
        signal_type: "CONTEXT" as const,
        source: "manual" as const,
        priority: "medium" as const,
        summary: `Contact ${c.action === "merge" ? "updated" : "imported"} from vCard${c.role ? ` — ${c.role}` : ""}${c.company ? ` at ${c.company}` : ""}`,
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

      const mergeCount = toImport.filter((c) => c.action === "merge").length;
      const newCount = toImport.filter((c) => c.action === "new").length;
      const parts = [
        newCount && `${newCount} new`,
        mergeCount && `${mergeCount} merged`,
      ].filter(Boolean).join(", ");
      toast.success(`Imported: ${parts}`);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setContacts([]);
    setSelected(new Set());
    setFileName("");
    onClose();
  };

  const duplicateCount = contacts.filter((c) => c.duplicateOf).length;
  const skipCount = contacts.filter((c) => c.action === "skip").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

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
            {/* Drop zone */}
            {contacts.length === 0 && !checking && (
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

            {/* Checking spinner */}
            {checking && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="font-mono text-[10px] text-muted-foreground">Checking for duplicates…</p>
              </div>
            )}

            {/* Contacts list */}
            {contacts.length > 0 && !checking && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    {fileName} — {contacts.length} contact{contacts.length > 1 ? "s" : ""}
                  </p>
                  <button onClick={toggleAll} className="font-mono text-[9px] text-primary hover:underline">
                    {selected.size === contacts.filter((c) => c.action !== "skip").length ? "Deselect all" : "Select all"}
                  </button>
                </div>

                {/* Duplicate summary banner */}
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 mb-3 border border-yellow-500/30 bg-yellow-500/5 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <p className="font-mono text-[10px] text-yellow-600 dark:text-yellow-400">
                      {duplicateCount} duplicate{duplicateCount > 1 ? "s" : ""} found
                      {skipCount > 0 && ` · ${skipCount} skipped`}
                    </p>
                  </div>
                )}

                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {contacts.map((c) => (
                    <ContactRow
                      key={c.index}
                      contact={c}
                      isSelected={selected.has(c.index)}
                      onToggle={() => toggleSelect(c.index)}
                      onAction={(a) => setAction(c.index, a)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {contacts.length > 0 && !checking && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <button
                onClick={() => { setContacts([]); setFileName(""); }}
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

/* ── Individual contact row ── */

function ContactRow({
  contact: c,
  isSelected,
  onToggle,
  onAction,
}: {
  contact: ContactWithStatus;
  isSelected: boolean;
  onToggle: () => void;
  onAction: (a: DuplicateAction) => void;
}) {
  const isSkipped = c.action === "skip";

  return (
    <div
      onClick={isSkipped ? undefined : onToggle}
      className={`border p-3 transition-colors ${
        isSkipped
          ? "border-border/50 bg-muted/30 opacity-60"
          : isSelected
          ? "border-primary/40 bg-primary/5 cursor-pointer"
          : "border-border bg-card hover:border-border/80 cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={`w-5 h-5 border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            isSkipped
              ? "border-border/50"
              : isSelected
              ? "border-primary bg-primary"
              : "border-border"
          }`}
        >
          {isSelected && !isSkipped && <Check className="w-3 h-3 text-primary-foreground" />}
          {isSkipped && <X className="w-3 h-3 text-muted-foreground" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-muted-foreground shrink-0" />
            <p className="font-mono text-[12px] font-semibold text-foreground truncate">{c.name}</p>
          </div>

          {/* Contact details */}
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

          {/* Duplicate actions */}
          {c.duplicateOf && (
            <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0" />
              <span className="font-mono text-[9px] text-yellow-600 dark:text-yellow-400 mr-1">Duplicate</span>
              <button
                onClick={() => onAction("merge")}
                className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] border transition-colors ${
                  c.action === "merge"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitMerge className="w-2.5 h-2.5" /> Merge
              </button>
              <button
                onClick={() => onAction("skip")}
                className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] border transition-colors ${
                  c.action === "skip"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <SkipForward className="w-2.5 h-2.5" /> Skip
              </button>
              <button
                onClick={() => onAction("new")}
                className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] border transition-colors ${
                  c.action === "new"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-2.5 h-2.5" /> New
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
