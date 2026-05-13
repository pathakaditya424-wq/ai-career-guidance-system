// ─── SKILLS LIST ─────────────────────────────────────────────
// Curated from actual training dataset — shown as suggestions in TagInput
export const SKILLS_LIST = [
  // Programming & Web
  "Python", "Java", "JavaScript", "C/C++", "TypeScript", "R", "MATLAB",
  "HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Next.js",
  "PHP", "Bootstrap", "jQuery", "Django", "Flask", "Spring Boot",

  // Data & ML
  "Machine Learning", "Deep Learning", "Data Science", "Data Analysis",
  "Artificial Intelligence", "TensorFlow", "PyTorch", "Scikit-Learn",
  "Natural Language Processing", "Computer Vision", "Big Data Analytics",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Data Structures", "Algorithms",
  "Statistics", "Power BI", "Tableau", "Excel",

  // Cloud & DevOps
  "AWS", "Docker", "Kubernetes", "Git", "Linux", "CI/CD",
  "Azure", "Google Cloud", "Ansible", "Terraform",

  // Mobile
  "Android", "Flutter", "React Native", "iOS Development",

  // Design
  "Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe XD",
  "UI Design", "UX Design", "Graphic Design", "Canva",

  // Engineering
  "AutoCAD", "SolidWorks", "ANSYS", "CATIA", "Arduino",
  "Embedded Systems", "PCB Design", "MATLAB", "Civil Engineering",
  "Structural Analysis", "Electrical Design",

  // Business & Finance
  "Accounting", "Finance", "Digital Marketing", "SEO", "Marketing",
  "Content Writing", "Communication", "Leadership", "Project Management",
  "Microsoft Office", "Tally", "Corporate Finance",

  // Soft Skills & Other
  "Problem Solving", "Teamwork", "Public Speaking", "Research",
  "Content Creation", "Blogging", "Social Media Marketing",
  "Cybersecurity", "Networking", "Database Management",
];

// ─── INTERESTS LIST ───────────────────────────────────────────
// Curated from actual training dataset — shown as suggestions in TagInput
export const INTERESTS_LIST = [
  // Tech
  "Coding", "Web Development", "Mobile App Development", "Data Science",
  "Machine Learning", "Artificial Intelligence", "Cybersecurity",
  "Cloud Computing", "Blockchain", "Embedded Systems", "Automation",
  "Electronics", "Hardware", "Gaming", "Animation",

  // Data & Analytics
  "Data Analytics", "Data Analysis", "Finance", "Financial Analysis",
  "Business", "Analytics", "Statistics", "Research",

  // Design & Creative
  "Design", "Digital Media", "Content Writing", "Media",
  "Arts", "Photography", "Music",

  // Business & Management
  "Marketing", "Digital Marketing", "Entrepreneurship",
  "Management", "Project Management", "Human Resource",
  "Customer Care",

  // Science & Engineering
  "Engineering", "Architecture And Construction", "Biotechnology",
  "Healthcare", "Medicine", "Agriculture", "Environment",

  // Education & Social
  "Teaching", "Academia", "Higher Studies", "Government Jobs",
  "Social Work", "Law",

  // Other
  "Mobile Apps", "Application Development", "Innovation",
  "Information Technology", "Infrastructure", "Robotics",
];

// ─── BOARD OPTIONS ───────────────────────────────────────────
// Used in Step 1 of InputPage for 10th/12th board selection
export const BOARD_OPTIONS = [
  "CBSE",
  "ICSE / ISC",
  "State Board",
  "NIOS",
  "IB (International Baccalaureate)",
  "Cambridge (IGCSE)",
  "Other",
];

// ─── STREAM OPTIONS ──────────────────────────────────────────
// Used in Step 1 of InputPage for 12th stream selection
export const STREAM_OPTIONS = [
  "PCM (Physics, Chemistry, Maths)",
  "PCB (Physics, Chemistry, Biology)",
  "PCMB (Physics, Chemistry, Maths & Biology)",
  "Commerce (with Maths)",
  "Commerce (without Maths)",
  "Arts / Humanities",
  "Vocational",
  "Other",
];

// ─── CITY OPTIONS ─────────────────────────────────────────────
export const CITY_OPTIONS = [
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Noida",
  "Gurugram",
  "Remote",
];

// ─── STUDY MODE OPTIONS ───────────────────────────────────────
export const MODE_OPTIONS = ["Offline", "Online", "Distance"];

// ─── ROADMAP TAB OPTIONS ──────────────────────────────────────
export const ROADMAP_TABS = [
  { id: "overview", label: "📋 Overview" },
  { id: "skills",   label: "🛠 Skills to Build" },
  { id: "certs",    label: "🏅 Certifications" },
  { id: "tools",    label: "⚙️ Tools" },
];

// ─── COLLEGE TYPE COLOURS ─────────────────────────────────────
export const COLLEGE_TYPE_COLORS = {
  IIT:     "#e74c3c",
  NIT:     "#3498db",
  IIM:     "#9b59b6",
  AIIMS:   "#2ecc71",
  IGNOU:   "#f39c12",
  Govt:    "#1abc9c",
  Private: "#e67e22",
};

// ─── ELIGIBILITY COLOURS ──────────────────────────────────────
export const ELIGIBILITY_COLORS = {
  "Eligible ✅":     "var(--foam)",
  "Reach 🎯":        "var(--gold)",
  "Aspirational 🌟": "var(--coral)",
};

// ─── SALARY THRESHOLDS ───────────────────────────────────────
export const SALARY_THRESHOLDS = {
  high:   600000,
  medium: 350000,
};

// ─── ISLAND COLOURS ──────────────────────────────────────────
export const ISLAND_COLORS = [
  { top: "linear-gradient(160deg, #0e5a6e, #1a8fa0)", shadow: "rgba(26,143,160,.5)" },
  { top: "linear-gradient(160deg, #6e3a0e, #b87020)", shadow: "rgba(184,112,32,.5)" },
  { top: "linear-gradient(160deg, #1a5c2e, #2a9050)", shadow: "rgba(42,144,80,.5)" },
];

// ─── ISLAND ICONS ────────────────────────────────────────────
export const ISLAND_ICONS = ["🎯", "⭐", "🗺️"];

// ─── FALLBACK PREP DATA ──────────────────────────────────────
export const FALLBACK_PREP = {
  skills:         ["Domain knowledge", "Communication", "Problem solving", "Teamwork", "Industry tools"],
  certifications: ["LinkedIn Learning courses", "Coursera specialisation", "Industry certification"],
  tools:          ["Microsoft Office", "Google Workspace", "Project management tools"],
  timeline:       "3-6 months",
  tip:            "Research top companies hiring for this role and tailor your preparation accordingly.",
};

// ─── FALLBACK SALARY DATA ────────────────────────────────────
export const FALLBACK_SALARY = {
  fresher: [250000, 450000],
  mid:     [550000, 950000],
  senior:  [1100000, 2000000],
  avg:     350000,
  source:  "Market estimate",
};