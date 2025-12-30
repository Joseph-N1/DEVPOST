# LEGGOOO AI Microservice

> Python FastAPI service for AI code assistance (local-first)

## Tech Stack

- **Python 3.11+** — Runtime
- **FastAPI** — HTTP framework
- **GPT4All / CodeLlama** — Local LLM inference
- **OpenAI SDK** — Optional cloud fallback
- **Pydantic** — Request validation

## Setup

### 1. Create Virtual Environment

```bash
cd ai
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download Model (Local)

```bash
# GPT4All model (recommended for local)
# Download from https://gpt4all.io/index.html
# Place in ./models/ directory
```

### 4. Environment Variables

Create `.env` in this directory:

```bash
AI_MODEL=gpt4all-lora-unfiltered-quantized
MODEL_PATH=./models
OPENAI_API_KEY=sk-...  # Optional fallback
```

## Development

```bash
# Start dev server
uvicorn main:app --reload --port 8000

# Or use the provided script
python main.py
```

## Project Structure

```
ai/
├── main.py               # FastAPI entry point
├── routes/
│   └── query.py          # /ai/query endpoint
├── services/
│   ├── local_llm.py      # GPT4All/CodeLlama wrapper
│   └── openai_client.py  # OpenAI fallback
├── models/               # Local model files (gitignored)
├── requirements.txt
└── README.md
```

## API Endpoints

| Method | Endpoint    | Description              |
| ------ | ----------- | ------------------------ |
| `GET`  | `/health`   | Health check             |
| `POST` | `/ai/query` | Generate code suggestion |

### `/ai/query` Request

```json
{
  "prompt": "Create a React component for a button",
  "context": {
    "file_path": "src/components/Button.tsx",
    "file_content": "// existing code...",
    "language": "typescript"
  },
  "options": {
    "max_tokens": 500,
    "temperature": 0.7
  }
}
```

### Response

```json
{
  "suggestion": "export const Button = ({ children, onClick }) => {...}",
  "explanation": "Created a reusable Button component...",
  "confidence": 0.85,
  "model": "gpt4all-lora"
}
```

## Testing

```bash
# Run tests
pytest

# Test endpoint manually
curl -X POST http://localhost:8000/ai/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "context": {}}'
```

## Deployment

```bash
# Production with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

Deploy to Railway, Render, or any Python host.
