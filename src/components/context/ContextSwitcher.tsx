import { useState, useEffect } from "react";
import { Briefcase, FolderOpen, Banknote, User } from "lucide-react";

interface BusinessContext {
  id: string;
  name: string;
  type: "client" | "project" | "income_stream" | "personal";
  isPrimary: boolean;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  client: Briefcase,
  project: FolderOpen,
  income_stream: Banknote,
  personal: User,
};

export default function ContextSwitcher() {
  const [contexts, setContexts] = useState<BusinessContext[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vanta_contexts");
      const active = localStorage.getItem("vanta_active_context");
      if (stored) {
        const parsed = JSON.parse(stored) as BusinessContext[];
        setContexts(parsed);
        setActiveId(active || parsed.find((c) => c.isPrimary)?.id || parsed[0]?.id || "");
      }
    } catch { /* ignore */ }
  }, []);

  if (contexts.length <= 1) return null;

  const handleSwitch = (id: string) => {
    setActiveId(id);
    localStorage.setItem("vanta_active_context", id);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
      {contexts.map((ctx) => {
        const Icon = TYPE_ICONS[ctx.type] || User;
        const isActive = ctx.id === activeId;
        return (
          <button
            key={ctx.id}
            onClick={() => handleSwitch(ctx.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap rounded-sm border transition-all ${
              isActive
                ? "bg-[hsl(270_60%_60%)] text-white border-[hsl(270_60%_60%)]"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {ctx.name}
          </button>
        );
      })}
    </div>
  );
}
