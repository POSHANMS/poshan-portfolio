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
    name: "FindIt",
    subtitle: "Campus Lost & Found Portal",
    stack: ["React", "Flask", "PostgreSQL", "Redis", "Socket.io", "JWT", "Docker", "Leaflet.js"],
    liveLabel: "Deployed on Vercel",
    href: "",
    description:
      "Built a full-stack portal that matches lost and found items and alerts users in real time with Socket.io, JWT auth, Redis caching, GPS location pinning, Docker, and Vercel deployment.",
  },
  {
    name: "ZaminSaathi",
    subtitle: "AI Land Document Assistant",
    stack: ["Python", "Google ADK", "Gemini", "Flask", "Audit Logging"],
    liveLabel: "Kaggle x Google capstone",
    href: "",
    description:
      "Designed a 3-agent AI system that reads Karnataka land records, explains dense legal language in plain English, and cross-checks documents for discrepancies with independent security layers.",
  },
  {
    name: "Hostel Management System",
    subtitle: "Role-Based Campus Operations",
    stack: ["Node.js", "Express.js", "MySQL", "HTML", "CSS", "JavaScript"],
    liveLabel: "Admin + student portals",
    href: "",
    description:
      "Built separate admin and student portals with role-based access control, 15+ RESTful API endpoints, normalized MySQL tables, fee recording, room allocation, and complaint tracking.",
  },
  {
    name: "HealthGPT",
    subtitle: "Disease Prediction System",
    stack: ["Python", "Flask", "ML", "CNN", "Model Evaluation"],
    liveLabel: "Final-year group project",
    href: "",
    description:
      "Owned the Flask backend connecting trained ML and CNN models to the frontend for an 8-condition disease prediction system averaging 90%+ accuracy in a 4-person final-year build.",
  },
  {
    name: "NoteFlash",
    subtitle: "Flask + MySQL Notes App",
    stack: ["Flask", "MySQL", "Railway"],
    liveLabel: "noteflash.up.railway.app",
    href: "https://noteflash.up.railway.app",
    description:
      "Deployed on Railway with a custom subdomain and a focused note management workflow for creating, organizing, and managing notes.",
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
] as const;

export const RESUME_SUMMARY =
  "Computer Science Engineering graduate skilled in Python, Java, and SQL, who learns best by building full-stack systems, AI agents, and role-based campus software.";
