import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Briefcase, FolderOpen, Banknote, User, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { Motion } from "@/components/ui/motion";

type ContextType = "client" | "project" | "income_stream" | "personal";

interface DraftContext {
  id: string;
  name: string;
  type: ContextType;
}

const TYPE_OPTIONS: { value: ContextType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "client", label: "Client", icon: Briefcase },
  { value: "project", label: "Project", icon: FolderOpen },
  { value: "income_stream", label: "Income Stream", icon: Banknote },
  { value: "personal", label: "Personal", icon: User },
];

export default function ContextLayerSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [inputVal, setInputVal] = useState("");
  const [contexts, setContexts] = useState<DraftContext[]>([]);
  const [primaryId, setPrimaryId] = useState<string>("");

  const addContext = () => {
    const name = inputVal.trim();
    if (!name || contexts.length >= 5) return;
    const id = crypto.randomUUID();
    setContexts((c) => [...c, { id, name, type: "client" }]);
    setInputVal("");
  };

  const removeContext = (id: string) => {
    setContexts((c) => c.filter((x) => x.id !== id));
    if (primaryId === id) setPrimaryId("");
  };

  const setType = (id: string, type: ContextType) => {
    setContexts((c) => c.map((x) => (x.id === id ? { ...x, type } : x)));
  };

  const finish = () => {
    const final = contexts.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      isPrimary: c.id === primaryId,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem("vanta_contexts", JSON.stringify(final));
    localStorage.setItem("vanta_context_setup", "true");
    localStorage.setItem("vanta_active_context", primaryId);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <Motion>
        <div className="w-full max-w-lg">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-sm transition-all duration-300 ${
                  s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/40" : "w-4 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h1 className="font-display text-[28px] text-foreground mb-2">What are you working on?</h1>
              <p className="font-sans text-[14px] text-muted-foreground mb-8 leading-relaxed">
                Add up to 5 business contexts — clients, projects, or income streams — so Signal knows what matters to you.
              </p>
              <div className="flex gap-2 mb-6">
                <input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addContext()}
                  placeholder="Client name, project, or income stream…"
                  className="flex-1 bg-card border border-border px-4 py-3 font-sans text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors rounded-sm"
                  maxLength={40}
                />
                <button
                  onClick={addContext}
                  disabled={!inputVal.trim() || contexts.length >= 5}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {contexts.map((c) => (
                  <span key={c.id} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-sm font-mono text-[11px] uppercase tracking-wider text-foreground">
                    {c.name}
                    <button onClick={() => removeContext(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              {contexts.length > 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h1 className="font-display text-[28px] text-foreground mb-2">What type is each?</h1>
              <p className="font-sans text-[14px] text-muted-foreground mb-8 leading-relaxed">
                Tag each context so Signal can prioritize intelligence correctly.
              </p>
              <div className="space-y-4 mb-8">
                {contexts.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-sm p-4">
                    <p className="font-mono text-[12px] uppercase tracking-wider text-foreground mb-3">{c.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TYPE_OPTIONS.map((opt) => {
                        const isSelected = c.type === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setType(c.id, opt.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider rounded-sm border transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-transparent text-muted-foreground border-border hover:border-foreground/20"
                            }`}
                          >
                            <opt.icon className="w-3.5 h-3.5" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-3 border border-border text-muted-foreground font-mono text-[11px] uppercase tracking-wider rounded-sm hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h1 className="font-display text-[28px] text-foreground mb-2">Which is your main focus?</h1>
              <p className="font-sans text-[14px] text-muted-foreground mb-8 leading-relaxed">
                Signal Brief will prioritize this context.
              </p>
              <div className="space-y-2 mb-8">
                {contexts.map((c) => {
                  const TypeIcon = TYPE_OPTIONS.find((o) => o.value === c.type)?.icon || Briefcase;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setPrimaryId(c.id)}
                      className={`w-full flex items-center gap-3 px-4 py-4 border rounded-sm transition-all text-left ${
                        primaryId === c.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        primaryId === c.id ? "border-[hsl(270_60%_60%)]" : "border-muted-foreground/30"
                      }`}>
                        {primaryId === c.id && <div className="w-2.5 h-2.5 rounded-full bg-[hsl(270_60%_60%)]" />}
                      </div>
                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-[12px] uppercase tracking-wider text-foreground">{c.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-3 border border-border text-muted-foreground font-mono text-[11px] uppercase tracking-wider rounded-sm hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={finish}
                  disabled={!primaryId}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[hsl(270_60%_60%)] text-white font-mono text-[11px] uppercase tracking-wider rounded-sm hover:bg-[hsl(270_60%_50%)] disabled:opacity-30 transition-colors"
                >
                  <Zap className="w-4 h-4" /> Activate Signal Brief
                </button>
              </div>
            </div>
          )}
        </div>
      </Motion>
    </div>
  );
}
