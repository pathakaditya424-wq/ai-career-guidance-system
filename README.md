# 🎓 AI Career Guidance System

Ever felt lost about what career to pick after college? That's exactly why I built this.

This is a full-stack AI-powered career guidance system that takes a student's interests and academic background, and recommends the most suitable careers — along with real NIRF-ranked colleges and actual fresher job listings to go with it.

---

## 🤔 What does it actually do?

You answer a few simple questions — your stream, your interests, preferred city, budget for college fees — and the system:

- Predicts the **top 3–5 careers** that suit you best
- Shows **NIRF-ranked colleges** filtered by your budget and preferred mode (Offline / Online / Distance)
- Lists **real fresher jobs** in your preferred city for that career
- Tags each college as **Eligible ✅, Reach 🎯, or Aspirational 🌟** based on your marks
- Shows **salary benchmarks** and a **career preparation roadmap** with skills, certifications, and tools

---

## 🛠️ Tech Stack

**Backend**
- Python, FastAPI
- scikit-learn (Logistic Regression + TF-IDF pipeline)
- Pandas, NumPy

**Frontend**
- React (Vite)
- 3-step wizard UI — no free typing, just chips and sliders

**Data**
- 470 NIRF-ranked colleges (2024)
- 845 fresher job listings
- 741 career training samples across 15 career categories

---

## 🧠 How the ML model works

The model is trained on a dataset of skills + interests mapped to 15 career labels. I tested Logistic Regression, Random Forest, and Linear SVC — Logistic Regression won with:

- Top-1 accuracy: **62%**
- Top-3 accuracy: **79%**
- Top-5 accuracy: **91%**

The pipeline uses TF-IDF (unigram + bigram, 5000 features) and a keyword boost layer on top of raw probabilities to handle underrepresented careers better.

---

## 🎯 15 Career Categories

Software Developer, ML/AI Engineer, Data Analyst, Data Engineer, DevOps Engineer, Research Scientist, Mechanical Engineer, Civil Engineer, Project Manager, Graphic Designer, UI/UX Designer, Finance, Marketing, Sales Executive, Teacher

---

## 🚀 Running it locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs at `http://localhost:8000` — API docs at `http://localhost:8000/docs`

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`

> ⚠️ You'll need the `career_guidance_v3.pkl` model bundle in the `/backend` folder to run the backend. It's not included in this repo due to file size — contact me or generate it using the training notebook.

---

## 📁 Project Structure

```
ai-career-guidance-system/
├── backend/
│   ├── main.py               # FastAPI server
│   ├── requirements.txt      # Python dependencies
│   └── career_guidance_v3.pkl  # ML model bundle (not in repo)
├── frontend/
│   ├── src/
│   │   ├── pages/            # InputPage, RoadmapPage, JobsPage, CollegesPage
│   │   ├── components/       # OceanBG, Compass, Btn, Slider, etc.
│   │   └── data/constants.js # All config and lists
│   └── package.json
└── README.md
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/careers` | List all 15 careers |
| GET | `/colleges` | Browse NIRF colleges |
| GET | `/jobs` | Browse fresher jobs |
| GET | `/college-types` | Fee ranges by college type |
| GET | `/career-prep` | Skills, certs, tools per career |
| GET | `/salary-data` | Fresher/mid/senior salary benchmarks |
| POST | `/predict` | Main prediction endpoint |
| POST | `/predict/detailed` | Detailed results for all top-N careers |

---

## 👨‍💻 Built by

Aditya — Final Year Project 2024–25

If you found this useful or want to collaborate, feel free to reach out!
