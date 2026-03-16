import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Palette } from "lucide-react";

interface CustomSignalType {
  id: string;
  type_name: string;
  description: string | null;
  color_text: string;
  color_bg: string;
  color_border: string;
  training_examples: string[];
  created_at: string;
}

export default function CustomSignalTypes() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [examples, setExamples] = useState("");

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["custom-signal-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_signal_types").select("*").order("created_at");
      if (error) throw error;
      return (data || []) as CustomSignalType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const exampleArray = examples.split("\n").map((e) => e.trim()).filter(Boolean);
      const { error } = await supabase.from("custom_signal_types").insert({
        type_name: name.toUpperCase().replace(/\s+/g, "_"),
        description,
        training_examples: exampleArray as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-signal-types"] });
      toast.success("Custom signal type created");
      setShowForm(false);
      setName("");
      setDescription("");
      setExamples("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_signal_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-signal-types"] });
      toast.success("Custom type deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low border-b border-vanta-border pb-2 mb-1">
            Custom Signal Types
          </h2>
          <p className="font-mono text-[11px] text-vanta-text-muted mt-2">
            Define custom classification categories for the AI to learn. {types.length} custom type{types.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border border-vanta-accent text-vanta-accent hover:bg-vanta-accent-faint transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Type
        </button>
      </div>

      {showForm && (
        <div className="border border-vanta-accent-border bg-vanta-bg-elevated p-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type name (e.g., PARTNERSHIP)"
            className="w-full bg-background border border-vanta-border px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-vanta-accent-border"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description…"
            className="w-full bg-background border border-vanta-border px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-vanta-accent-border"
          />
          <textarea
            value={examples}
            onChange={(e) => setExamples(e.target.value)}
            placeholder="Training examples (one per line)…"
            rows={4}
            className="w-full bg-background border border-vanta-border px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-vanta-accent-border resize-y"
          />
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
              className="px-4 py-1.5 bg-vanta-accent text-vanta-bg font-mono text-[10px] uppercase tracking-widest hover:bg-vanta-accent/90 disabled:opacity-50"
            >
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-vanta-border text-vanta-text-muted font-mono text-[10px] uppercase tracking-widest">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="font-mono text-xs text-vanta-text-muted uppercase tracking-widest">Loading…</div>
      ) : types.length === 0 ? (
        <div className="py-8 text-center border border-vanta-border bg-vanta-bg-elevated">
          <Palette className="w-6 h-6 text-vanta-text-muted mx-auto mb-2" />
          <p className="font-mono text-[11px] text-vanta-text-muted">No custom types yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {types.map((t) => (
            <div key={t.id} className="border border-vanta-border bg-vanta-bg-elevated p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[12px] font-medium text-foreground">{t.type_name}</span>
                <button onClick={() => deleteMutation.mutate(t.id)} className="text-vanta-text-muted hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {t.description && <p className="font-mono text-[10px] text-vanta-text-muted mb-2">{t.description}</p>}
              {t.training_examples && (t.training_examples as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(t.training_examples as string[]).slice(0, 3).map((ex, i) => (
                    <span key={i} className="px-2 py-0.5 font-mono text-[9px] border border-vanta-border text-vanta-text-low truncate max-w-[200px]">
                      {ex}
                    </span>
                  ))}
                  {(t.training_examples as string[]).length > 3 && (
                    <span className="font-mono text-[9px] text-vanta-text-muted">+{(t.training_examples as string[]).length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
