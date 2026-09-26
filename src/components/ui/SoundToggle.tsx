import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function SoundToggle({ enabled, onToggle, className = "" }: SoundToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      aria-label={enabled ? "Sound effects active. Click to mute." : "Sound effects muted. Click to enable."}
      data-cursor-text={enabled ? "MUTE" : "UNMUTE"}
      className={`relative flex items-center gap-2 border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-mono uppercase tracking-wider backdrop-blur transition-colors hover:border-foreground/40 hover:bg-foreground/5 ${className}`}
    >
      {enabled ? (
        <>
          <div className="flex items-end gap-[2px] h-3.5 w-3" aria-hidden="true">
            <span className="w-[2px] bg-foreground animate-[soundBar_0.8s_ease-in-out_infinite] h-2" />
            <span className="w-[2px] bg-foreground animate-[soundBar_0.6s_ease-in-out_infinite_0.2s] h-3.5" />
            <span className="w-[2px] bg-foreground animate-[soundBar_1.0s_ease-in-out_infinite_0.4s] h-1.5" />
          </div>
          <span className="hidden sm:inline text-[10px]">AUDIO: ON</span>
        </>
      ) : (
        <>
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="hidden sm:inline text-[10px] text-muted-foreground">AUDIO: OFF</span>
        </>
      )}
    </Button>
  );
}
