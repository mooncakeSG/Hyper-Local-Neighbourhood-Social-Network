# Frontend - Neighbourhood Social Network

React + Vite frontend for the Neighbourhood Social Network platform.

## Setup

```bash
npm install
cp .env.example .env
# Add your Supabase credentials to .env
npm run dev
```

## Structure

- `src/pages/` - Page components (Auth, Feed, Neighbourhood Selection)
- `src/components/` - Reusable components (PostCard, CommentDrawer, Layout)
- `src/store/` - Zustand state management
- `src/lib/` - Utilities (Supabase client)
- `src/styles/` - Tailwind CSS styles

## Key Features

- Phone OTP authentication
- Neighbourhood selection
- Feed with posts and alerts
- Comments system
- Mobile-first design with bottom navigation

## Build

```bash
npm run build
```
