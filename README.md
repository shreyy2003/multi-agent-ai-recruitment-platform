# Multi-Agent AI Recruitment Platform

> An AI-powered recruitment automation platform that orchestrates the complete hiring lifecycle through six specialized AI agents, combining Large Language Models with a full-stack web application and a centralized recruitment pipeline.

---

## Overview

The **Multi-Agent AI Recruitment Platform** is a full-stack recruitment automation system designed to streamline the hiring workflow from client intake to candidate submission.

Instead of relying on a single AI assistant, the platform is built around **six independent AI agents**, each responsible for a dedicated stage of the recruitment process. Every agent can operate independently or participate in a unified recruitment pipeline backed by a centralized state store.

The system follows a **Human-in-the-Loop** architecture, allowing recruiters to review, edit, and approve AI-generated outputs before advancing candidates through the hiring process.

---

## Demo

**Live Demo:** *(Coming Soon)*

**Project Walkthrough:** *(Coming Soon)*

---

# Features

> **Pipeline Integration:** All agents support automatic field pre-population from the centralized recruitment pipeline, enabling seamless transitions between stages while also supporting standalone operation.

### Client Intake Agent
- Converts raw Job Descriptions into structured hiring specifications
- Extracts required skills, experience, salary range, hiring urgency and screening criteria
- Supports PDF, DOCX and plain text inputs

---

### Candidate Sourcing Agent

- Parses and normalizes unstructured Job Descriptions into structured hiring requirements
- Automatically classifies jobs into domain-specific recruitment workflows
- Generates optimized Boolean search queries for candidate discovery
- Performs AI-powered candidate evaluation across multiple dimensions:
  - Technical Skill Match
  - Relevant Experience
  - Seniority Level
  - Role Relevance
  - Location Compatibility
- Detects candidate availability signals such as:
  - Open to Work
  - Recently Left Current Role
  - Freelancing / Contract Availability
- Implements a **Hybrid Candidate Pooling Strategy**:
  - Top 6 candidates selected based on qualitative AI match scores
  - Top 4 candidates selected based on availability and hiring signals
  - Produces a balanced shortlist of 10 candidates
- Provides recruiter-friendly candidate scorecards with detailed scoring rationale
- Tracks LLM token consumption for every sourcing operation
- Prevents duplicate candidate entries using LinkedIn profile validation
- Supports seamless pipeline integration for downstream outreach and interview stages

---

### Outreach Agent
- Generates personalized LinkedIn InMails
- Generates professional Email outreach
- Supports multiple communication tones
- Produces follow-up messages automatically

---

### Interview Scheduling Agent
- Generates scheduling emails
- Supports Google Calendar integration
- Supports Microsoft Outlook integration
- Creates structured interview time slots

---

### Interview & Debrief Agent

**AI-powered interview evaluation with evidence-based candidate assessment**

- 📄 Accepts multiple input sources including:
  - Job Description (PDF, DOCX, Text)
  - Interview Transcript
  - Candidate Resume (Optional)
- 🧠 Compares interview responses directly against the Job Description
- 🛡️ Implements a **Zero-Hallucination Evaluation Framework**, ensuring every assessment is supported by verifiable evidence from the provided documents
- 📊 Calculates Job Description Match Percentage by identifying:
  - Fully Met Requirements
  - Partially Met Requirements
  - Missing Requirements
- 📑 Performs Resume Consistency Analysis by:
  - Verifying claims discussed during the interview
  - Identifying skills present in the resume but not demonstrated
  - Detecting interview claims absent from the resume
- ⭐ Generates structured hiring recommendations:
  - Strong Hire
  - Hire
  - Borderline
  - No Hire
- ❓ Produces targeted follow-up questions to address identified knowledge gaps
- 📋 Generates recruiter-ready interview scorecards with detailed justification
- 📄 Exports comprehensive debrief reports as PDF and DOCX directly from the browser
- 🔄 Automatically updates candidate evaluation status within the centralized recruitment pipeline

---

### Candidate Submission Agent

**Automated client submission with AI-generated recruiter communication**

- 📂 Automatically retrieves shortlisted candidate information from the recruitment pipeline
- 📄 Fetches and attaches candidate resumes without requiring manual re-upload
- 📑 Automatically generates and includes interview debrief reports
- ✉️ Produces professional, client-ready submission emails using AI
- 🏷️ Selects domain-specific email templates based on the hiring role
- 📝 Generates personalized email subject lines and submission summaries
- 👀 Provides an editable preview before email delivery
- 👨‍💼 Maintains a Human-in-the-Loop approval workflow, ensuring recruiter confirmation before sending
- 📧 Sends finalized candidate submissions securely using Gmail SMTP
- 📊 Updates candidate status and submission history within the centralized recruitment pipeline

---

# Recruitment Pipeline

```
Client Intake
      │
      ▼
Candidate Sourcing
      │
      ▼
Candidate Outreach
      │
      ▼
Interview Scheduling
      │
      ▼
Interview Debrief
      │
      ▼
Candidate Submission
```

Every stage updates a centralized recruitment pipeline while remaining capable of operating independently.

---

# Architecture

The application follows a modular multi-agent architecture.

```
React + Vite Frontend
          │
          ▼
     FastAPI Backend
          │
 ┌────────┼────────┐
 │        │        │
 ▼        ▼        ▼
Agent 1  Agent 2  Agent 3
Agent 4  Agent 5  Agent 6
          │
          ▼
 SQLite Pipeline Store
          │
          ▼
 External APIs
(Groq, Anthropic,
Google Calendar,
Outlook,
Gmail SMTP)
```

---

# Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- JavaScript
- Axios

---

## Backend

- FastAPI
- Python
- Pydantic
- SQLite
- Uvicorn

---

## AI & APIs

- Groq API
- Anthropic API
- Google Calendar API
- Microsoft Outlook Calendar
- Gmail SMTP

---

## Document Processing

- PyPDF
- python-docx
- jsPDF
- docx

---

## Key Engineering Highlights

- Multi-Agent AI architecture
- Human-in-the-loop recruitment workflow
- Centralized recruitment pipeline
- Unified candidate lifecycle management
- Browser-side PDF & DOCX generation
- Structured JSON validation using Pydantic
- Zero-Hallucination interview evaluation
- Modular FastAPI architecture
- React component isolation
- Optional pipeline mode for every AI agent

---

# Project Structure

```
tjj-recruitment-agents/

├── backend/
│   ├── agents/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── database/
│   ├── utils/
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── pages/
│   ├── components/
│   ├── assets/
│   └── vite.config.js
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/tjj-recruitment-agents.git

cd tjj-recruitment-agents
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

python main.py
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# Environment Variables

Create a `.env` file inside the backend directory.

```env
GROQ_API_KEY=

ANTHROPIC_API_KEY=

SMTP_EMAIL=

SMTP_PASSWORD=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

MICROSOFT_CLIENT_ID=

MICROSOFT_CLIENT_SECRET=
```

---

# Screenshots

*(To be added)*

- Home Page
- Pipeline Dashboard
- Intake Agent
- Candidate Sourcing
- Outreach Agent
- Scheduling Agent
- Interview Debrief
- Candidate Submission

---

# Demo Video

*(To be added)*

---

# Future Enhancements

- PostgreSQL migration
- Celery task queue
- Vector search using pgvector
- LinkedIn Official API integration
- Apollo.io integration
- OAuth-based Calendar synchronization
- Docker deployment
- Kubernetes support
- CI/CD pipeline
- Multi-user authentication

---

# Learning Outcomes

This project demonstrates practical implementation of:

- Multi-Agent AI Systems
- Full-Stack Application Development
- FastAPI Backend Development
- React Frontend Development
- LLM Integration
- Prompt Engineering
- State Management
- REST API Design
- Database Design
- Recruitment Workflow Automation
- AI-assisted Document Generation

---

# License

This project is intended for educational and portfolio purposes.

---

# Author

**Shreyansh Chaudhary**

B.Tech Computer Science & Engineering

KIIT University

LinkedIn: *(Add your profile)*

GitHub: *(Add your profile)*

---