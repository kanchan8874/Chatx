# ChatX Monorepo

Premium real-time chat experience split into dedicated frontend and backend apps.

```
chatx/
├── frontend/   # Next.js (App Router) UI + Socket.io client
└── backend/    # Express + MongoDB + Socket.io server
```

## Prerequisites
- Node.js 18+
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/chatx`)

## Environment variables
The root `.env` file is shared by both apps.

```env
MONGODB_URI=mongodb://127.0.0.1:27017/chatx
JWT_SECRET=change_this_in_production
BACKEND_PORT=4000
CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Install dependencies
```bash
# Frontend deps
cd frontend
npm install

# Backend deps
cd ../backend
npm install
```

## Run locally
```bash
# Terminal 1 - backend
cd backend
npm run dev

# Terminal 2 - frontend
cd frontend
npm run dev
```
- Backend runs on http://localhost:4000
- Frontend runs on http://localhost:3000

## Deploy notes
- Deploy backend (Express) as Node service and expose `/api/*` + Socket.io
- Deploy frontend (Next.js) separately and set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL` envs to the backend URL
