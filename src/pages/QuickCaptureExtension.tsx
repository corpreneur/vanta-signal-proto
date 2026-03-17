import { useState } from "react";
import { Copy, Check, Smartphone, Globe, Monitor, Zap, BookmarkPlus, ExternalLink } from "lucide-react";
import { Motion } from "@/components/ui/motion";
import { toast } from "sonner";

const BOOKMARKLET_CODE = `javascript:void(function(){var t=document.title,u=window.location.href,s=window.getSelection().toString().slice(0,500),p=encodeURIComponent(t+' | '+u+(s?' | '+s:''));window.open('${window.location.origin}/brain-dump?prefill='+p,'_blank','width=480,height=600')})()`;

export default function QuickCaptureExtension() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE);
    setCopied(true);
    toast.success("Bookmarklet copied — drag it to your bookmarks bar.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[960px] mx-auto px-0 pt-0 pb-16">
      <Motion>
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse-dot" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Universal Capture · OS Integration
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-tight">
            Quick Capture Everywhere
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-2 max-w-xl">
            Capture thoughts, links, and selections from any browser tab directly into Vanta Signal.
          </p>
        </header>
      </Motion>

      {/* Methods grid */}
      <div className="grid gap-px sm:grid-cols-3 border border-vanta-border bg-vanta-border mb-8">
        {/* Bookmarklet */}
        <Motion delay={40}>
          <div className="bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-vanta-accent/10 flex items-center justify-center ring-1 ring-vanta-accent/20 mb-4">
              <BookmarkPlus className="w-5 h-5 text-vanta-accent" />
            </div>
            <p className="font-mono text-[13px] font-medium text-foreground mb-1">Browser Bookmarklet</p>
            <p className="font-mono text-[10px] text-vanta-text-muted leading-relaxed mb-4">
              One-click capture from any webpage. Grabs the page title, URL, and selected text.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-vanta-accent-border text-vanta-accent font-mono text-[10px] uppercase tracking-widest hover:bg-vanta-accent/10 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Bookmarklet"}
              </button>
              <p className="font-mono text-[8px] text-vanta-text-low text-center">
                Drag to bookmarks bar or paste as bookmark URL
              </p>
            </div>
          </div>
        </Motion>

        {/* ⌘K Shortcut */}
        <Motion delay={80}>
          <div className="bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-vanta-accent/10 flex items-center justify-center ring-1 ring-vanta-accent/20 mb-4">
              <Zap className="w-5 h-5 text-vanta-accent" />
            </div>
            <p className="font-mono text-[13px] font-medium text-foreground mb-1">⌘K Quick Capture</p>
            <p className="font-mono text-[10px] text-vanta-text-muted leading-relaxed mb-4">
              Already built in. Press ⌘K (or Ctrl+K) from anywhere in Vanta to open the universal capture palette.
            </p>
            <div className="flex items-center justify-center gap-2 px-3 py-2 border border-vanta-border font-mono text-[11px] text-vanta-text-mid">
              <kbd className="px-1.5 py-0.5 bg-vanta-bg-elevated border border-vanta-border text-[10px]">⌘</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-vanta-bg-elevated border border-vanta-border text-[10px]">K</kbd>
            </div>
          </div>
        </Motion>

        {/* PWA Install */}
        <Motion delay={120}>
          <div className="bg-card p-6">
            <div className="w-10 h-10 rounded-lg bg-vanta-accent/10 flex items-center justify-center ring-1 ring-vanta-accent/20 mb-4">
              <Smartphone className="w-5 h-5 text-vanta-accent" />
            </div>
            <p className="font-mono text-[13px] font-medium text-foreground mb-1">Install as App</p>
            <p className="font-mono text-[10px] text-vanta-text-muted leading-relaxed mb-4">
              Install Vanta Signal as a Progressive Web App for quick access from your dock or home screen.
            </p>
            <div className="space-y-1.5 font-mono text-[9px] text-vanta-text-low">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" /> Chrome: Menu → Install app
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="w-3 h-3" /> Safari: Share → Add to Home Screen
              </div>
            </div>
          </div>
        </Motion>
      </div>

      {/* How it works */}
      <Motion delay={160}>
        <div className="border border-vanta-border bg-card p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-vanta-text-low mb-4">
            Capture Pipeline
          </h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: "1", label: "Capture", desc: "Text, URL, or selection is sent to Brain Dump" },
              { step: "2", label: "Classify", desc: "AI determines signal type, priority, and contacts" },
              { step: "3", label: "Enrich", desc: "URL scraping, entity extraction, context linking" },
              { step: "4", label: "Surface", desc: "New signal appears in your feed with actions" },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <span className="font-mono text-[18px] font-bold text-vanta-accent/30 shrink-0">{s.step}</span>
                <div>
                  <p className="font-mono text-[11px] font-medium text-foreground">{s.label}</p>
                  <p className="font-mono text-[9px] text-vanta-text-muted leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Motion>

      {/* Share URL */}
      <Motion delay={200}>
        <div className="mt-6 border border-vanta-border bg-vanta-bg-elevated p-4 flex items-center gap-3">
          <ExternalLink className="w-4 h-4 text-vanta-text-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] text-vanta-text-muted mb-0.5">Share URL for mobile capture</p>
            <p className="font-mono text-[11px] text-foreground truncate">
              {window.location.origin}/brain-dump?prefill=YOUR_TEXT
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/brain-dump?prefill=`);
              toast.success("Base URL copied");
            }}
            className="shrink-0 p-2 hover:bg-vanta-accent/10 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-vanta-text-muted" />
          </button>
        </div>
      </Motion>
    </div>
  );
}
