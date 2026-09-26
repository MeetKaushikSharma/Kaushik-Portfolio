import { useState } from "react";
import {
  PROTOCOL_STAGES,
  type ProtocolState,
  type StageId,
  stageById,
} from "@/lib/protocolEngine";

interface ProtocolMeterProps {
  state: ProtocolState;
  onStageHover?: (stageId: StageId | null) => void;
  onStageClick?: (stageId: StageId) => void;
}

export function ProtocolMeter({ state, onStageHover, onStageClick }: ProtocolMeterProps) {
  const [hovered, setHovered] = useState<StageId | null>(null);

  const handleEnter = (id: StageId) => {
    setHovered(id);
    onStageHover?.(id);
  };

  const handleLeave = () => {
    setHovered(null);
    onStageHover?.(null);
  };

  const activeStage = hovered ? stageById(hovered) : null;
  const percentage = Math.round((state.completed.length / PROTOCOL_STAGES.length) * 100);

  return (
    <aside
      className="proof-rail protocol-rail"
      aria-label={`Protocol ${state.completed.length} of ${PROTOCOL_STAGES.length} stages complete`}
    >
      <span className="vertical-label">
        PROOF / {String(state.completed.length).padStart(2, "0")}
      </span>

      <div className="protocol-track" role="list" aria-label="Protocol stage checkpoints">
        {PROTOCOL_STAGES.map((stage, index) => {
          const done = state.completed.includes(stage.id);
          const isCurrent = !done && index === state.completed.length;
          return (
            <button
              key={stage.id}
              type="button"
              className={`protocol-node ${done ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
              aria-label={`Stage ${stage.number}: ${stage.title} (${done ? "Completed" : isCurrent ? "Active" : "Locked"}). Click to navigate.`}
              data-cursor-text={done ? "VERIFIED" : "JUMP"}
              onClick={() => onStageClick?.(stage.id)}
              onMouseEnter={() => handleEnter(stage.id)}
              onMouseLeave={handleLeave}
              onFocus={() => handleEnter(stage.id)}
              onBlur={handleLeave}
            >
              <span className="protocol-node-icon" aria-hidden="true">
                {done ? "✓" : stage.icon}
              </span>
              <span className="protocol-node-num">{stage.number}</span>
            </button>
          );
        })}
      </div>

      <span className="font-mono text-[10px] tracking-wider font-semibold">
        {percentage}%
      </span>

      {activeStage && (
        <div className="protocol-tooltip" role="tooltip">
          <span className="protocol-tooltip-num">STAGE {activeStage.number} // {activeStage.id.toUpperCase()}</span>
          <strong>{activeStage.title}</strong>
          <p>{activeStage.description}</p>
        </div>
      )}
    </aside>
  );
}