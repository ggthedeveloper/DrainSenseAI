# DrainSense India — Deployment Guide

## 1. Local Development
### Backend:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## 2. Docker Compose
```bash
docker-compose up --build
```
- Backend available at `http://localhost:8000`
- Frontend available at `http://localhost:3000`

## 3. Cloud Deployment
- **Frontend (Vercel):**
  - Connect GitHub repository. Set Root Directory to `frontend`.
  - Environment variables: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
- **Backend (Render):**
  - Create new Web Service from `render.yaml`.
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
