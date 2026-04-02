# Discipline Tracker Backend

Production-grade Discipline Tracking System backend built with Node.js, Express, TypeScript, Neon PostgreSQL, and Drizzle ORM.

## Features

- **Daily Logs**: Track daily discipline metrics with automatic score calculation
- **Analytics**: Weekly/monthly insights, consistency tracking, habit completion rates
- **Streak System**: Consecutive day tracking with configurable thresholds
- **Production Ready**: Rate limiting, error handling, logging, type safety

## Tech Stack

- Node.js + Express
- TypeScript
- Neon Serverless PostgreSQL
- Drizzle ORM
- Zod Validation
- Winston Logging

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your Neon database URL
```

### 3. Database Setup

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/logs` | Create/Update daily log |
| GET | `/api/logs` | Get all logs (optional: ?range=week/month/year) |
| GET | `/api/logs/:date` | Get single day log (YYYY-MM-DD) |
| PATCH | `/api/logs/:date` | Update specific log |
| DELETE | `/api/logs/:date` | Delete log |
| GET | `/api/analytics` | Get analytics data |
| GET | `/api/streak` | Get streak information |
| GET | `/health` | Health check |

## Scoring System

| Task | Points |
|------|--------|
| Each Deep Work Block | 2 points |
| Backend Done | 2 points |
| DSA Done | 2 points |
| GitHub Commit | 2 points |
| Workout | 1 point |
| Sunlight | 1 point |
| Sleep Followed | 1 point |
| Woke On Time | 1 point |

**Max Possible Score: 15 points**

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

## Project Structure

```
src/
├── config/        # Environment configuration
├── db/            # Drizzle schema & connection
├── modules/       # Feature modules (logs, analytics, streak)
├── middlewares/   # Express middlewares
├── utils/         # Utilities (errors, logger)
├── routes/        # Route definitions
├── app.ts         # Express app setup
└── server.ts      # Server entry point
```
