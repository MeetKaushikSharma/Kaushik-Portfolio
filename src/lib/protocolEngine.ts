/**
 * protocolEngine.ts
 *
 * Pure-logic gamification layer for "THE PROOF PROTOCOL".
 * No React here — just state, actions, and persistence. The components
 * consume this via a small React hook (useProtocol) that lives alongside.
 *
 * Protocol stages (5 total):
 *  01  Witness     — Hero / dossier seen
 *  02  Interrogate — Mission control explored
 *  03  Evidence    — Projects inspected
 *  04  Prove       — Achievements / skills reviewed
 *  05  Complete    — Contact established
 *
 * Unlock rules:
 *  - 3 stages → "Contact unlocked" prompt
 *  - 5 stages → "Protocol Complete" badge + shareable state
 */

const STORAGE_KEY = "ks_protocol_state_v1";

export type StageId =
  | "hero"
  | "mission"
  | "projects"
  | "achievements"
  | "skills"
  | "evidence"
  | "contact";

export type ProtocolStage = {
  id: StageId;
  number: string;
  title: string;
  description: string;
  icon: string;
};

export const PROTOCOL_STAGES: ProtocolStage[] = [
  {
    id: "hero",
    number: "01",
    title: "Witness",
    description: "Identity and dossier established.",
    icon: "◈",
  },
  {
    id: "mission",
    number: "02",
    title: "Interrogate",
    description: "Mission control engaged.",
    icon: "⬡",
  },
  {
    id: "projects",
    number: "03",
    title: "Evidence",
    description: "Build systems inspected.",
    icon: "◈",
  },
  {
    id: "skills",
    number: "04",
    title: "Prove",
    description: "Technical range verified.",
    icon: "⬡",
  },
  {
    id: "contact",
    number: "05",
    title: "Complete",
    description: "Protocol complete.",
    icon: "★",
  },
];

export type ProtocolState = {
  completed: StageId[];
  evidenceCollected: number;
  resumeViewed: boolean;
  lastVisited: number;
  soundEnabled: boolean;
};

export function defaultState(): ProtocolState {
  return {
    completed: [],
    evidenceCollected: 0,
    resumeViewed: false,
    lastVisited: 0,
    soundEnabled: true,
  };
}

export function loadProtocol(): ProtocolState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<ProtocolState>;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      evidenceCollected: typeof parsed.evidenceCollected === "number" ? parsed.evidenceCollected : 0,
      resumeViewed: Boolean(parsed.resumeViewed),
      lastVisited: typeof parsed.lastVisited === "number" ? parsed.lastVisited : Date.now(),
      soundEnabled: parsed.soundEnabled !== false,
    };
  } catch {
    return defaultState();
  }
}

export function saveProtocol(state: ProtocolState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage is optional; progression still works for the session.
  }
}

export function toggleStage(
  state: ProtocolState,
  stageId: StageId
): ProtocolState {
  const completed = state.completed.includes(stageId)
    ? state.completed
    : [...state.completed, stageId];
  return {
    ...state,
    completed,
    lastVisited: Date.now(),
  };
}

export function collectEvidence(state: ProtocolState, count = 1): ProtocolState {
  return {
    ...state,
    evidenceCollected: state.evidenceCollected + count,
    lastVisited: Date.now(),
  };
}

export function viewResume(state: ProtocolState): ProtocolState {
  return {
    ...state,
    resumeViewed: true,
    evidenceCollected: state.evidenceCollected + 2,
    lastVisited: Date.now(),
  };
}

export type ClearanceRank = {
  level: number;
  title: string;
  code: string;
};

export function getClearanceRank(state: ProtocolState): ClearanceRank {
  const score = state.completed.length + (state.resumeViewed ? 1 : 0);
  if (score >= 5) {
    return { level: 5, title: "MASTER ARCHITECT", code: "LVL-5 // COMMAND" };
  }
  if (score >= 4) {
    return { level: 4, title: "SYSTEMS SPECIALIST", code: "LVL-4 // LEAD" };
  }
  if (score >= 3) {
    return { level: 3, title: "FIELD ENGINEER", code: "LVL-3 // OPERATIVE" };
  }
  if (score >= 2) {
    return { level: 2, title: "VERIFIED OPERATIVE", code: "LVL-2 // CLEARED" };
  }
  return { level: 1, title: "WITNESS OBSERVER", code: "LVL-1 // ENTRY" };
}

export function setSound(state: ProtocolState, enabled: boolean): ProtocolState {
  return { ...state, soundEnabled: enabled, lastVisited: Date.now() };
}

export function isUnlocked(state: ProtocolState, threshold: number): boolean {
  return state.completed.length >= threshold;
}

export function completionPercent(state: ProtocolState): number {
  return Math.round((state.completed.length / PROTOCOL_STAGES.length) * 100);
}

export function stageById(id: StageId): ProtocolStage | undefined {
  return PROTOCOL_STAGES.find((s) => s.id === id);
}