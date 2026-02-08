# 🌿 HerbBuddy

HerbBuddy is a community-driven event and social connection app focused on trust, vibes, and meaningful interactions.  
Users can discover events, join plans, chat with participants, and build a reputation through vibe and trust ratings.

---

## 🚀 Tech Stack

### Frontend
- Expo (React Native)
- Expo Router
- TypeScript
- React Native Maps
- Socket-ready architecture

### Backend (In Progress)
- Node.js
- Express.js
- Railway.app (hosting)
- Socket.io (real-time)
- node-cron (background jobs)

### Authentication & Database
- Supabase Auth (Email, OTP, OAuth)
- Supabase PostgreSQL (single source of truth)

---

## 🧠 Core Features

- 🔐 Secure authentication (Supabase)
- 📍 Event creation & discovery
- 🗓️ Events with start & end time
- 💬 Real-time chat between participants
- ⭐ Vibe & Trust rating system after events
- 🛡️ Content moderation (illegal / drug / sexual content blocking)
- ⚡ Smooth loading animations (skeletons & blur effects)

---

## 🧩 Architecture Overview

- Mobile app communicates **only** with backend APIs
- Backend (Railway) acts as middleware and gatekeeper
- Supabase is used for:
  - Authentication
  - PostgreSQL database
- No direct database calls from the client

---

## 🛠️ Project Structure

```
herbbuddy/
├── app/                 # Expo app (frontend)
├── backend/             # Express backend (Railway)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── components/
├── lib/
└── README.md
```

---

## 🧪 Development Status

- Frontend: Actively developing
- Backend: Being migrated to Railway
- Realtime chat: Planned via Socket.io
- Ratings system: Planned

---

## 📌 Environment Variables (Backend)

These are set in Railway, **not committed to GitHub**:

- `DATABASE_URL`
- `SUPABASE_JWT_SECRET`
- `PORT=3000`

---

## 👤 Author

Built with ❤️ by **Vimal Rana**  
B.Tech CSE | App Developer | Builder

---

## ⚠️ Note

This project is under active development.  
Breaking changes may occur as architecture evolves.
