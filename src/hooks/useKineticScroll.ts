import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Initialises Lenis kinetic smooth-scroll and GSAP ScrollTrigger animations.
 *
 * Every animation uses translate3d / rotate3d / scale3d exclusively so the
 * browser composites on the GPU. `will-change: transform, opacity` is set
 * via CSS utility classes to guarantee stable 60 FPS.
 */
export function useKineticScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Guard: only run in the browser
    if (typeof window === "undefined") return;

    // Respect accessibility: skip all scroll effects if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    /* ─── Lenis smooth scroll ─────────────────────────────────── */
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.8,
      infinite: false,
    });
    lenisRef.current = lenis;

    // Bridge Lenis → GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    /* ─── Section Reveal + 3D Perspective ────────────────────── */
    const sections = gsap.utils.toArray<HTMLElement>("[data-scroll-section]");
    sections.forEach((section) => {
      gsap.set(section, {
        willChange: "transform, opacity",
      });

      gsap.fromTo(
        section,
        {
          opacity: 0,
          y: 80,
          rotateX: 4,
          rotateY: -2,
          scale: 0.97,
          transformPerspective: 1200,
          transformOrigin: "50% 100%",
          force3D: true,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 88%",
            end: "top 30%",
            scrub: false,
            toggleActions: "play none none reverse",
          },
        },
      );
    });

    /* ─── Hero parallax depth ────────────────────────────────── */
    const heroName = document.querySelector<HTMLElement>(".hero-name");
    if (heroName) {
      gsap.set(heroName, { willChange: "transform" });
      gsap.to(heroName, {
        y: 120,
        scale: 0.92,
        rotateX: -3,
        transformPerspective: 800,
        force3D: true,
        ease: "none",
        scrollTrigger: {
          trigger: "#top",
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    }

    const heroGrid = document.querySelector<HTMLElement>(".hero-grid");
    if (heroGrid) {
      gsap.set(heroGrid, { willChange: "transform, opacity" });
      gsap.to(heroGrid, {
        y: 200,
        opacity: 0,
        force3D: true,
        ease: "none",
        scrollTrigger: {
          trigger: "#top",
          start: "top top",
          end: "80% top",
          scrub: 0.6,
        },
      });
    }

    /* ─── Dossier strip: stagger in from below ───────────────── */
    const dossierItems = gsap.utils.toArray<HTMLElement>(".dossier-strip > div");
    if (dossierItems.length) {
      gsap.set(dossierItems, { willChange: "transform, opacity" });
      gsap.fromTo(
        dossierItems,
        {
          opacity: 0,
          y: 40,
          rotateZ: 1.5,
          force3D: true,
        },
        {
          opacity: 1,
          y: 0,
          rotateZ: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".dossier-strip",
            start: "top 92%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    /* ─── Mission rows: stagger slide from left ──────────────── */
    const missionRows = gsap.utils.toArray<HTMLElement>(".mission-row");
    if (missionRows.length) {
      gsap.set(missionRows, { willChange: "transform, opacity" });
      gsap.fromTo(
        missionRows,
        {
          opacity: 0,
          x: -60,
          rotateY: 6,
          transformPerspective: 1000,
          force3D: true,
        },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#mission-control",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    /* ─── Section titles: scale up from depth ────────────────── */
    const titles = gsap.utils.toArray<HTMLElement>(".section-title");
    titles.forEach((title) => {
      gsap.set(title, { willChange: "transform, opacity" });
      gsap.fromTo(
        title,
        {
          opacity: 0,
          scale: 0.85,
          y: 50,
          rotateX: 6,
          transformPerspective: 900,
          force3D: true,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });

    /* ─── Achievement detail: 3D card tilt on scroll ─────────── */
    const achievementDetail = document.querySelector<HTMLElement>(".achievement-detail");
    if (achievementDetail) {
      gsap.set(achievementDetail, { willChange: "transform" });
      gsap.fromTo(
        achievementDetail,
        {
          rotateY: -8,
          rotateX: 4,
          scale: 0.94,
          transformPerspective: 1000,
          transformOrigin: "left center",
          force3D: true,
        },
        {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: achievementDetail,
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          },
        },
      );
    }

    /* ─── Skill groups: cascade reveal ───────────────────────── */
    const skillGroups = gsap.utils.toArray<HTMLElement>(".skill-group");
    if (skillGroups.length) {
      gsap.set(skillGroups, { willChange: "transform, opacity" });
      gsap.fromTo(
        skillGroups,
        {
          opacity: 0,
          x: -40,
          rotateY: 4,
          transformPerspective: 800,
          force3D: true,
        },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          stagger: 0.1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#skills",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    /* ─── Evidence stats: count-up style stagger ─────────────── */
    const evidenceStats = gsap.utils.toArray<HTMLElement>(".evidence-stats > div");
    if (evidenceStats.length) {
      gsap.set(evidenceStats, { willChange: "transform, opacity" });
      gsap.fromTo(
        evidenceStats,
        {
          opacity: 0,
          y: 50,
          scale: 0.9,
          rotateX: 8,
          transformPerspective: 600,
          force3D: true,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          stagger: { each: 0.1, grid: "auto", from: "start" },
          duration: 0.8,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: ".evidence-stats",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    /* ─── Contact section: dramatic rise ─────────────────────── */
    const contactTitle = document.querySelector<HTMLElement>(".contact-title");
    if (contactTitle) {
      gsap.set(contactTitle, { willChange: "transform, opacity" });
      gsap.fromTo(
        contactTitle,
        {
          opacity: 0,
          y: 100,
          scale: 0.8,
          rotateX: 10,
          transformPerspective: 1200,
          force3D: true,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: {
            trigger: "#contact",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    /* ─── Project stage: subtle perspective drift on scroll ──── */
    const projectStage = document.querySelector<HTMLElement>(".project-stage");
    if (projectStage) {
      gsap.set(projectStage, { willChange: "transform" });
    }

    /* ─── Tech chips: wave in ────────────────────────────────── */
    const techChips = gsap.utils.toArray<HTMLElement>(".tech-chip");
    if (techChips.length) {
      gsap.set(techChips, { willChange: "transform, opacity" });
      gsap.fromTo(
        techChips,
        {
          opacity: 0,
          y: 20,
          scale: 0.85,
          force3D: true,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.04,
          duration: 0.5,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: "#projects",
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    /* ─── Proof rail: subtle float ───────────────────────────── */
    const proofRail = document.querySelector<HTMLElement>(".proof-rail");
    if (proofRail) {
      gsap.set(proofRail, { willChange: "transform" });
      gsap.to(proofRail, {
        y: -10,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        force3D: true,
      });
    }

    /* ─── Cleanup ────────────────────────────────────────────── */
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
