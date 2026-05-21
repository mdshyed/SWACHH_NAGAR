# Swachh Nagar | स्वच्छ नगर

> Smart City Cleanliness Management Platform — Inspired by Swachh Bharat Mission

A production-ready, full-stack web application that empowers citizens to report civic cleanliness issues and enables authorities to manage and resolve them efficiently.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Axios, React Router v6 |
| Backend | Node.js 18+, Express.js (MVC) |
| Database | MongoDB (Mongoose ODM) |
| Real-Time | Socket.io |
| Image Storage | Cloudinary (CDN + transformations) |
| Maps | Google Maps JavaScript API |
| Auth | JWT (access + refresh token rotation) |
| AI | TensorFlow.js (server-side image validation) |
| Background Jobs | node-cron |
| Logging | Winston |

---

## Features

- **Citizen Complaint Reporting** — multi-step form with photo upload, GPS auto-detect, AI image validation
- **Role-Based Access** — User / Admin / Super-Admin with JWT auth
- **Interactive Map** — GeoJSON complaint markers with status colors, clustering, info popups
- **Real-Time Notifications** — Socket.io push on every status change
- **Gamification** — points, badges, leaderboard (weekly/monthly/all-time)
- **Admin Dashboard** — KPI cards, trend charts (Recharts), complaint management table
- **Analytics** — trend analysis, category breakdown, ward heatmap
- **Garbage Collection Scheduler** — ward-wise timings with today's view
- **Awareness Blog** — multilingual content (EN/HI)
- **Multi-Language** — English and Hindi toggle
- **AI Image Validation** — TF.js server-side garbage detection

---

## Project Structure

```
Swachh Nagar/
├── swachh-nagar-backend/   # Node.js / Express API (port 5000)
│   └── src/
│       ├── config/          # DB, Cloudinary, Socket, logger, multer
│       ├── constants/       # Roles, statuses, categories, point values
│       ├── controllers/     # Thin HTTP layer (auth, complaint, analytics…)
│       ├── middleware/       # Auth, roles, validation, error handler
│       ├── models/          # Mongoose schemas (User, Complaint, Badge…)
│       ├── routes/          # RESTful route definitions
│       ├── services/        # Business logic (auth, gamification, image…)
│       ├── sockets/         # Socket.io namespaces + auth middleware
│       ├── utils/           # ApiResponse, ApiError, asyncHandler, pagination
│       └── server.js        # Entry point (HTTP + Socket.io)
│
└── swachh-nagar-frontend/  # React SPA (port 3000)
    └── src/
        ├── config/          # Axios instance, Socket client
        ├── context/         # AuthContext, LanguageContext, NotificationContext
        ├── pages/           # public/, user/, admin/
        ├── components/      # layout/, common/, complaint/, map/, dashboard/
        ├── locales/         # en.json, hi.json translations
        └── App.js           # Router + Providers
```

---

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Cloudinary account
- Google Maps API key

### 1. Backend Setup

```bash
cd swachh-nagar-backend
cp .env.example .env
# Fill in your credentials in .env
npm install
npm run dev
```

### 2. Frontend Setup

```bash
cd swachh-nagar-frontend
cp .env.example .env
# Fill in your credentials in .env
npm install
npm start
```

---

## Environment Variables

### Backend (`.env`)

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/swachh-nagar

JWT_ACCESS_SECRET=<min_32_chars>
JWT_REFRESH_SECRET=<min_32_chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_MAPS_API_KEY=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### Frontend (`.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=
```

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register user |
| POST | `/auth/login` | — | Login → tokens |
| POST | `/auth/logout` | ✓ | Invalidate session |
| POST | `/auth/refresh-token` | cookie | Rotate tokens |
| GET | `/auth/me` | ✓ | Get current user |
| POST | `/complaints` | ✓ | Submit complaint |
| GET | `/complaints/mine` | ✓ | My complaints |
| GET | `/complaints/map` | ✓ | GeoJSON for map |
| PATCH | `/complaints/admin/:id/status` | Admin | Update status |
| GET | `/analytics/overview` | Admin | KPI summary |
| GET | `/analytics/trends` | Admin | Time-series data |
| GET | `/gamification/leaderboard` | ✓ | Top users |
| GET | `/schedules/today` | — | Today's collections |
| GET | `/blogs` | — | Published posts |

---

## Database Collections

| Collection | Purpose |
|---|---|
| `users` | Citizens & admins (JWT auth, points, level) |
| `complaints` | Reports with GeoJSON location, status history |
| `badges` | Badge definitions with criteria |
| `userbadges` | User ↔ badge junction (prevent duplicates) |
| `pointtransactions` | Full audit log of points earned/deducted |
| `notifications` | In-app notifications (90-day TTL) |
| `blogs` | Awareness articles (EN/HI) |
| `garbageschedules` | Ward-wise collection timings |
| `wards` | City ward master data with GeoJSON polygons |

---

## Deployment

### Backend (Render / Railway)
1. Set all env vars in dashboard
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_*` env vars
2. Build command: `npm run build`
3. Publish directory: `build`

### MongoDB
Use [MongoDB Atlas](https://cloud.mongodb.com) free tier — replace `MONGODB_URI` with your connection string.

---

## Architecture Highlights

- **Service Layer** — Controllers stay thin; all business logic in services
- **2dsphere Index** — Native MongoDB geo queries for map & nearby features
- **Refresh Token Rotation** — Hashed storage, invalidation on each use
- **Socket.io Rooms** — User rooms (`user:ID`) + ward rooms (`ward:ID`)
- **TF.js Server-Side AI** — Model loaded once at startup, never exposed to client
- **Denormalized Leaderboard** — Pre-computed snapshots for sub-5ms reads
- **Rate Limiting** — Tiered (global → API → auth endpoints)

---

## License

MIT © 2026 Swachh Nagar

---

*Made with 🌱 for a cleaner India*
