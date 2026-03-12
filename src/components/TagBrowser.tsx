import type { SignalType } from "@/data/signals";
import { SIGNAL_TYPE_COLORS } from "@/data/signals";

interface TagCount {
  type: SignalType;
  count: number;
}

interface TagBrowserProps {
  tagCounts: TagCount[];
  activeType: SignalType | "ALL";
  onSelect: (type: SignalType | "ALL") => void;
}

const TagBrowser = ({ tagCounts, activeType, onSelect }: TagBrowserProps) => {
  const total = tagCounts.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="mb-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vanta-text-muted mb-3">
        Signal Types
      </p>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-vanta-border">
        {/* All */}
        <button
          onClick={() => onSelect("ALL")}
          className={`flex flex-col items-center justify-center p-3 transition-colors ${
            activeType === "ALL"
              ? "bg-vanta-accent-faint border border-vanta-accent-border"
              : "bg-vanta-bg-elevated border border-transparent hover:bg-vanta-bg"
          }`}
        >
          <span
            className={`font-mono text-[18px] font-bold ${
              activeType === "ALL" ? "text-vanta-accent" : "text-vanta-text"
            }`}
          >
            {total}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted mt-1">
            All
          </span>
        </button>

        {tagCounts.map(({ type, count }) => {
          const colors = SIGNAL_TYPE_COLORS[type];
          const isActive = activeType === type;

          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`flex flex-col items-center justify-center p-3 transition-colors ${
                isActive
                  ? `${colors.bg} border ${colors.border}`
                  : "bg-vanta-bg-elevated border border-transparent hover:bg-vanta-bg"
              }`}
            >
              <span
                className={`font-mono text-[18px] font-bold ${
                  isActive ? colors.text : "text-vanta-text"
                }`}
              >
                {count}
              </span>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.15em] mt-1 ${
                  isActive ? colors.text : "text-vanta-text-muted"
                }`}
              >
                {type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagBrowser;
