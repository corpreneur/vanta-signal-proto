import { Mic, MicOff, Zap } from "lucide-react";

interface Props {
  activeSpeaker: string;
  isStreaming: boolean;
}

const TILES = [
  { name: "You", initials: "WT", muted: false },
  { name: "Sarah Chen", initials: "SC", muted: false },
  { name: "Marcus Rivera", initials: "MR", muted: true },
  { name: "Vanta Signal", initials: "VS", muted: false, isAI: true },
];

export default function VideoGrid({ activeSpeaker, isStreaming }: Props) {
  return (
    <div className="border border-border p-2 space-y-1.5">
      <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
        Session video
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {TILES.map((tile) => {
          const isActive = activeSpeaker === tile.name;
          return (
            <div
              key={tile.name}
              className={`relative flex flex-col items-center justify-center gap-1 py-4 border transition-all duration-300 ${
                isActive
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-border bg-muted/30"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 flex items-center justify-center font-mono text-[10px] font-bold transition-colors duration-300 ${
                  tile.isAI
                    ? "bg-foreground text-background"
                    : isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {tile.isAI ? <Zap className="h-3.5 w-3.5" /> : tile.initials}
              </div>

              {/* Name */}
              <span className="font-mono text-[8px] text-foreground">{tile.name}</span>

              {/* Mic state */}
              <div className="absolute top-1.5 right-1.5">
                {tile.isAI ? (
                  isStreaming ? (
                    <div className="flex gap-[2px] items-end h-3">
                      {[1, 2, 3].map((bar) => (
                        <div
                          key={bar}
                          className="w-[2px] bg-foreground animate-pulse"
                          style={{
                            height: `${4 + bar * 3}px`,
                            animationDelay: `${bar * 150}ms`,
                          }}
                        />
                      ))}
                    </div>
                  ) : null
                ) : tile.muted ? (
                  <MicOff className="h-3 w-3 text-destructive/60" />
                ) : (
                  <Mic className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Active speaker pulse dot */}
              {isActive && (
                <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
