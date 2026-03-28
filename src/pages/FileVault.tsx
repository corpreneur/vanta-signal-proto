import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Image, File, Download, ExternalLink, Paperclip, FolderOpen, Upload, X } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface VaultFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
  signalId: string;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return Image;
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext || "")) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function fetchAllFiles(): Promise<VaultFile[]> {
  // List all top-level folders (signal IDs) in the bucket
  const { data: folders, error: foldersErr } = await supabase.storage
    .from("signal-attachments")
    .list("", { limit: 500 });

  if (foldersErr || !folders) return [];

  const allFiles: VaultFile[] = [];

  // For each folder (signal ID), list files
  const folderNames = folders.filter((f) => !f.metadata?.mimetype).map((f) => f.name);

  for (const folder of folderNames) {
    const { data: files } = await supabase.storage
      .from("signal-attachments")
      .list(folder, { limit: 100 });

    if (files) {
      for (const file of files) {
        if (file.metadata?.mimetype) {
          allFiles.push({
            ...file,
            signalId: folder,
          });
        }
      }
    }
  }

  return allFiles;
}

export default function FileVault() {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const folder = `manual-${Date.now()}`;
        const { error } = await supabase.storage
          .from("signal-attachments")
          .upload(`${folder}/${file.name}`, file);
        if (error) throw error;
      }
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
      queryClient.invalidateQueries({ queryKey: ["file-vault"] });
    } catch (err) {
      toast.error("Upload failed — try again");
    } finally {
      setUploading(false);
    }
  };

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["file-vault"],
    queryFn: fetchAllFiles,
  });

  const filtered = useMemo(() => {
    if (!search) return files;
    const q = search.toLowerCase();
    return files.filter(
      (f) => f.name.toLowerCase().includes(q) || f.signalId.toLowerCase().includes(q)
    );
  }, [files, search]);

  // Group by signal ID
  const grouped = useMemo(() => {
    const map: Record<string, VaultFile[]> = {};
    for (const f of filtered) {
      if (!map[f.signalId]) map[f.signalId] = [];
      map[f.signalId].push(f);
    }
    return map;
  }, [filtered]);

  const totalSize = files.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);

  return (
    <div className="max-w-[960px] mx-auto px-0 pt-0 pb-16">
      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              File Vault · All Attachments
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            File Vault
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-2 max-w-xl">
            Search and browse all files attached to signals across your network.
          </p>
        </header>
      </Motion>

      {/* Upload drop zone */}
      <Motion delay={30}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className={`border-2 border-dashed p-4 mb-6 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-mono text-[10px] text-muted-foreground">Uploading…</span>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Drop files here or click to upload
            </button>
          )}
        </div>
      </Motion>

      {/* Stats + Search */}
      <Motion delay={40}>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files by name or signal…"
              className="pl-9 font-mono text-xs bg-card border-border"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[10px] text-muted-foreground">
              <Paperclip className="w-3 h-3 inline mr-1" />
              {files.length} files
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatSize(totalSize)} total
            </span>
          </div>
        </div>
      </Motion>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-2 h-2 bg-primary animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-vanta-border bg-card p-12 text-center">
          <FolderOpen className="w-8 h-8 text-vanta-text-muted mx-auto mb-3" />
          <p className="font-mono text-[11px] text-vanta-text-muted uppercase tracking-widest">
            {search ? "No files match your search" : "No files uploaded yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([signalId, signalFiles]) => (
            <Motion key={signalId}>
              <div className="border border-vanta-border bg-card">
                {/* Signal header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-vanta-border bg-vanta-bg-elevated">
                  <Link
                    to={`/signals`}
                    className="font-mono text-[10px] uppercase tracking-wider text-vanta-text-low hover:text-vanta-accent transition-colors"
                  >
                    Signal {signalId.slice(0, 8)}…
                  </Link>
                  <span className="font-mono text-[9px] text-vanta-text-muted">
                    {signalFiles.length} file{signalFiles.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Files grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-vanta-border">
                  {signalFiles.map((file) => {
                    const Icon = fileIcon(file.name);
                    const isImage = file.metadata?.mimetype?.startsWith("image/");
                    const { data: urlData } = supabase.storage
                      .from("signal-attachments")
                      .getPublicUrl(`${file.signalId}/${file.name}`);

                    return (
                      <div
                        key={`${file.signalId}/${file.name}`}
                        className="bg-card p-3 flex items-start gap-3 group hover:bg-vanta-bg-elevated transition-colors"
                      >
                        {isImage && urlData?.publicUrl ? (
                          <img
                            src={urlData.publicUrl}
                            alt={file.name}
                            className="w-10 h-10 object-cover border border-vanta-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 border border-vanta-border flex items-center justify-center bg-vanta-bg-elevated shrink-0">
                            <Icon className="w-4 h-4 text-vanta-text-muted" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[11px] text-foreground truncate">{file.name}</p>
                          <p className="font-mono text-[9px] text-vanta-text-muted mt-0.5">
                            {file.metadata?.size ? formatSize(file.metadata.size) : "—"} ·{" "}
                            {new Date(file.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        {urlData?.publicUrl && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <a
                              href={urlData.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-vanta-accent/10 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-vanta-text-muted" />
                            </a>
                            <a
                              href={urlData.publicUrl}
                              download={file.name}
                              className="p-1 hover:bg-vanta-accent/10 transition-colors"
                            >
                              <Download className="w-3 h-3 text-vanta-text-muted" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Motion>
          ))}
        </div>
      )}
    </div>
  );
}
