# InSingh - LinkedIn Content Planner & Scheduler

InSingh is a premium LinkedIn management SaaS designed for individual creators to plan, schedule, and analyze their content strategy with ease. 

## 🚀 Features

- **OAuth Integration**: Secure LinkedIn login via NextAuth.js.
- **Smart Scheduler**: Plan posts for the future with a custom calendar and time picker.
- **Visual Analytics**: 
  - GitHub-style **Consistency Heatmap**.
  - **🔥 Posting Streaks** to build daily habits.
  - Character volume tracking and status distribution charts.
- **Post Management**: Easily reschedule or cancel upcoming content.
- **Background Worker**: Automated publishing system that runs in the background.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Prisma ORM with SQLite (Dev)
- **Auth**: NextAuth.js (LinkedIn Provider)
- **Charts**: Recharts & React Calendar Heatmap
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics

## 🚦 Getting Started

### 1. Prerequisites
- Node.js 18+
- A LinkedIn Developer App (for Client ID/Secret)

### 2. Installation
```bash
git clone <your-repo-url>
cd linkedin-planner
npm install
```

### 3. Environment Setup
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your LinkedIn API credentials.

### 4. Database Setup
```bash
npx prisma db push
```

### 5. Run the Application
Start the Next.js server:
```bash
npm run dev
```

In a separate terminal, start the background scheduler:
```bash
node worker.js
```

## 📈 Roadmap
- [ ] AI-powered post generation.
- [ ] Multi-platform support (X, Instagram).
- [ ] Advanced audience sentiment analysis.

---
Built with ❤️ for LinkedIn Creators.
