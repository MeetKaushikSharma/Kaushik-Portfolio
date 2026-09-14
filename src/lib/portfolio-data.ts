export type Project = {
  id: string;
  name: string;
  label: string;
  summary: string;
  challenge: string;
  result: string;
  metric: string;
  stack: string[];
  repo?: string;
  live?: string;
  interaction: "judge" | "diagnostic" | "search" | "robot" | "audio" | "field";
};

export const projects: Project[] = [
  {
    id: "codearena",
    name: "CodeArena",
    label: "Competitive systems",
    summary: "A full-stack arena where code is written, judged, ranked, and explained by AI.",
    challenge: "Make competitive programming feel immediate without compromising secure execution.",
    result: "Dual-judge validation, a 365-day activity map, tiered rankings, and contextual AI tutoring.",
    metric: "15+ languages",
    stack: ["React 19", "Node.js", "MongoDB", "Redis", "Judge0", "Gemini"],
    repo: "https://github.com/MeetKaushikSharma/CodeArena",
    live: "https://code-arena-army.vercel.app/",
    interaction: "judge",
  },
  {
    id: "dhara-vaidya",
    name: "Dhara-Vaidya",
    label: "Agricultural intelligence",
    summary: "A crop-disease diagnosis ecosystem designed for low-bandwidth rural environments.",
    challenge: "Turn field imagery and drone telemetry into fast, actionable diagnoses for farmers.",
    result: "Dual ResNet-18 models, image compression, offline-first flows, and GIS disease heatmaps.",
    metric: "97.5% accuracy",
    stack: ["Flutter", "FastAPI", "ResNet-18", "Redis", "GIS"],
    repo: "https://github.com/MeetKaushikSharma/Dhara-Vaidya",
    interaction: "diagnostic",
  },
  {
    id: "myperplexity",
    name: "MyPerplexity",
    label: "Evidence-led AI search",
    summary: "A cross-platform RAG search engine that answers with real-time source attribution.",
    challenge: "Orchestrate retrieval and synthesis without obscuring where each answer came from.",
    result: "An asynchronous Search → Sort → Generate pipeline serving mobile and web clients.",
    metric: "100+ queries",
    stack: ["Flutter", "FastAPI", "Python", "Gemini", "Tavily", "RAG"],
    repo: "https://github.com/MeetKaushikSharma/Perplexity-Clone",
    interaction: "search",
  },
  {
    id: "roc",
    name: "ROC",
    label: "Robotics workstation",
    summary: "A desktop environment for configuring, programming, simulating, and controlling robots.",
    challenge: "Unify fragmented robotics workflows into one visual development environment.",
    result: "Drag-and-drop logic, macro automation, 3D simulation, and custom control dashboards.",
    metric: "2nd place",
    stack: ["React", "Node.js", "3D Simulation", "Visual Programming"],
    interaction: "robot",
  },
  {
    id: "audio-router",
    name: "You Can Listen Too",
    label: "Systems audio",
    summary: "An ultra-low-latency desktop audio router for synchronized multi-device listening.",
    challenge: "Move live audio between devices without noticeable delay or a heavyweight interface.",
    result: "A focused native desktop utility built on Rust and Tauri.",
    metric: "Ultra-low latency",
    stack: ["Rust", "Tauri", "Desktop Audio"],
    repo: "https://github.com/MeetKaushikSharma/you-can-listen-too",
    interaction: "audio",
  },
  {
    id: "varah",
    name: "V.A.R.A.H.",
    label: "Autonomous field robotics",
    summary: "A farm rover platform for field monitoring, weed detection, and targeted removal.",
    challenge: "Give farmers a practical way to deploy and supervise autonomous field robotics.",
    result: "Buy/rent flows, rover telemetry, field monitoring, and targeted weed intervention.",
    metric: "Autonomous rover",
    stack: ["Flutter", "IoT", "Computer Vision", "Telemetry"],
    repo: "https://github.com/MeetKaushikSharma/Control-Your-Rover",
    interaction: "field",
  },
];

export const achievements = [
  { rank: "01", event: "Eco-Code Hackathon", result: "1st place", date: "Sep 2026", project: "EcoSort", detail: "AI camera classification across 18 waste categories, a robotic sorting arm, and rover dashboard." },
  { rank: "02", event: "Code Veda 2.0", result: "1st place", date: "Apr 2026", project: "Dhara-Vaidya", detail: "Crop intelligence, farm mapping, drone surveys, heatmaps, and dual ResNet-18 models." },
  { rank: "03", event: "SRM Builds 7.0", result: "Runner-up", date: "Mar 2026", project: "Dhara-Vaidya", detail: "A working agricultural diagnosis and IoT rover platform refined under competition pressure." },
  { rank: "04", event: "IOTHON", result: "Runner-up", date: "Mar 2026", project: "Dhara-Vaidya", detail: "Expanded telemetry and autonomous field-monitoring capabilities." },
  { rank: "05", event: "Eco-Vision", result: "Finalist build", date: "Apr 2026", project: "Dhara-Vaidya", detail: "Continued iteration of the crop-disease and farm robotics ecosystem." },
  { rank: "06", event: "Quant Craft", result: "2nd place", date: "May 2026", project: "ROC", detail: "A robotics development desktop with visual programming and simulation." },
];

export const skillGroups = [
  { name: "Languages", skills: ["JavaScript", "TypeScript", "Python", "C++", "C", "Java", "Dart", "HTML", "CSS"] },
  { name: "Frontend", skills: ["React 19", "Flutter", "Redux Toolkit", "Tailwind CSS", "Monaco Editor"] },
  { name: "Backend / Infra", skills: ["Node.js", "FastAPI", "Docker", "Redis", "Judge0", "REST APIs", "WebSockets"] },
  { name: "Data", skills: ["MongoDB", "MySQL", "Firebase"] },
  { name: "AI", skills: ["LLMs", "Gemini API", "RAG Pipelines", "Computer Vision", "Tavily API"] },
  { name: "Tools", skills: ["Git", "GitHub", "Postman", "Vercel", "Chrome DevTools"] },
];