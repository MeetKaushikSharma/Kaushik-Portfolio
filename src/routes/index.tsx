import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Github,
  Linkedin,
  Mail,
  Menu,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeetCodeSolvedCount } from "@/components/LeetCodeStats";
import { AtmosphereCanvas } from "@/components/canvas/AtmosphereCanvas";
import { SceneProject } from "@/components/canvas/SceneProject";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { EvidenceCollector } from "@/components/gamification/EvidenceCollector";
import { ProtocolMeter } from "@/components/gamification/ProtocolMeter";
import { MissionUnlock } from "@/components/gamification/MissionUnlock";
import {
  PROTOCOL_STAGES,
  collectEvidence,
  defaultState,
  loadProtocol,
  saveProtocol,
  stageById,
  toggleStage,
  type ProtocolStage,
  type ProtocolState,
  type StageId,
} from "@/lib/protocolEngine";
import resumeUrl from "@/assets/Kaushik_Resume.pdf";
import { achievements, projects, skillGroups } from "@/lib/portfolio-data";
import { useKineticScroll } from "@/hooks/useKineticScroll";
import { useSoundDesign } from "@/hooks/useSoundDesign";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kaushik Sharma — Full-Stack & AI Engineer" },
      {
        name: "description",
        content:
          "Portfolio of Kaushik Sharma, a full-stack engineer, AI systems builder, and six-time hackathon winner.",
      },
      { property: "og:title", content: "Kaushik Sharma — The Proof Protocol" },
      {
        property: "og:description",
        content:
          "Explore full-stack systems, AI products, robotics, and award-winning engineering work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const sections = [
  ["projects", "Build systems"],
  ["achievements", "Win under pressure"],
  ["skills", "Technical range"],
  ["evidence", "Source evidence"],
  ["contact", "Establish contact"],
] as const;

const stageToSection: Record<StageId, string> = {
  hero: "top",
  mission: "mission-control",
  projects: "projects",
  skills: "skills",
  contact: "contact",
  achievements: "achievements",
  evidence: "evidence",
};

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type StatRow = [label: string, value: ReactNode];

function Index() {
  const [protocol, setProtocol] = useState<ProtocolState>(defaultState);
  const [activeProject, setActiveProject] = useState(projects[0]?.id ?? "");
  const [activeAchievement, setActiveAchievement] = useState(0);
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectTarget, setCollectTarget] = useState<{ x: number; y: number; label: string } | null>(null);
  const [recentUnlock, setRecentUnlock] = useState<ProtocolStage | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const isHydratedRef = useRef(false);

  const { enabled: soundEnabled, setEnabled, sounds } = useSoundDesign();
  const currentProject = useMemo(
    () => projects.find((project) => project.id === activeProject) ?? projects[0],
    [activeProject],
  );

  // Initialise Lenis smooth scroll + GSAP ScrollTrigger animations
  useKineticScroll();

  // Hydrate saved protocol state from localStorage cleanly on client
  useEffect(() => {
    const saved = loadProtocol();
    setProtocol(saved);
    if (saved.completed.length > 0 && saved.completed.length < PROTOCOL_STAGES.length) {
      setShowResumePrompt(true);
    }
    isHydratedRef.current = true;
  }, []);

  // Persist protocol state whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydratedRef.current) {
      saveProtocol(protocol);
    }
  }, [protocol]);

  // Section → protocol stage mapping (intersection-driven)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
            const elId = entry.target.id;
            let stageId: StageId | null = null;
            if (elId === "top") stageId = "hero";
            else if (elId === "mission-control") stageId = "mission";
            else if (elId === "projects") stageId = "projects";
            else if (elId === "skills" || elId === "achievements") stageId = "skills";
            else if (elId === "contact") stageId = "contact";

            if (stageId) {
              setProtocol((current) => {
                if (!current.completed.includes(stageId!)) {
                  const updated = toggleStage(current, stageId!);
                  const stage = stageById(stageId!);
                  if (stage) setRecentUnlock(stage);
                  return updated;
                }
                return current;
              });
            }
          }
        });
      },
      { threshold: [0.25] },
    );

    const targetIds = ["top", "mission-control", "projects", "achievements", "skills", "contact"];
    targetIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Evidence collection flow: click a project → particles fly to the meter
  function handleProjectClick(projectId: string) {
    setActiveProject(projectId);
    const index = projects.findIndex((p) => p.id === projectId);
    const project = projects[index];
    if (!project) return;
    setCollecting(true);
    setCollectTarget({ x: 0.92, y: 0.5, label: project.name.toUpperCase() });
    setProtocol((current) => collectEvidence(current));
    sounds.click();
  }

  function handleAchievementClick(index: number) {
    setActiveAchievement(index);
    setCollecting(true);
    setCollectTarget({ x: 0.92, y: 0.5, label: "EVIDENCE" });
    setProtocol((current) => collectEvidence(current));
    sounds.click();
  }

  function handleCollectDone() {
    setCollecting(false);
    setCollectTarget(null);
  }

  function handleMissionClick(id: string) {
    jumpTo(id);
    setMenuOpen(false);
    sounds.hover();
  }

  function handleStageClick(stageId: StageId) {
    const sectionId = stageToSection[stageId] ?? "top";
    jumpTo(sectionId);
    sounds.hover();
  }

  function toggleSound() {
    const next = !soundEnabled;
    setEnabled(next);
    setProtocol((current) => ({ ...current, soundEnabled: next }));
    if (next) {
      sounds.hover();
    }
  }

  function resumeNextStage() {
    const nextStage = PROTOCOL_STAGES.find((s) => !protocol.completed.includes(s.id));
    if (nextStage) {
      jumpTo(stageToSection[nextStage.id]);
    }
    setShowResumePrompt(false);
    sounds.hover();
  }

  return (
    <main className={recruiterMode ? "recruiter-mode" : ""}>
      <AtmosphereCanvas intensity={1.0} />
      <CustomCursor />

      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
        <button
          className="font-mono text-xs font-bold uppercase tracking-widest"
          onClick={() => jumpTo("top")}
          aria-label="Return to top"
          data-cursor-text="TOP"
        >
          KS / 026
        </button>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {sections.map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                jumpTo(id);
                setMenuOpen(false);
                sounds.hover();
              }}
              className="nav-link"
              data-cursor-text="GOTO"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((open) => !open)}
            className="h-8 w-8 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-center bg-background px-8 pt-14 md:hidden">
          {sections.map(([id, label], index) => (
            <button
              key={id}
              onClick={() => handleMissionClick(id)}
              className="border-b border-border py-5 text-left font-display text-3xl"
            >
              <span className="mr-4 font-mono text-xs">0{index + 1}</span>
              {label}
            </button>
          ))}
        </div>
      )}

      <ProtocolMeter
        state={protocol}
        onStageClick={handleStageClick}
      />

      {/* Returning session resume badge */}
      {showResumePrompt && (
        <div
          className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2.5 border border-foreground/30 bg-background/90 px-3.5 py-2 font-mono text-[10px] uppercase shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2"
          role="status"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>RESUME PROTOCOL ({protocol.completed.length}/{PROTOCOL_STAGES.length})</span>
          <Button
            variant="outline"
            size="sm"
            onClick={resumeNextStage}
            className="h-6 rounded-none px-2 font-mono text-[9px] uppercase border-foreground/40 hover:bg-foreground hover:text-background"
          >
            CONTINUE →
          </Button>
          <button
            onClick={() => setShowResumePrompt(false)}
            className="ml-1 text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Dismiss resume prompt"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mission Unlock Notification Modal */}
      <MissionUnlock
        unlockedStage={recentUnlock}
        totalCompleted={protocol.completed.length}
        totalStages={PROTOCOL_STAGES.length}
        onDismiss={() => setRecentUnlock(null)}
      />

      <section id="top" className="hero-section section-shell" data-scroll-section>
        <div className="hero-grid" aria-hidden="true" />
        <div className="relative z-10 flex items-start justify-between gap-4 pt-20 font-mono text-[10px] uppercase md:text-xs">
          <span>Portfolio / 2026</span>
          <span className="status-dot">Available for opportunities</span>
        </div>
        <div className="relative z-10 mt-auto pb-10 pt-24 md:pb-14">
          <p className="mb-5 font-mono text-xs uppercase">
            Full-stack engineer · AI systems builder · 6× hackathon winner
          </p>
          <h1 className="hero-name">
            KAUSHIK
            <br />
            SHARMA
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => jumpTo("mission-control")}
              className="h-12 rounded-none px-6 font-mono text-xs uppercase"
              data-cursor-text="ENTER"
            >
              Enter protocol <ArrowDown />
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-12 rounded-none px-6 font-mono text-xs uppercase"
              data-cursor-text="RÉSUMÉ"
            >
              <a href={resumeUrl} target="_blank" rel="noreferrer">
                View résumé <ArrowUpRight />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => jumpTo("contact")}
              className="h-12 rounded-none font-mono text-xs uppercase"
              data-cursor-text="CONTACT"
            >
              Contact
            </Button>
          </div>
        </div>
        <div className="dossier-strip">
          {([
          ["BASE", "NOIDA, INDIA"],
          ["EDUCATION", "B.TECH / 2028"],
          ["CGPA", "9.44 / 10"],
          ["REPOSITORIES", "14 PUBLIC"],
          ["LEETCODE", <LeetCodeSolvedCount suffix=" SOLVED" />],
          ] satisfies StatRow[]).map(([label, value]) => (
          <div key={label} data-cursor-text="FACT">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
          ))}
        </div>
      </section>

      <section id="mission-control" className="section-shell border-t border-border py-24 md:py-32" data-scroll-section>
        <div className="section-kicker">
          <span>00</span>
          <span>Choose your route</span>
        </div>
        <h2 className="section-title max-w-5xl">
          DON’T READ A RÉSUMÉ.
          <br />
          INTERROGATE THE EVIDENCE.
        </h2>
        <div className="mt-16 border-t border-border">
          {sections.map(([id, label], index) => (
            <button
              key={id}
              className="mission-row group"
              onClick={() => jumpTo(id)}
              data-cursor-text="MISSION"
            >
              <span className="font-mono text-xs">0{index + 1}</span>
              <strong>{label}</strong>
              <span className="hidden font-mono text-[10px] uppercase md:block">
                {protocol.completed.includes(id as StageId) ? "Evidence logged" : "Open mission"}
              </span>
              {protocol.completed.includes(id as StageId) ? (
                <Check />
              ) : (
                <ChevronRight className="transition-transform group-hover:translate-x-2" />
              )}
            </button>
          ))}
        </div>
      </section>

      <section id="projects" className="section-shell border-t border-border py-24 md:py-32" data-scroll-section>
        <div className="section-kicker">
          <span>01</span>
          <span>Build systems</span>
        </div>
        <div className="project-layout mt-12">
          <div className="project-list" role="tablist" aria-label="Featured projects">
            {projects.map((project, index) => (
              <button
                key={project.id}
                role="tab"
                aria-selected={project.id === activeProject}
                onClick={() => handleProjectClick(project.id)}
                data-cursor-text="INSPECT"
                className="project-tab"
              >
                <span>0{index + 1}</span>
                <strong>{project.name}</strong>
                <small>{project.metric}</small>
              </button>
            ))}
          </div>
          {currentProject && (
            <article className="project-stage" key={currentProject.id}>
              <div className="flex items-start justify-between gap-4">
                <p className="font-mono text-[10px] uppercase">{currentProject.label}</p>
                <span className="stamp">VERIFIED BUILD</span>
              </div>
              <h3>{currentProject.name}</h3>
              <p className="project-summary">{currentProject.summary}</p>
              
              {/* Interactive 3D WebGL Visualization */}
              <div className="my-5">
                <SceneProject
                  type={currentProject.interaction}
                  projectName={currentProject.name}
                  metric={currentProject.metric}
                />
              </div>

              <dl className="project-facts">
                <div>
                  <dt>Challenge</dt>
                  <dd>{currentProject.challenge}</dd>
                </div>
                <div>
                  <dt>Outcome</dt>
                  <dd>{currentProject.result}</dd>
                </div>
              </dl>
              <div className="mt-7 flex flex-wrap gap-2">
                {currentProject.stack.map((item) => (
                  <span className="tech-chip" key={item} data-cursor-text="TECH">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-5 font-mono text-xs uppercase">
                {currentProject.repo && (
                  <a
                    className="text-link"
                    href={currentProject.repo}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor-text="REPO"
                  >
                    Source <ArrowUpRight />
                  </a>
                )}
                {currentProject.live && (
                  <a
                    className="text-link"
                    href={currentProject.live}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor-text="LIVE"
                  >
                    Live system <ArrowUpRight />
                  </a>
                )}
              </div>
            </article>
          )}
        </div>
      </section>

      <section id="achievements" className="section-shell inverse-section py-24 md:py-32" data-scroll-section>
        <div className="section-kicker">
          <span>02</span>
          <span>Win under pressure</span>
        </div>
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="section-title">
              SIX ROOMS.
              <br />
              SIX BUILDS.
              <br />
              NO SAFE MODE.
            </h2>
            <div className="mt-10 border-t border-current">
              {achievements.map((item, index) => (
                <button
                  key={item.event}
                  onClick={() => handleAchievementClick(index)}
                  data-cursor-text="REVIEW"
                  className={`achievement-row ${index === activeAchievement ? "is-active" : ""}`}
                >
                  <span>{item.rank}</span>
                  <strong>{item.event}</strong>
                  <small>{item.result}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="achievement-detail">
            <span className="mega-number">{achievements[activeAchievement]?.rank}</span>
            <p className="font-mono text-xs uppercase">
              {achievements[activeAchievement]?.date} / {achievements[activeAchievement]?.result}
            </p>
            <h3>{achievements[activeAchievement]?.project}</h3>
            <p>{achievements[activeAchievement]?.detail}</p>
            <div className="winner-mark">
              6×
              <span>
                HACKATHON
                <br />
                WINNER
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className="section-shell py-24 md:py-32" data-scroll-section>
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="section-kicker">
              <span>03</span>
              <span>Technical range</span>
            </div>
            <h2 className="section-title">THE LOADOUT.</h2>
          </div>
          <Button
            variant="outline"
            onClick={() => setRecruiterMode((value) => !value)}
            className="rounded-none font-mono text-xs uppercase"
            data-cursor-text="MODE"
          >
            <Printer /> {recruiterMode ? "Exit recruiter mode" : "Recruiter mode"}
          </Button>
        </div>
        <div className="skill-matrix">
          {skillGroups.map((group, index) => (
            <div className="skill-group" key={group.name}>
              <span className="font-mono text-[10px]">0{index + 1}</span>
              <h3>{group.name}</h3>
              <div>
                {group.skills.map((skill) => (
                  <span key={skill} data-cursor-text="SKILL">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="evidence" className="section-shell border-t border-border py-24 md:py-32" data-scroll-section>
        <div className="section-kicker">
          <span>04</span>
          <span>Source evidence</span>
        </div>
        <div className="evidence-grid mt-12">
          <div>
            <p className="font-mono text-xs uppercase">Public identity / GitHub</p>
            <h2 className="mt-5 font-display text-5xl font-black uppercase md:text-7xl">
              MeetKaushik
              <br />
              Sharma
            </h2>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Building full-stack products across AI search, competitive programming, robotics,
              agriculture, and native systems.
            </p>
            <a
              href="https://github.com/MeetKaushikSharma"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 border-b border-current pb-1 font-mono text-xs uppercase"
              data-cursor-text="GITHUB"
            >
              Inspect GitHub <ArrowUpRight />
            </a>
          </div>
          <div className="evidence-stats">
            {([
              ["14", "Public repositories"],
              ["84", "Contributions"],
              ["12", "Followers"],
              [<LeetCodeSolvedCount />, "LeetCode problems"],
              ["80+", "GFG problems"],
              ["9.44", "CGPA"],
            ] satisfies [value: ReactNode, label: string][]).map(([value, label]) => (
              <div key={label} data-cursor-text="METRIC">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section-shell inverse-section min-h-[80vh] py-24 md:py-32" data-scroll-section>
        <div className="section-kicker">
          <span>05</span>
          <span>{protocol.completed.length >= 3 ? "Protocol unlocked" : "Establish contact"}</span>
        </div>
        <div className="mt-14 max-w-6xl">
          <p className="font-mono text-xs uppercase flex items-center gap-2">
            {protocol.completed.length >= 3 ? (
              <>
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span>Evidence threshold reached · Clearance verified</span>
              </>
            ) : (
              "Available for ambitious engineering work"
            )}
          </p>
          <h2 className="contact-title">
            LET’S BUILD THE
            <br />
            UNLIKELY.
          </h2>
        </div>
        <div className="mt-14 flex flex-wrap gap-3">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="h-12 rounded-none px-6 font-mono text-xs uppercase"
            data-cursor-text="EMAIL"
          >
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=kaushiksharmabusiness%40gmail.com"
              target="_blank"
              rel="noreferrer"
            >
              <Mail /> Email me
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 rounded-none border-current bg-transparent px-6 font-mono text-xs uppercase text-inherit hover:bg-background hover:text-foreground"
            data-cursor-text="LINKEDIN"
          >
            <a href="https://www.linkedin.com/in/meetkaushiksharma" target="_blank" rel="noreferrer">
              <Linkedin /> LinkedIn
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 rounded-none border-current bg-transparent px-6 font-mono text-xs uppercase text-inherit hover:bg-background hover:text-foreground"
            data-cursor-text="GITHUB"
          >
            <a href="https://github.com/MeetKaushikSharma" target="_blank" rel="noreferrer">
              <Github /> GitHub
            </a>
          </Button>
        </div>
        <footer className="mt-24 flex flex-wrap justify-between gap-4 border-t border-current pt-5 font-mono text-[10px] uppercase">
          <span>Kaushik Sharma © 2026</span>
          <span>Designed as evidence, not decoration.</span>
        </footer>
      </section>

      <EvidenceCollector
        active={collecting}
        targetX={collectTarget?.x ?? 0.92}
        targetY={collectTarget?.y ?? 0.5}
        label={collectTarget?.label ?? "EVIDENCE"}
        onDone={handleCollectDone}
      />
    </main>
  );
}
