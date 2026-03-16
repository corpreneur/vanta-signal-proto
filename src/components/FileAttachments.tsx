import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, Upload, Trash2, ExternalLink, FileText, Image, File } from "lucide-react";
import { toast } from "sonner";

interface FileAttachmentsProps {
  signalId: string;
  compact?: boolean;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
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

export default function FileAttachments({ signalId, compact = false }: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();
  const folder = `signal-${signalId}`;

  const { data: files = [] } = useQuery({
    queryKey: ["signal-files", signalId],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("signal-attachments")
        .list(folder);
      if (error) return [];
      return (data || []) as StorageFile[];
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const path = `${folder}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("signal-attachments")
          .upload(path, file);
        if (error) throw error;
      }
      toast.success(`${fileList.length} file${fileList.length > 1 ? "s" : ""} uploaded`);
      qc.invalidateQueries({ queryKey: ["signal-files", signalId] });
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    const { error } = await supabase.storage
      .from("signal-attachments")
      .remove([`${folder}/${name}`]);
    if (error) {
      toast.error("Delete failed");
    } else {
      qc.invalidateQueries({ queryKey: ["signal-files", signalId] });
    }
  };

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage
      .from("signal-attachments")
      .getPublicUrl(`${folder}/${name}`);
    return data.publicUrl;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-vanta-text-muted" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted">
            Attachments {files.length > 0 && `(${files.length})`}
          </span>
        </div>
        <label className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] uppercase tracking-wider border border-vanta-border text-vanta-text-low hover:text-foreground hover:border-foreground/20 transition-colors cursor-pointer">
          <Upload className="w-3 h-3" />
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => {
            const Icon = fileIcon(f.name);
            const displayName = f.name.replace(/^\d+-/, "");
            return (
              <div
                key={f.id || f.name}
                className="flex items-center gap-2 p-2 border border-vanta-border bg-card hover:border-vanta-border-mid transition-colors group"
              >
                <Icon className="w-3.5 h-3.5 text-vanta-text-low shrink-0" />
                <span className="flex-1 font-mono text-[11px] text-foreground truncate">
                  {displayName}
                </span>
                {f.metadata?.size && (
                  <span className="font-mono text-[8px] text-vanta-text-muted shrink-0">
                    {formatSize(f.metadata.size)}
                  </span>
                )}
                <a
                  href={getPublicUrl(f.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vanta-text-muted hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                {!compact && (
                  <button
                    onClick={() => handleDelete(f.name)}
                    className="text-vanta-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
