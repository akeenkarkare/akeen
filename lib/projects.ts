export interface Project {
  id: string;
  title: string;
  tag: string;
  color: string;
  bg: string;
  summary: string;
  body: string[];
  stack: string[];
  links?: { label: string; href: string }[];
}

export const PROJECTS: Project[] = [
  {
    id: "stack",
    title: "What I work with",
    tag: "Tech Stack",
    color: "#e2e8f0",
    bg: "#0f172a",
    summary:
      "Languages, frameworks, hardware. The stack I actually ship with — not a wishlist.",
    body: [
      "I'm full-stack but my real edge is range. I write production TypeScript and Python on the application side, drop into C++ for systems and physics-heavy work, and Java when the assignment demands it.",
      "On the backend I lean on FastAPI, Flask, and Next.js API routes. State lives in Postgres / Supabase, and I deploy through Docker on Coolify-managed hosts.",
      "On the ML side I use PyTorch and scikit-learn for model work, OpenCV for vision, and TensorFlow when interop matters. I've shipped real CV pipelines on Jetson Orin Nano hardware using TensorRT and CUDA for the perception stack.",
      "Hardware and embedded: Raspberry Pi 5, Jetson, Arduino, ESP32, plus the usual sensor suite (HC-SR04, PN532 NFC, nRF24L01). I solder, I 3D print, I write the firmware.",
    ],
    stack: [
      "Python", "C++", "TypeScript", "Java", "Bash",
      "Next.js", "React", "FastAPI", "Flask",
      "PyTorch", "scikit-learn", "TensorFlow", "OpenCV",
      "Postgres", "Supabase", "Docker", "Linux",
      "Jetson", "CUDA", "TensorRT", "Arduino", "ESP32",
    ],
  },
  {
    id: "yeetcode",
    title: "YeetCode",
    tag: "Startup / Flagship",
    color: "#fef3c7",
    bg: "#1f2937",
    summary:
      "Gamified coding interviews. Real-time 1v1 duels, matchmaking, and leaderboards. 1000+ users. Live at yeetcode.xyz.",
    body: [
      "LeetCode solves the problem of what to grind. YeetCode solves the problem of whether you'll actually grind.",
      "It's a full-stack competitive programming platform where you queue up, get matched with another person, and race them through the same problem in real time. The ranking algorithm weighs solve time against problem difficulty, so beating a hard problem fast is worth more than grinding easies.",
      "Built with TypeScript, Next.js, and a FastAPI backend, wired into the LeetCode API for problems and Resend for transactional email. The matchmaking layer pairs opponents dynamically, and the execution pipeline was tuned hard to keep submission-to-feedback latency low enough that a live duel actually feels live.",
      "Currently focused on the conversion funnel, mobile usability, and compressing the first-duel experience into the 'instant gratification' window where users either stick or bounce.",
    ],
    stack: ["TypeScript", "Next.js", "FastAPI", "LeetCode API", "Resend"],
    links: [{ label: "yeetcode.xyz", href: "https://yeetcode.xyz" }],
  },
  {
    id: "asteroid",
    title: "Asteroid",
    tag: "Discord Bot",
    color: "#fde68a",
    bg: "#422006",
    summary:
      "Multi-purpose Discord bot used by 70,000+ users across 200+ servers. Python, discord.py, cloud-hosted.",
    body: [
      "A multi-purpose Discord bot I built and deployed that grew to 70,000+ users across 200+ servers. Moderation, automation, utility commands — the full set of things server admins actually want.",
      "Python with discord.py on the surface; the interesting work was underneath. Discord's gateway hammers bots with high-frequency events, so the backend had to be architected around concurrent event handling and graceful backpressure. One hot shard can process thousands of events per minute.",
      "Deployed to cloud infrastructure with uptime as the main success metric. A Discord bot that crashes on Saturday night is a dead Discord bot.",
    ],
    stack: ["Python", "discord.py", "Cloud deployment"],
  },
  {
    id: "jetson-robot",
    title: "Autonomous Delivery Robot",
    tag: "Robotics / Jetson",
    color: "#dbeafe",
    bg: "#0c4a6e",
    summary:
      "Coco-style autonomous delivery robot built on a Jetson Orin Nano with computer vision and collision avoidance.",
    body: [
      "Inspired by Coco's sidewalk delivery robots. Jetson Orin Nano on board, running a YOLO model for obstacle detection and a custom control loop for path following.",
      "Main engineering problem: squeezing the perception stack into the Jetson's thermal envelope. TensorRT-converted YOLO, CUDA kernels for the preprocessing, and a tight C++ inner loop for the motor control.",
      "Forked a JetBot collision-avoidance pipeline as the starting point, then rewrote the steering head to use a small learned policy instead of hardcoded thresholds.",
    ],
    stack: ["Jetson Orin Nano", "YOLO", "TensorRT", "CUDA", "C++", "Python"],
  },
  {
    id: "exoplanet",
    title: "AI Exoplanet Detector",
    tag: "ML / Astrophysics",
    color: "#c7d2fe",
    bg: "#1e1b4b",
    summary:
      "ML pipeline that classifies exoplanet candidates from stellar light curves. PyTorch + scikit-learn, tuned for noisy astronomical data.",
    body: [
      "When a planet passes in front of its host star, the star dims by a tiny fraction — a periodic dip in a noisy light curve. Finding those dips reliably, without drowning in false positives from starspots and instrument noise, is the problem.",
      "I built an end-to-end pipeline that ingests raw observational data, runs it through a preprocessing stage that normalizes and cleans the light curves, and then uses feature engineering tuned to the periodicity of planetary transits to feed a classifier.",
      "The modeling side used PyTorch and scikit-learn with a chunk of time spent on generalization — an exoplanet classifier that overfits its training stars is useless, so cross-validation and held-out stars were the real bottleneck.",
      "This project is why the background of this portfolio is a physics simulation. Numerical methods for noisy astronomical data is the research direction I'm chasing — currently reaching out to Prof. Zingale at Stony Brook for computational astrophysics work.",
    ],
    stack: ["PyTorch", "Scikit-learn", "TensorFlow", "Seaborn", "NumPy"],
  },
  {
    id: "sbu-research",
    title: "SBU Research Assistant",
    tag: "Research / Stony Brook",
    color: "#a7f3d0",
    bg: "#064e3b",
    summary:
      "Building an AI academic assistant in C++ with CI-integrated grading pipelines. Adopted across multiple university departments.",
    body: [
      "I'm a Research Assistant at Stony Brook working on an AI-based academic assistant — a C++ system built with Claude Code and scikit-learn that delivers personalized study recommendations to students, with real data-access controls and privacy safeguards baked in.",
      "The backend is a CI-integrated grading pipeline that processes 150+ assignments per week with real-time feedback to students. I designed the ML workflows that generate adaptive tutoring recommendations, which improved student practice accuracy by 15% in testing.",
      "Supporting infrastructure: scalable FastAPI endpoints and Java data pipelines feeding analytics that give instructors real-time visibility into student activity. Deployed with Git and Docker through a cross-functional team, now adopted by multiple departments across the university.",
      "This is the project that bridges my SWE side and my research side — production ML infrastructure serving real students, not a side project.",
    ],
    stack: ["C++", "Python", "FastAPI", "Java", "scikit-learn", "Docker"],
  },
  {
    id: "brainsquared",
    title: "BrainSquared",
    tag: "SBUHacks 2025 Winner",
    color: "#fce7f3",
    bg: "#831843",
    summary:
      "A 'second memory' Chrome extension. Indexes your browsing history as vector embeddings for semantic recall. Won SBUHacks 2025.",
    body: [
      "The premise: your browser already has a perfect log of everything you've ever read. The problem is that Cmd+F over raw history is useless — you don't remember the URL, you remember the idea.",
      "BrainSquared continuously captures and indexes your browsing history locally, then lets you query it in natural language: 'that blog post about regenerative cooling I read in February.' Retrieval combines the query with historical context and embedding similarity to surface the actual page.",
      "Architecturally, it's a Chrome extension for the capture side and Qdrant for the vector store. Privacy was the hard constraint — all collection happens locally, nothing leaves the machine. That constraint shaped every decision downstream.",
      "Won SBUHacks 2025.",
    ],
    stack: ["TypeScript", "Chrome Extensions", "Qdrant", "Embeddings"],
  },
];
