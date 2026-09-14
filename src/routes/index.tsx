import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import resumeUrl from "@/assets/Kaushik_Resume.pdf";
import { achievements, projects, skillGroups, type Project } from "@/lib/portfolio-data";

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

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SystemGraphic({ type }: { type: Project["interaction"] }) {
  if (type === "judge")
    return (
      <div className="system-graphic grid grid-cols-3 gap-3" aria-hidden="true">
        <span>INPUT</span>
        <span className="active">JUDGE_01</span>
        <span>VERDICT</span>
        <i />
        <i />
        <i />
      </div>
    );
  if (type === "diagnostic")
    return (
      <div className="system-graphic diagnostic" aria-hidden="true">
        <b>97.5</b>
        <span>CONFIDENCE</span>
        <div className="scan" />
      </div>
    );
  if (type === "search")
    return (
      <div className="system-graphic search-lines" aria-hidden="true">
        <span>SEARCH</span>
        <i />
        <i />
        <i />
        <b>SOURCE VERIFIED</b>
      </div>
    );
  if (type === "robot")
    return (
      <div className="system-graphic robot-grid" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <b>ROC / ONLINE</b>
      </div>
    );
  if (type === "audio")
    return (
      <div className="system-graphic waveform" aria-hidden="true">
        {[2, 5, 8, 4, 10, 6, 3, 9, 5, 7, 3, 6].map((n, i) => (
          <i key={i} style={{ height: `${n * 8}%` }} />
        ))}
      </div>
    );
  return (
    <div className="system-graphic field-grid" aria-hidden="true">
      <span>FIELD_04</span>
      <b>ROVER LOCKED</b>
      <i />
    </div>
  );
}

function Index() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState(projects[0]?.id ?? "");
  const [activeAchievement, setActiveAchievement] = useState(0);
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = Math.round((completed.length / sections.length) * 100);
  const currentProject = useMemo(
    () => projects.find((project) => project.id === activeProject) ?? projects[0],
    [activeProject],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
            setCompleted((current) =>
              current.includes(entry.target.id) ? current : [...current, entry.target.id],
            );
          }
        });
      },
      { threshold: [0.35] },
    );
    sections.forEach(([id]) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <main className={recruiterMode ? "recruiter-mode" : ""}>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
        <button
          className="font-mono text-xs font-bold uppercase tracking-widest"
          onClick={() => jumpTo("top")}
          aria-label="Return to top"
        >
          KS / 026
        </button>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {sections.map(([id, label]) => (
            <button key={id} onClick={() => jumpTo(id)} className="nav-link">
              {label}
            </button>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen((open) => !open)}
          className="md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-center bg-background px-8 pt-14 md:hidden">
          {sections.map(([id, label], index) => (
            <button
              key={id}
              onClick={() => {
                jumpTo(id);
                setMenuOpen(false);
              }}
              className="border-b border-border py-5 text-left font-display text-3xl"
            >
              <span className="mr-4 font-mono text-xs">0{index + 1}</span>
              {label}
            </button>
          ))}
        </div>
      )}

      <aside className="proof-rail" aria-label={`Portfolio exploration ${progress}% complete`}>
        <span className="vertical-label">PROOF / {String(completed.length).padStart(2, "0")}</span>
        <div className="rail-track">
          <i style={{ height: `${progress}%` }} />
        </div>
        <span className="font-mono text-[10px]">{progress}%</span>
      </aside>

      <section id="top" className="hero-section section-shell">
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
            >
              Enter protocol <ArrowDown />
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-12 rounded-none px-6 font-mono text-xs uppercase"
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
            >
              Contact
            </Button>
          </div>
        </div>
        <div className="dossier-strip">
          {[
            ["BASE", "NOIDA, INDIA"],
            ["EDUCATION", "B.TECH / 2028"],
            ["CGPA", "9.44 / 10"],
            ["REPOSITORIES", "14 PUBLIC"],
            ["CONTRIBUTIONS", "84 / YEAR"],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="mission-control" className="section-shell border-t border-border py-24 md:py-32">
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
            <button key={id} className="mission-row group" onClick={() => jumpTo(id)}>
              <span className="font-mono text-xs">0{index + 1}</span>
              <strong>{label}</strong>
              <span className="hidden font-mono text-[10px] uppercase md:block">
                {completed.includes(id) ? "Evidence logged" : "Open mission"}
              </span>
              {completed.includes(id) ? (
                <Check />
              ) : (
                <ChevronRight className="transition-transform group-hover:translate-x-2" />
              )}
            </button>
          ))}
        </div>
      </section>

      <section id="projects" className="section-shell border-t border-border py-24 md:py-32">
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
                onClick={() => setActiveProject(project.id)}
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
              <SystemGraphic type={currentProject.interaction} />
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
                  <span className="tech-chip" key={item}>
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
                  >
                    Live system <ArrowUpRight />
                  </a>
                )}
              </div>
            </article>
          )}
        </div>
      </section>

      <section id="achievements" className="section-shell inverse-section py-24 md:py-32">
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
                  onClick={() => setActiveAchievement(index)}
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

      <section id="skills" className="section-shell py-24 md:py-32">
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
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="evidence" className="section-shell border-t border-border py-24 md:py-32">
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
            >
              Inspect GitHub <ArrowUpRight />
            </a>
          </div>
          <div className="evidence-stats">
            {[
              ["14", "Public repositories"],
              ["84", "Contributions"],
              ["12", "Followers"],
              ["350+", "LeetCode problems"],
              ["80+", "GFG problems"],
              ["9.44", "CGPA"],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section-shell inverse-section min-h-[80vh] py-24 md:py-32">
        <div className="section-kicker">
          <span>05</span>
          <span>{completed.length >= 3 ? "Protocol unlocked" : "Establish contact"}</span>
        </div>
        <div className="mt-14 max-w-6xl">
          <p className="font-mono text-xs uppercase">
            {completed.length >= 3
              ? "Evidence threshold reached"
              : "Available for ambitious engineering work"}
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
          >
            <a href="mailto:kaushiksharmabusiness@email.com">
              <Mail /> Email me
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 rounded-none border-current bg-transparent px-6 font-mono text-xs uppercase text-inherit hover:bg-background hover:text-foreground"
          >
            <a href="https://www.linkedin.com/in/kaushik-sharma" target="_blank" rel="noreferrer">
              <Linkedin /> LinkedIn
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 rounded-none border-current bg-transparent px-6 font-mono text-xs uppercase text-inherit hover:bg-background hover:text-foreground"
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
    </main>
  );
}
