# Zapply.ai

**A human-in-the-loop AI resume assistant.** Upload your resume and a job description, and Zapply.ai tailors your resume to the role, flags the gaps, and lets you review, edit, and approve every change before you download it.

The AI proposes. **You decide.**

> **Status:** Local MVP / learning project. There is no authentication yet, so don't expose it publicly as-is.

---

## Features

- **Resume upload**: PDF or DOCX.
- **Job description input**: paste text, upload a PDF, DOCX or TXT file, or both.
- **AI job analysis**: key requirements, matching skills, missing or unverified skills, and actionable recommendations.
- **Truthful tailoring**: rewords and reorders existing content to fit the role. The model is instructed never to invent experience, skills, metrics or certifications, and to treat both documents as untrusted data.
- **Human approval workflow**: every proposal starts as `pending`. You can **approve**, **reject**, or **modify** it.
- **Editable output**: edit the proposed resume and save changes before approving.
- **Export**: download the approved resume as **PDF** or **DOCX**. Pending and rejected proposals can't be downloaded.
- **Proposal history**: all proposals and their statuses are stored in SQLite.

## How it works

```
Upload resume + job description
            │
            ▼
  Extract text (FastAPI backend)
            │
            ▼
   AI analysis & tailoring (Groq)
            │
            ▼
  Proposal saved as "pending"
            │
   ┌────────┼────────┐
   ▼        ▼        ▼
Approve   Modify   Reject
   │     (stays
   │     pending)
   ▼
Download PDF / DOCX
```

The LLM generates suggestions. The backend owns the proposal state and decides whether a resume can be downloaded. Always check generated content for accuracy before approving it.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React, Vite, CSS |
| Backend  | Python, FastAPI, Uvicorn, Pydantic |
| AI       | [Groq](https://groq.com/) API |
| Parsing  | pypdf, python-docx |
| Export   | ReportLab (PDF), python-docx (DOCX) |
| Storage  | SQLite |

## Project structure

```
Zapply.ai/
├── backend/
│   ├── main.py            # API: analysis, approval workflow, export
│   ├── requirements.txt
│   ├── .env.example       # Environment variable template
│   └── fonts/             # DejaVuSans.ttf for Unicode PDF output
└── frontend/
    ├── src/               # App.jsx, App.css, index.css
    ├── index.html
    └── package.json
```

Local-only files (`.env`, `zapply.db`, `venv/`) are git-ignored. Never commit API keys, resumes or the database.

## Getting started

### Prerequisites

- Python 3.10+
- Node.js and npm
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repo

```bash
git clone https://github.com/Raheeemm/Zapply.ai.git
cd Zapply.ai
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

cp .env.example .env              # Windows: copy .env.example .env
# Then edit .env and add your GROQ_API_KEY

uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`, with interactive docs at `/docs`.

> **PowerShell blocks activation?** Use Command Prompt and run `venv\Scripts\activate.bat`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Keep both terminals running.

## Configuration

Set these in `backend/.env`:

| Variable       | Description | Default |
|----------------|-------------|---------|
| `GROQ_API_KEY` | Groq API key (required) | none |
| `GROQ_MODEL`   | Groq model used for tailoring | `llama-3.3-70b-versatile` |

`.env.example` suggests `GROQ_MODEL=openai/gpt-oss-120b`. Use any model currently available to your Groq account, since availability changes.

## Usage

1. Enter the target job title.
2. Upload your resume (PDF or DOCX).
3. Paste the job description or upload it (PDF, DOCX or TXT).
4. Click **Analyze & Generate Resume**.
5. Review the requirements, matching skills, unverified skills and recommendations.
6. Edit the proposed resume as needed.
7. Click **Save Changes** (stays pending), **Approve Resume**, or **Reject**.
8. Download the approved resume as PDF or DOCX.

Your original file is never overwritten. A new document is generated from the approved content.

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Basic status |
| `GET`  | `/health` | Health check |
| `POST` | `/analyze` | Upload a resume and job description; creates a pending proposal |
| `GET`  | `/proposals` | List proposal history |
| `GET`  | `/proposals/{id}` | Get a proposal with its analysis and proposed resume |
| `POST` | `/proposals/{id}/decision` | Submit `approve`, `reject` or `modify` (optional `revised_resume`) |
| `GET`  | `/proposals/{id}/download?format=pdf\|docx` | Download an approved resume |

## Limitations

- **File size:** 5 MB per uploaded file.
- **Scanned PDFs:** not supported. There is no OCR, so use a text-based PDF or DOCX.
- **Layout:** exports are cleanly formatted new documents, not copies of your original layout.
- **LLM output:** can be incomplete or inaccurate. Review everything before using it in a real application.

## Privacy and security

- Resume and job description text is sent to Groq for analysis. Only upload documents you're comfortable sharing with that provider.
- Proposals are stored unencrypted in a local SQLite database.
- No authentication or per-user access control. Don't deploy publicly until that exists.
- CORS allows only `http://localhost:5173`, and the frontend calls `http://127.0.0.1:8000`. Update both if you deploy.
- File type and size checks are not full malware or content validation.
- Only use resume claims that accurately reflect your real experience.

## Roadmap

- [ ] Authentication and per-user proposal access
- [ ] Automated backend tests for analysis and approval states
- [ ] Stronger file validation and error handling
- [ ] OCR for scanned resumes
- [ ] Better layout and page-break handling
- [ ] Resume preview before export
- [ ] Audit history for edits and approval decisions
- [ ] Configurable templates (Classic, Modern)
- [ ] Deployment config and production security controls

## Contributing

Issues and pull requests are welcome. For significant changes, please open an issue first.

## License

No license has been specified yet. Add a `LICENSE` file (for example, MIT) before distributing the project or accepting outside contributions.

---

Built to explore LLM-powered apps, document processing, and human-in-the-loop workflows.
