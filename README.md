# 🎯 Discipline Tracker

A production-grade full-stack application for tracking daily discipline, habits, and productivity with real-time analytics and streak tracking.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-18-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🌟 Overview

**Discipline Tracker** helps you build consistency by tracking daily execution across multiple life areas:

- **Deep Work** - Focused productivity blocks
- **Learning** - Backend, DSA, GitHub commits
- **Health** - Workout, sunlight exposure
- **Routine** - Sleep schedule, morning reset

The app uses a **12-point scoring system** to gamify discipline and provide clear feedback on your daily performance.

## ✨ Features

### Core Features
- ✅ **Daily Check-in** - Track 11 tasks + focus level
- 📊 **12-Point Scoring** - Elite (10-12), Good (6-9), Missed (<6)
- 🔥 **Streak System** - Track consecutive productive days
- 📈 **Analytics Dashboard** - Score trends, completion rates, heatmaps
- 📱 **Responsive Design** - Works on desktop, tablet, mobile

### Technical Features
- ⚡ **Real-time Updates** - React Query with optimistic updates
- 🔄 **Auto-save** - Check-ins update existing entries
- 🎯 **Validation** - Zod schema validation frontend & backend
- 🛡️ **Security** - Rate limiting, input sanitization, CORS
- 📊 **Logging** - Winston + Logtail for production monitoring

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component Library |
| React Query | State Management |
| Recharts | Data Visualization |
| date-fns | Date Handling |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web Framework |
| TypeScript | Type Safety |
| Drizzle ORM | Database ORM |
| Neon PostgreSQL | Database |
| Zod | Validation |
| Winston | Logging |
| Logtail | Log Aggregation |
| Helmet | Security |

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   Database      │
│   (Vercel)      │◄────│   (Vercel)      │◄────│   (Neon)        │
│                 │     │                 │     │                 │
│ • React         │     │ • Express       │     │ • PostgreSQL    │
│ • React Query   │     │ • Drizzle ORM   │     │ • Daily Logs    │
│ • Tailwind      │     │ • REST API      │     │ • Analytics     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │   Logtail       │
         │              │   (Monitoring)  │
         │              └─────────────────┘
         │
    VITE_API_URL
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/devraman07/discipline_Tracker.git
cd discipline_Tracker
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

Create `backend/.env`:
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=your_neon_database_url
LOG_LEVEL=info
# Optional: LOGTAIL_SOURCE_TOKEN=your_token
```

Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:3000/api
```

5. **Run database migrations**
```bash
cd backend
npm run db:push
```

6. **Start development servers**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

7. **Open browser**
Navigate to `http://localhost:8080`

## 🔐 Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Server port (default: 3000) |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `LOG_LEVEL` | No | `error`, `warn`, `info`, `debug` |
| `LOGTAIL_SOURCE_TOKEN` | No | Better Stack Logtail token |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |

## 📚 API Documentation

### Base URL
```
Production: https://your-backend.vercel.app/api
Development: http://localhost:3000/api
```

### Endpoints

#### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/logs` | Create or update daily log |
| `GET` | `/logs` | Get all logs (with pagination) |
| `GET` | `/logs/:date` | Get log by specific date |
| `PUT` | `/logs/:date` | Update existing log |
| `DELETE` | `/logs/:date` | Delete log |

**Request Body (POST/PUT):**
```json
{
  "date": "2024-01-15",
  "deepWorkHours": 6,
  "sleepHours": 7.5,
  "wokeOnTime": true,
  "sleepFollowed": true,
  "morningReset": true,
  "deepWorkBlock1": true,
  "deepWorkBlock2": true,
  "deepWorkBlock3": true,
  "backendDone": true,
  "dsaDone": true,
  "githubCommit": true,
  "workoutDone": true,
  "sunlightTaken": true,
  "focusLevel": "high",
  "reflection": "Great productive day!"
}
```

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics` | Get summary statistics |
| `GET` | `/analytics/trend?days=30` | Get score trend |
| `GET` | `/analytics/categories` | Get category breakdown |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 45,
    "averageScore": 8.5,
    "completionRate": 78,
    "eliteDays": 20,
    "eliteRate": 44,
    "currentStreak": 5
  }
}
```

#### Streak
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/streak` | Get current streak info |

## 🌐 Deployment

### Vercel Deployment

#### Step 1: Deploy Backend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Root Directory:** `backend`
5. Add environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=your_neon_url`
   - `LOGTAIL_SOURCE_TOKEN=your_token` (optional)
6. Click **Deploy**

#### Step 2: Get Backend URL

After deployment, note your backend URL:
```
https://discipline-tracker-api.vercel.app/api
```

#### Step 3: Deploy Frontend

1. In Vercel, add new project
2. Import same repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
4. Add environment variable:
   - `VITE_API_URL=https://your-backend.vercel.app/api`
5. Click **Deploy**

#### Step 4: Configure CORS

Update backend environment variable:
```
FRONTEND_URL=https://your-frontend.vercel.app
```

### Database Setup (Neon)

1. Create account at [Neon](https://neon.tech)
2. Create new project
3. Copy connection string
4. Add to backend environment variables

### Logtail Setup (Optional)

1. Sign up at [Better Stack](https://betterstack.com)
2. Create Logtail source
3. Copy source token
4. Add to backend environment variables

## 📝 Scoring System

| Score | Status | Emoji |
|-------|--------|-------|
| 10-12 | Elite | 🔥 |
| 6-9 | Good | ⚡ |
| 0-5 | Missed | ❌ |

**12-Point Breakdown:**
- Deep Work Blocks: 3 points
- Learning Tasks: 3 points
- Health Tasks: 2 points
- Routine Tasks: 3 points
- Focus Level (High): 1 point

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 👤 Author

**Raman** - [GitHub](https://github.com/devraman07)

---

Built with discipline. Track your progress. Dominate your goals.
