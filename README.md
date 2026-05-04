# Property Management CRM

Premium MERN property management and real estate inventory CRM with JWT auth, role-based access, smart inventory filtering, lead management, follow-up tracking, and client-safe sharing.

## Apps

- `client/`: React + Vite + Tailwind frontend
- `server/`: Express + MongoDB backend

## Quick Start

1. Install dependencies in `client/` and `server/`
2. Copy `server/.env.example` to `server/.env`
3. Set `MONGODB_URI` to your MongoDB Atlas cluster
4. Set Cloudinary credentials:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. Run `npm run dev` in each app or use the package scripts from the repo root

## Deployment

### Frontend on Vercel

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://your-render-backend.onrender.com/api`

### Backend on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `MONGODB_URI=...`
  - `JWT_SECRET=...`
  - `JWT_EXPIRES_IN=7d`
  - `CLIENT_URL=https://your-vercel-frontend.vercel.app`
  - `CLOUDINARY_CLOUD_NAME=...`
  - `CLOUDINARY_API_KEY=...`
  - `CLOUDINARY_API_SECRET=...`

## Upload Storage

- Files upload to Cloudinary
- MongoDB stores public Cloudinary URLs
- No local `/uploads` storage is required in production
