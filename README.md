# Multi-Agent AI Recruitment Platform

A full-stack recruitment automation platform with AI-powered intake, sourcing, outreach, scheduling, submission, and debrief agents.

## Project structure

- backend/: FastAPI backend with multiple recruitment agents
- frontend/: React + Vite frontend

## Getting started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notes

- Add your own credentials and environment variables locally.
- Sensitive files such as credentials.json and token_google.json are ignored by Git.
