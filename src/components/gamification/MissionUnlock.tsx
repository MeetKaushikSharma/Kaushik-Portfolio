import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSoundDesign } from "@/hooks/useSoundDesign";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ProtocolStage } from "@/lib/protocolEngine";

interface MissionUnlockProps {
  unlockedStage: ProtocolStage | null;
  totalCompleted: number;
  totalStages: number;
  onDismiss: () => void;
}

export function MissionUnlock({
  unlockedStage,
  totalCompleted,
  totalStages,
  onDismiss,
}: MissionUnlockProps) {
  const isReducedMotion = useReducedMotion();
  const { sounds } = useSoundDesign();
  const [closing, setClosing] = useState(false);

  const isAllComplete = totalCompleted >= totalStages;
  const isContactUnlocked = totalCompleted === 3;

  useEffect(() => {
    if (!unlockedStage) return;

    sounds.unlock();

    // Auto-dismiss after 6 seconds unless user dismisses earlier
    const timer = setTimeout(() => {
      handleClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [unlockedStage]);

  if (!unlockedStage) return null;

  const handleClose = () => {
    setClosing(true);
    sounds.click();
    setTimeout(() => {
      setClosing(false);
      onDismiss();
    }, 300);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Mission protocol update"
      className={`fixed bottom-6 left-6 z-50 max-w-sm sm:max-w-md border border-foreground/30 bg-background/95 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        closing
          ? "opacity-0 translate-y-3 scale-95"
          : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5"
      }`}
    >
      {/* Glitch & scanner line effect */}
      {!isReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden opacity-10"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-foreground to-transparent animate-[scan_2s_linear_infinite]" />
        </div>
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {isAllComplete ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <Sparkles className="h-5 w-5 text-foreground" />
          )}
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            {isAllComplete
              ? "MAXIMUM PROTOCOL CLEARANCE"
              : isContactUnlocked
              ? "CONTACT PROTOCOL UNLOCKED"
              : "STAGE VERIFIED"}
          </span>
        </div>

        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            STAGE {unlockedStage.number} // {unlockedStage.title.toUpperCase()}
          </span>
          <span className="inline-block rounded border border-foreground/40 px-1 py-0.2 font-mono text-[9px] uppercase">
            LOGGED
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {unlockedStage.description}
        </p>

        {isAllComplete && (
          <div className="mt-3 border-t border-foreground/20 pt-2 font-mono text-[11px] text-emerald-400 font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Full protocol complete · 100% evidence verified
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-24 bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-500"
              style={{ width: `${(totalCompleted / totalStages) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {totalCompleted}/{totalStages} STAGES
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          className="h-7 rounded-none px-3 font-mono text-[10px] uppercase"
        >
          Acknowledge
        </Button>
      </div>
    </div>
  );
}
