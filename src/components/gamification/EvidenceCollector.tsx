import { useEffect } from "react";
import { useSoundDesign } from "@/hooks/useSoundDesign";

interface EvidenceCollectorProps {
  active: boolean;
  targetX?: number;
  targetY?: number;
  count?: number;
  label?: string;
  onDone?: () => void;
}

export function EvidenceCollector({ active, onDone }: EvidenceCollectorProps) {
  const { sounds } = useSoundDesign();

  useEffect(() => {
    if (!active) return;
    sounds.collect();
    // Call onDone after a brief moment so state resets cleanly
    const timer = setTimeout(() => onDone?.(), 400);
    return () => clearTimeout(timer);
  }, [active]);

  return null;
}