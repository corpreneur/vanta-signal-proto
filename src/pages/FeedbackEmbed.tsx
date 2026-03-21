import { useState } from "react";
import { Copy, Check, Code2, ExternalLink, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ENDPOINT = `https://fwmrhpayssaiuhqzzeig.supabase.co/functions/v1/feedback-widget`;
const WIDGET_URL = `https://vantasignal.lovable.app/feedback-widget.js`;

const SCRIPT_SNIPPET = `<script
  src="${WIDGET_URL}"
  data-endpoint="${ENDPOINT}"
  data-theme="dark"
  defer
><\/script>`;

const IFRAME_SNIPPET = `<!-- Alternative: iframe embed (no JS required) -->
<iframe
  src="https://vantasignal.lovable.app/feedback-widget.js"
  style="display:none"
></iframe>`;

function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary hover:text-primary/80 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-card border border-border rounded-sm p-4 overflow-x-auto text-[12px] leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

export default function FeedbackEmbed() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Platform · Feedback Widget
        </p>
        <h1 className="font-sans text-[28px] font-extrabold tracking-tight text-foreground mb-1">
          Embed Feedback Widget
        </h1>
        <p className="font-sans text-[14px] text-muted-foreground">
          Drop a single script tag into any site to collect feedback directly into Signal.
        </p>
      </div>

      {/* How it works */}
      <div className="border border-border rounded-sm p-5 bg-card/50 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            How It Works
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "Paste snippet",
              desc: "Add the script tag to any HTML page. No build tools needed.",
            },
            {
              step: "02",
              title: "Visitors submit",
              desc: "A floating button opens a feedback form inside an isolated Shadow DOM.",
            },
            {
              step: "03",
              title: "Lands in Signal",
              desc: "Submissions appear in /feedback — ready for AI analysis and sprint triage.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="font-mono text-[18px] font-bold text-primary/30">
                {item.step}
              </span>
              <div>
                <p className="font-sans text-[13px] font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="font-sans text-[12px] text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code snippets */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Embed Code
          </span>
        </div>
        <CopyBlock label="Script Tag (recommended)" code={SCRIPT_SNIPPET} />
      </div>

      {/* Configuration */}
      <div className="border border-border rounded-sm p-5 bg-card/50 mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground block mb-4">
          Configuration Options
        </span>
        <div className="space-y-3">
          {[
            {
              attr: "data-endpoint",
              desc: "Backend function URL (required)",
              example: ENDPOINT,
            },
            {
              attr: "data-theme",
              desc: 'Widget color scheme — "light" or "dark"',
              example: '"dark"',
            },
          ].map((opt) => (
            <div key={opt.attr} className="flex items-start gap-3">
              <Badge
                variant="outline"
                className="shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-sm border-primary/30 text-primary bg-primary/5"
              >
                {opt.attr}
              </Badge>
              <div>
                <p className="font-sans text-[13px] text-foreground">{opt.desc}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{opt.example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="border border-border rounded-sm p-4 bg-card/30">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Security
        </p>
        <ul className="space-y-1.5 text-[12px] text-muted-foreground font-sans leading-relaxed">
          <li>• No auth tokens exposed — the edge function uses service role internally</li>
          <li>• Rate limited to 10 submissions per IP per hour</li>
          <li>• Input sanitized and length-capped server-side</li>
          <li>• Shadow DOM isolates widget styles from host page</li>
        </ul>
      </div>
    </div>
  );
}
