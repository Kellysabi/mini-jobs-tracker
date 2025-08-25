# Mini Job Tracker - AppEasy Technical Assessment

A full-stack job application tracking system built with Next.js, TypeScript, and AI integration.

## 🏗️ Project Structure

```
mini-job-tracker/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local
├── .gitignore
├── data/
│   └── jobs.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── jobs/
│   │       │   ├── jobs.ts
│   │       │   └── [id]/
│   │       │       └── jobs.ts
│   │       └── analyze/
│   │           └── jobs.ts
│   ├── components/
│   │   ├── JobForm.tsx
│   │   ├── JobTable.tsx
│   │   ├── JobAnalyzer.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── Modal.tsx
│   ├── types/
│   │   └── job.ts
│   └── lib/
│       ├── fileStorage.ts
│       └── openai.ts
└── public/
    └── favicon.ico
```

## 🚀 Getting Started

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd mini-job-tracker
   npm install
   ```

2. **Environment Variables**
   Create `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## ✨ Features

### Core Features
- ✅ Add job applications with all required fields
- ✅ Dashboard with job applications table
- ✅ Edit and delete job entries
- ✅ RESTful API endpoints
- ✅ TypeScript throughout
- ✅ Responsive design with Tailwind CSS

### AI Bonus Feature
- 🤖 Job description analysis using OpenAI
- 📝 Job summary generation
- 💡 Resume skill suggestions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Storage**: Local JSON file
- **AI**: OpenAI GPT-3.5-turbo
- **Icons**: Lucide React

## 📁 Key Files Overview

- `src/app/page.tsx` - Main dashboard page
- `src/components/JobForm.tsx` - Add/edit job form
- `src/components/JobTable.tsx` - Jobs display table
- `src/components/JobAnalyzer.tsx` - AI job analysis
- `src/app/api/jobs/jobs.ts` - Jobs API endpoints
- `src/lib/fileStorage.ts` - File-based data persistence

## 🧪 API Endpoints

- `GET /api/jobs` - Fetch all jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/analyze` - Analyze job description with AI

## 📦 Installation Commands

```bash
# Create Next.js app
npx create-next-app@latest mini-job-tracker --typescript --tailwind --eslint --app

# Install dependencies
npm install lucide-react openai uuid
npm install -D @types/uuid

# Run development server
npm run dev
```

## 🎯 Assessment Compliance

This project addresses all requirements:
- ✅ Next.js + TypeScript frontend
- ✅ Node.js backend (API routes)
- ✅ Job form with all required fields
- ✅ Dashboard with job table
- ✅ Edit/delete functionality
- ✅ RESTful API endpoints
- ✅ In-memory storage (JSON file)
- ✅ AI bonus feature with OpenAI
- ✅ Professional code structure
- ✅ Clear documentation