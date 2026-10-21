# Online Quiz Maker

Create, share, and take multiple-choice quizzes. Users register, build quizzes with a form, publish them for others, answer one question at a time, and get instant scores with full answer review.

## Stack

- **Frontend:** Vite 5, React 18, React Router 6, plain CSS (JavaScript/JSX) — port 5173
- **Backend:** Express 4 (CommonJS) — port 5000
- **Database:** MongoDB via Mongoose 8 (required, no fallback)
- **Auth:** JWT Bearer tokens + bcryptjs password hashing

## Project structure

```
online-quiz-maker\
├── client\   # React frontend (Vite)
└── server\   # Express API + MongoDB
```

## Setup

### 1. Backend

```powershell
cd server
copy .env.example .env
# Edit .env: set MONGO_URI (MongoDB Atlas or local) and JWT_SECRET
npm install
npm run dev
```

Server runs at http://localhost:5000

### 2. Frontend

```powershell
cd client
copy .env.example .env   # optional; defaults to http://localhost:5000
npm install
npm run dev
```

App runs at http://localhost:5173

## Environment variables

| Variable | File | Required | Purpose |
|---|---|---|---|
| `MONGO_URI` | server/.env | Yes | MongoDB connection string |
| `JWT_SECRET` | server/.env | Yes | Token signing secret |
| `PORT` | server/.env | No | API port (default 5000) |
| `CLIENT_URL` | server/.env | No | CORS origin (default http://localhost:5173) |
| `VITE_API_URL` | client/.env | No | API base URL (default http://localhost:5000) |

Never commit real `.env` files.

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Log in |
| GET | /api/auth/me | Bearer | Current user |
| GET | /api/quizzes | — | List quizzes (no answers) |
| GET | /api/quizzes/:id | — | Quiz for taking (correct answers stripped) |
| POST | /api/quizzes | Bearer | Create quiz (validated) |
| POST | /api/quizzes/:id/submit | Bearer | Submit answers, server-side scoring |

## Features

- Register / login / logout with secure password hashing
- Quiz creation: title, description, multiple questions, 2–6 options each, one correct answer marked per question
- Browse published quizzes
- One-question-at-a-time quiz taking with progress bar, question dots, previous/next navigation, answer selection preserved
- Server-side scoring only — correct answers are never sent to the browser before submission
- Results: total, correct, incorrect, score percentage, per-question review with your answer vs. the correct answer
- Responsive gradient UI (desktop, tablet, mobile)
