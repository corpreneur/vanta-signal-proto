import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckSquare, Plus, Calendar, Clock, User, ExternalLink, RefreshCw, Link2 } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ConnectionStatus = "disconnected" | "connecting" | "connected";
type TaskProvider = "asana" | "linear" | "notion";

interface LinkedTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string | null;
  status: "todo" | "in_progress" | "done";
  signalSummary: string;
  provider: TaskProvider;
}

const PROVIDERS: { key: TaskProvider; label: string; desc: string }[] = [
  { key: "asana", label: "Asana", desc: "Project management and task tracking" },
  { key: "linear", label: "Linear", desc: "Issue tracking for software teams" },
  { key: "notion", label: "Notion", desc: "Notes, tasks, and knowledge base" },
];

const DEMO_TASKS: LinkedTask[] = [
  { id: "1", title: "Follow up on Series B term sheet", assignee: "You", dueDate: "2026-03-30", status: "in_progress", signalSummary: "Investment signal from Marcus Chen", provider: "asana" },
  { id: "2", title: "Send partnership deck to Relay team", assignee: "You", dueDate: "2026-04-01", status: "todo", signalSummary: "Intro signal — Jordan Lee", provider: "asana" },
  { id: "3", title: "Review Q1 performance data", assignee: "You", dueDate: null, status: "done", signalSummary: "Insight from weekly digest", provider: "asana" },
];

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  todo: { label: "To do", cls: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "In progress", cls: "bg-primary/10 text-primary border-primary/20" },
  done: { label: "Done", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

export default function TaskIntegration() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [provider, setProvider] = useState<TaskProvider>("asana");
  const [tasks] = useState<LinkedTask[]>(DEMO_TASKS);
  const [autoCreate, setAutoCreate] = useState(true);

  const handleConnect = () => {
    setStatus("connecting");
    setTimeout(() => {
      setStatus("connected");
      toast.success(`${PROVIDERS.find((p) => p.key === provider)?.label} connected successfully`);
    }, 1800);
  };

  const handleDisconnect = () => {
    setStatus("disconnected");
    toast.info("Disconnected");
  };

  return (
    <div className="max-w-[640px] mx-auto px-5 py-8 md:py-12">
      <Link
        to="/settings/connected"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Connected accounts
      </Link>

      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Integration · Task Management
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            Task management
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-2 max-w-xl">
            Link your task manager to auto-create action items from signals and track completion.
          </p>
        </header>
      </Motion>

      {/* Provider selector */}
      <Motion delay={20}>
        <div className="border border-border bg-card p-5 mb-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Select provider
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => { if (status === "disconnected") setProvider(p.key); }}
                className={`p-3 border text-left transition-colors ${
                  provider === p.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/10"
                }`}
              >
                <p className="font-mono text-[11px] font-medium text-foreground">{p.label}</p>
                <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </Motion>

      {/* Connection status */}
      <Motion delay={40}>
        <div className="border border-border bg-card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-mono text-[13px] font-medium text-foreground">
                  {PROVIDERS.find((p) => p.key === provider)?.label}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {status === "connected" ? "Syncing bi-directionally" : "Not connected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 ${
                status === "connected" ? "bg-emerald-500 animate-pulse" :
                status === "connecting" ? "bg-amber-500 animate-pulse" :
                "bg-muted-foreground"
              }`} />
              <span className={`font-mono text-[9px] uppercase tracking-widest ${
                status === "connected" ? "text-emerald-600" :
                status === "connecting" ? "text-amber-600" :
                "text-muted-foreground"
              }`}>
                {status === "connected" ? "Connected" : status === "connecting" ? "Connecting…" : "Disconnected"}
              </span>
            </div>
          </div>

          {status === "disconnected" && (
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 border border-primary/30 text-primary font-mono text-[11px] uppercase tracking-widest hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Connect {PROVIDERS.find((p) => p.key === provider)?.label}
            </button>
          )}

          {status === "connecting" && (
            <div className="flex items-center justify-center gap-2 py-3">
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="font-mono text-[11px] text-amber-600">Authorizing…</span>
            </div>
          )}

          {status === "connected" && (
            <button
              onClick={handleDisconnect}
              className="w-full text-center font-mono text-[10px] text-destructive hover:underline"
            >
              Disconnect
            </button>
          )}
        </div>
      </Motion>

      {/* Auto-create setting */}
      <Motion delay={60}>
        <div className="border border-border bg-card p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] font-medium text-foreground">Auto-create tasks from signals</p>
              <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                When a high-priority signal has an action item, automatically create a linked task
              </p>
            </div>
            <button
              onClick={() => setAutoCreate(!autoCreate)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                autoCreate ? "bg-primary" : "bg-muted"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
                autoCreate ? "left-[22px]" : "left-0.5"
              }`} />
            </button>
          </div>
        </div>
      </Motion>

      {/* Linked tasks */}
      <Motion delay={80}>
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Linked tasks
            </p>
            <span className="font-mono text-[9px] text-muted-foreground">{tasks.length} items</span>
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckSquare className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                No linked tasks yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tasks.map((task) => {
                const st = STATUS_STYLES[task.status];
                return (
                  <div key={task.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 flex items-center justify-center mt-0.5 shrink-0 ${
                        task.status === "done" ? "text-emerald-600" : "text-muted-foreground"
                      }`}>
                        {task.status === "done" ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <div className="w-3.5 h-3.5 border border-current" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-sans text-[13px] text-foreground ${task.status === "done" ? "line-through opacity-60" : ""}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0 h-[16px] rounded-sm border ${st.cls}`}>
                            {st.label}
                          </Badge>
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                            <Link2 className="w-2.5 h-2.5" />
                            {task.signalSummary}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Motion>
    </div>
  );
}
