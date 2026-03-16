import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, Send, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ROUTES = [
  { label: "Dashboard", path: "/" },
  { label: "Signals", path: "/signals" },
  { label: "Contacts", path: "/contacts" },
  { label: "Brain Dump", path: "/brain-dump" },
  { label: "Graph", path: "/graph" },
  { label: "Briefings", path: "/briefing" },
  { label: "Settings", path: "/settings" },
  { label: "Noise Queue", path: "/noise-queue" },
  { label: "User Modes", path: "/user-modes" },
  { label: "Release Notes", path: "/releases" },
];

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"navigate" | "capture">("navigate");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        setInput("");
        setMode("navigate");
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleToggle();
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleToggle]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filteredRoutes = input
    ? ROUTES.filter((r) => r.label.toLowerCase().includes(input.toLowerCase()))
    : ROUTES;

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleCapture = async () => {
    if (!input.trim() || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("brain-dump", {
        body: { text: input.trim() },
      });
      if (error) throw error;
      toast.success("Captured to signal feed");
      setInput("");
      setOpen(false);
    } catch {
      toast.error("Capture failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && mode === "capture") {
      e.preventDefault();
      handleCapture();
    } else if (e.key === "Enter" && mode === "navigate" && filteredRoutes.length > 0) {
      handleNavigate(filteredRoutes[0].path);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setMode(mode === "navigate" ? "capture" : "navigate");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[520px] z-[101] animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="border border-vanta-border bg-card shadow-2xl">
          {/* Mode tabs */}
          <div className="flex border-b border-vanta-border">
            <button
              onClick={() => setMode("navigate")}
              className={`flex-1 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                mode === "navigate"
                  ? "text-foreground bg-vanta-bg-elevated"
                  : "text-vanta-text-muted hover:text-foreground"
              }`}
            >
              Navigate
            </button>
            <button
              onClick={() => setMode("capture")}
              className={`flex-1 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                mode === "capture"
                  ? "text-foreground bg-vanta-bg-elevated"
                  : "text-vanta-text-muted hover:text-foreground"
              }`}
            >
              Quick Capture
            </button>
          </div>

          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-vanta-border">
            {mode === "navigate" ? (
              <Search className="w-4 h-4 text-vanta-text-muted shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-vanta-accent shrink-0" />
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "navigate" ? "Go to…" : "Quick thought…"}
              className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-vanta-text-muted outline-none"
            />
            {mode === "capture" && input.trim() && (
              <button
                onClick={handleCapture}
                disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Save
              </button>
            )}
            <button onClick={() => setOpen(false)} className="text-vanta-text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          {mode === "navigate" && (
            <div className="max-h-[300px] overflow-y-auto">
              {filteredRoutes.map((r) => (
                <button
                  key={r.path}
                  onClick={() => handleNavigate(r.path)}
                  className="w-full text-left px-4 py-2.5 font-mono text-[12px] text-vanta-text-mid hover:text-foreground hover:bg-vanta-bg-elevated transition-colors flex items-center justify-between"
                >
                  {r.label}
                  <span className="text-[9px] text-vanta-text-muted">{r.path}</span>
                </button>
              ))}
              {filteredRoutes.length === 0 && (
                <p className="px-4 py-6 text-center font-mono text-[10px] text-vanta-text-muted">
                  No matches — press Tab to switch to Quick Capture
                </p>
              )}
            </div>
          )}

          {mode === "capture" && !input.trim() && (
            <div className="px-4 py-6 text-center">
              <p className="font-mono text-[10px] text-vanta-text-muted">
                Type a thought and press Enter to capture it as a signal
              </p>
            </div>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-vanta-border flex items-center gap-4">
            <span className="font-mono text-[8px] text-vanta-text-muted">
              <kbd className="px-1 py-0.5 border border-vanta-border rounded text-[8px]">Tab</kbd> switch mode
            </span>
            <span className="font-mono text-[8px] text-vanta-text-muted">
              <kbd className="px-1 py-0.5 border border-vanta-border rounded text-[8px]">Esc</kbd> close
            </span>
            <span className="font-mono text-[8px] text-vanta-text-muted">
              <kbd className="px-1 py-0.5 border border-vanta-border rounded text-[8px]">⌘K</kbd> toggle
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
