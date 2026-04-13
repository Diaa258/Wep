# Game Discs (Frontend + Backend)

A modern, responsive web app for browsing and booking game discs.

## Tech

- Frontend: HTML + CSS + TypeScript (Vite, vanilla TS SPA)
- Backend: Node.js + Express + TypeScript
- Storage: simple JSON file at `backend/data/db.json`

## Requirements

- Node.js 18+ recommended

## Run Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

- `http://localhost:4000`

## Run Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

- `http://localhost:5173`

## Features

- Home: horizontal “disc lane” layout with animated cards
- Details page: full description, image gallery, booking form (زر "احجز الآن")
- Dashboard: add game + auto-generate details when description is empty
- Analytics:
  - Total visitors (unique `visitorId` stored in localStorage)
  - Views per game
  - Time spent per game page

## APIs

- `GET /games`
- `GET /games/:id`
- `POST /games`
- `POST /bookings`
- `POST /analytics/events`
- `GET /analytics`

## Notes

- Seed games are auto-added if your DB is empty.
- All data is stored in `backend/data/db.json` to keep setup simple.
