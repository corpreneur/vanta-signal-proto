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
} from "lucide-react";
import UserModes from "./UserModes";
import NoiseQueue from "./NoiseQueue";
import CustomSignalTypes from "@/components/CustomSignalTypes";
import MyRules from "@/components/MyRules";
import SourcePriorityWeights from "@/components/SourcePriorityWeights";

const TAB_MAP: Record<string, string> = {
  modes: "modes",
  weights: "weights",
  noise: "noise",
  types: "types",
  rules: "rules",
};

export default function Focus() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = TAB_MAP[tabParam || ""] || "modes";

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
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-low">
              Focus · Signal Control
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            Focus
          </h1>
          <p className="text-vanta-text-low text-xs font-mono mt-2 max-w-xl">
            Control how signals are filtered, weighted, and classified. Set your operating mode, tune source priorities, manage noise rules, and define custom signal types.
          </p>
        </header>
      </Motion>

      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start bg-vanta-bg border border-vanta-border mb-8 flex-wrap">
          <TabsTrigger
            value="modes"
            className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated"
          >
            <Eye className="w-3.5 h-3.5" />
            Modes
          </TabsTrigger>
          <TabsTrigger
            value="weights"
            className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Source Weights
          </TabsTrigger>
          <TabsTrigger
            value="noise"
            className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated"
          >
            <Filter className="w-3.5 h-3.5" />
            Noise Queue
          </TabsTrigger>
          <TabsTrigger
            value="types"
            className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated"
          >
            <Palette className="w-3.5 h-3.5" />
            Signal Types
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="font-mono text-[11px] uppercase tracking-widest gap-1.5 data-[state=active]:bg-vanta-bg-elevated"
          >
            <BookOpen className="w-3.5 h-3.5" />
            My Rules
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
      </Tabs>
    </div>
  );
}
