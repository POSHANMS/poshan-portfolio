export const PROFILE = {
  name: "Poshan MS",
  title: "Full Stack Developer | AI Developer",
  location: "Karnataka, India",
  status: "Computer Science Engineering graduate, 2026",
  education: "Bachelor of Engineering, Computer Science - Navkis College of Engineering",
  cgpa: "8.16",
  email: "siddeshwaraprasanna5@gmail.com",
  phone: "+91 9535560561",
  github: "https://github.com/POSHANMS",
  linkedin: "https://linkedin.com/in/poshanms/",
};

export const STATS = [
  { value: "2026", label: "CSE Graduate" },
  { value: "8.16", label: "CGPA" },
  { value: "110+", label: "DSA Problems" },
  { value: "35+", label: "TryHackMe Rooms" },
];

export const PROJECTS = [
  {
    name: "FINDIT",
    subtitle: "CAMPUS LOST & FOUND PORTAL",
    stack: ["REACT", "FLASK", "POSTGRESQL", "REDIS", "SOCKET.IO", "LEAFLET", "DOCKER"],
    githubUrl: "https://github.com/POSHANMS/lost-found-frontend",
    backendUrl: "https://github.com/POSHANMS/lost-found-backend",
    liveLabel: "Deployed on Vercel",
    href: "https://findit-portal.vercel.app",
    description:
      "A full-stack campus portal where students pin lost or found items on a live Leaflet map, upload photos straight to Cloudinary, and verify ownership through secret claim questions. Runs on a Flask API with Redis caching, rate limiting, and real-time Socket.io alerts.",
  },
  {
    name: "ZAMINSAATHI",
    subtitle: "MULTI-AGENT LAND DOCUMENT AI",
    stack: ["PYTHON", "GOOGLE ADK", "GEMINI 2.5", "FASTMCP", "FLASK", "DOCKER"],
    githubUrl: "https://github.com/POSHANMS/zaminsaathi",
    liveLabel: "Kaggle x Google capstone",
    href: "",
    description:
      "A three-agent Google ADK pipeline that turns Karnataka RTC and mutation records into plain English, cross-checks survey numbers over a live stdio MCP server to catch hidden mismatches, and lays out the exact office steps to fix them—cutting prompt context by 62% with on-demand skills.",
  },
  {
    name: "HOSTEL MANAGEMENT SYSTEM",
    subtitle: "DUAL-PORTAL HOSTEL PLATFORM",
    stack: ["NODE.JS", "EXPRESS", "MYSQL", "REST API", "JAVASCRIPT"],
    githubUrl: "https://github.com/POSHANMS/Hostel-Management-System",
    liveLabel: "Admin + student portals",
    href: "",
    description:
      "An admin and student web portal built to replace paper hostel logs. Wardens manage student records, room allocations, fee tracking, and maintenance complaints from one dashboard, while students check their room details, payment history, and ticket status through a Node.js and MySQL REST API.",
  },
  {
    name: "HEALTHGPT",
    subtitle: "MULTI-DISEASE DIAGNOSTIC AI",
    stack: ["PYTHON", "TENSORFLOW", "XGBOOST", "SCIKIT-LEARN", "FLASK", "SQLITE3"],
    githubUrl: "https://github.com/POSHANMS/HealthGPT---Intelligent-Healthcare-System",
    liveLabel: "Final-year group project",
    href: "",
    description:
      "A Flask screening portal covering eight conditions across medical scans and lab metrics. Pairs transfer-learning CNNs (VGG19, ResNet152V2, DenseNet201) on MRI and X-ray images with XGBoost and Random Forest on clinical data—averaging over 90% validation accuracy with SQLite3 report history.",
  },
  {
    name: "NOTEFLASH",
    subtitle: "REAL-TIME NOTES WORKSPACE",
    stack: ["PYTHON", "FLASK", "SQLALCHEMY", "MYSQL", "QUILL.JS", "JAVASCRIPT"],
    githubUrl: "https://github.com/POSHANMS/notes-keeper-app",
    liveLabel: "Flask + MySQL notes app",
    href: "",
    description:
      "A fast Keep-style notes app built on Flask, SQLAlchemy, and MySQL with a Quill rich-text editor. Handles 1-second debounced auto-save so drafts never vanish, 300ms live search across titles and body text, pinned masonry cards, persistent dark mode, and strict per-user route isolation.",
  },
];

export const SKILL_GROUPS = [
  ["Languages", ["Python", "JavaScript", "TypeScript", "Java", "C", "C++", "SQL"]],
  ["Frontend", ["React (18)", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Bootstrap 5", "Vite", "Framer Motion", "Leaflet.js"]],
  ["Backend", ["Flask", "SQLAlchemy", "Node.js", "Express", "Spring Boot"]],
  ["Databases", ["PostgreSQL", "MongoDB", "MySQL", "SQLite3", "Redis"]],
  ["Realtime/Auth", ["Socket.io", "WebSockets", "JWT"]],
  ["AI / ML", ["Google ADK", "Gemini", "Flask-based ML integration (HealthGPT)", "Scikit-learn", "Naive Bayes", "Decision Tree", "Model training & evaluation", "Binance Futures API / algorithmic trading bot"]],
  ["Mobile", ["Android (WebView-based apps)"]],
  ["DevOps/Tools", ["Docker", "Git", "GitHub", "VS Code"]],
  ["Cloud/Hosting", ["Vercel", "Railway", "Render", "Cloudinary"]],
  ["Cybersecurity", ["Log analysis", "Vulnerability assessment", "Ethical hacking fundamentals (TryHackMe)"]],
  ["Core Concepts", ["DSA", "OOP", "REST APIs", "DBMS", "Operating Systems", "Computer Networks"]],
  ["Operating Systems", ["Windows", "Linux (Ubuntu, Kali Linux)"]],
] as const;

export const JOURNEY_MILESTONES = [
  {
    title: "Computer Science Engineering",
    body: "Bachelor of Engineering in Computer Science at Navkis College of Engineering, CGPA 8.16, graduating in 2026.",
  },
  {
    title: "Real-Time Full Stack Systems",
    body: "Built FindIt with React, Flask, PostgreSQL, Redis, Socket.io, JWT authentication, Docker, Leaflet.js, and Vercel deployment.",
  },
  {
    title: "Agentic AI Capstone",
    body: "Created ZaminSaathi as the capstone for Kaggle x Google's 5-Day AI Agents course using Google ADK, Gemini, Flask, permissions, and audit logging.",
  },
  {
    title: "Security + Practice",
    body: "Completed Deloitte Cyber Security virtual internship, TryHackMe practice, log analysis, vulnerability assessment, and 110+ DSA problems across LeetCode and GeeksforGeeks.",
  },
  {
    title: "Build + Delivery Practice",
    body: "Ship and maintain practical projects with Docker, Git, GitHub, Vercel, Railway, Render, and Cloudinary.",
  },
] as const;

export const RESUME_SUMMARY =
  "Computer Science Engineering graduate skilled in Python, Java, and SQL, who learns best by building full-stack systems, AI agents, and role-based campus software.";
