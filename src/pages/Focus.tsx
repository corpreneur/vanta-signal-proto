import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Motion } from "@/components/ui/motion";
import {
  SlidersHorizontal,
  Filter,
  Palette,
  BookOpen,
  Zap,
  Eye,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import UserModes from "./UserModes";
import NoiseQueue from "./NoiseQueue";
import CustomSignalTypes from "@/components/CustomSignalTypes";
import MyRules from "@/components/MyRules";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import SourcePriorityWeights from "@/components/SourcePriorityWeights";
import ViewfinderPills from "@/components/ViewfinderPills";

const TAB_MAP: Record<string, string> = {
  modes: "modes",
  weights: "weights",
  noise: "noise",
  types: "types",
  rules: "rules",
  workflows: "workflows",
};

export default function Focus() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = TAB_MAP[tabParam || ""] || "modes";
  const [configOpen, setConfigOpen] = useState(false);

  const handleTabChange = (value: string) => {
    if (value === "modes") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  return (
    <div className="max-w-[960px] mx-auto px-0 pt-0 pb-16">
      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Viewfinder · Signal Control
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            Filter Modes
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-2 max-w-xl">
            Your viewfinder. Choose how to look at what's most important — then customize how signals are filtered, weighted, and classified below.
          </p>
        </header>
      </Motion>

      {/* Viewfinder — primary experience */}
      <ViewfinderPills />

      {/* Collapsible config section */}
      <div className="border-t border-border pt-6">
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="flex items-center gap-2 mb-6 group"
        >
          <Settings2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground transition-colors">
            Customize Filters & Rules
          </span>
          {configOpen ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </button>

        {configOpen && (
          <Motion>
            <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start bg-card border border-border mb-8 flex-wrap">
                <TabsTrigger
                  value="modes"
                  className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-muted"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Modes
                </TabsTrigger>
                <TabsTrigger
                  value="weights"
                  className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-muted"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Source Weights
                </TabsTrigger>
                <TabsTrigger
                  value="noise"
                  className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-muted"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Noise Queue
                </TabsTrigger>
                <TabsTrigger
                  value="types"
                  className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-muted"
                >
                  <Palette className="w-3.5 h-3.5" />
                  Signal Types
                </TabsTrigger>
                <TabsTrigger
                  value="rules"
                  className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-muted"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  My Rules
                </TabsTrigger>
                <TabsTrigger
                  value="workflows"
                  className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-muted"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Workflows
                </TabsTrigger>
              </TabsList>

              <TabsContent value="modes">
                <UserModes />
              </TabsContent>
              <TabsContent value="weights">
                <SourcePriorityWeights />
              </TabsContent>
              <TabsContent value="noise">
                <NoiseQueue />
              </TabsContent>
              <TabsContent value="types">
                <CustomSignalTypes />
              </TabsContent>
              <TabsContent value="rules">
                <MyRules />
              </TabsContent>
              <TabsContent value="workflows">
                <WorkflowBuilder />
              </TabsContent>
            </Tabs>
          </Motion>
        )}
      </div>
    </div>
  );
}
