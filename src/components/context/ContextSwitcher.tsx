import { Briefcase, FolderOpen, Banknote, User } from "lucide-react";
import { useUserContexts, useUserPreferences } from "@/hooks/use-user-preferences";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  client: Briefcase,
  project: FolderOpen,
  income_stream: Banknote,
  personal: User,
};

export default function ContextSwitcher() {
  const { contexts } = useUserContexts();
  const { prefs, updatePrefs } = useUserPreferences();

  if (contexts.length <= 1) return null;

  const handleSwitch = (id: string) => {
    updatePrefs({ active_context_id: id });
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
      {contexts.map((ctx) => {
        const Icon = TYPE_ICONS[ctx.context_type] || User;
        const isActive = ctx.id === prefs.active_context_id;
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
