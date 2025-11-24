# Neighbourhood Social Network

A hyper-local social platform for South African neighbourhoods.

## 🎯 Project Overview

This platform enables neighbours to connect, share local updates, post alerts, browse local businesses, and participate in a marketplace - all within their specific neighbourhood boundaries.

## 🛠 Tech Stack

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS (black/white theme)
- **State Management**: Zustand + React Query
- **Animations**: Framer Motion
- **Routing**: React Router
- **Design**: Mobile-first, social media vibe

### Backend
- **Framework**: FastAPI (async)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Phone Auth (OTP)
- **Storage**: Supabase Storage
- **Notifications**: OneSignal (REST API)
- **Hosting**: Railway or Fly.io
- **Security**: Supabase Row-Level Security (RLS) for neighbourhood isolation

## 📁 Project Structure

```
.
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   ├── store/    # Zustand stores
│   │   ├── lib/      # Utilities (Supabase client)
│   │   └── styles/   # Tailwind CSS
│   └── package.json
│
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/v1/   # API routes
│   │   ├── services/ # Business logic
│   │   ├── models/   # Pydantic models
│   │   └── db/       # Database utilities
│   └── requirements.txt
│
└── database/         # Database schema
    └── schema.sql    # Supabase SQL schema
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Supabase account
- OneSignal account (free tier)

### 1. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in the Supabase SQL Editor
3. Enable Phone Auth in Supabase Authentication settings
4. Note down your Supabase URL and keys

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload
```

### 4. Environment Variables

**Frontend (.env)**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ONESIGNAL_API_KEY=your_onesignal_api_key
ONESIGNAL_APP_ID=your_onesignal_app_id
```

## 📱 Features

### MVP Features
- ✅ Phone OTP authentication
- ✅ Neighbourhood selection (GPS or list)
- ✅ Feed with local posts
- ✅ Post creation (regular posts and alerts)
- ✅ Comments on posts
- ✅ Alert notifications via OneSignal
- ✅ Row-level security for neighbourhood isolation

### Future Features
- Marketplace module
- Business listings
- User profiles
- Invite system
- Image uploads

## 🔐 Security

- Row-Level Security (RLS) ensures users can only see posts from their neighbourhood
- Supabase handles authentication and session management
- API endpoints validate user authorization

## 📦 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Fly.io)
```bash
cd backend
docker build -t neighbourhood-api .
# Push to Railway/Fly.io
```

## 🧪 Development Order

1. ✅ Setup Supabase project and database tables
2. ✅ Frontend: React setup + Tailwind + basic pages
3. ✅ Auth flow (phone OTP) using Supabase
4. ✅ Select neighbourhood via GPS or list
5. ✅ Feed page with local posts
6. ✅ Post composer component
7. ✅ Backend FastAPI setup
8. ✅ Alert notifications using OneSignal
9. ⏳ Marketplace module
10. ⏳ Business listing module

## 📝 MVP Validation

- **Goal**: Test if users post, reply, and invite neighbours
- **First Launch Area**: One South African suburb only
- **Viral Loop**: Invite link per user + WhatsApp group migration


## 📄 License

Private - All rights reserved

