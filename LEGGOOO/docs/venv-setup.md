# Python Virtual Environment Setup

> Instructions for setting up a Python virtual environment for LEGGOOO's AI service backend.

---

## ⚠️ Important

**DO NOT commit your virtual environment folder (`.venv` or `venv`) to Git!**

The `.gitignore` file is already configured to exclude these directories.

---

## Windows (PowerShell)

### 1. Create Virtual Environment

```powershell
# Navigate to project root
cd "C:\path\to\LEGGOOO"

# Create virtual environment
python -m venv .venv
```

### 2. Activate Virtual Environment

```powershell
# If you get an execution policy error, run this first (Admin PowerShell):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Activate the environment
.\.venv\Scripts\Activate.ps1
```

You should see `(.venv)` prefix in your terminal prompt.

### 3. Install Dependencies

```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Install from requirements.txt (when available)
pip install -r requirements.txt
```

### 4. Deactivate When Done

```powershell
deactivate
```

---

## macOS / Linux (Bash/Zsh)

### 1. Create Virtual Environment

```bash
# Navigate to project root
cd /path/to/LEGGOOO

# Create virtual environment (use python3 on macOS/Linux)
python3 -m venv .venv
```

### 2. Activate Virtual Environment

```bash
source .venv/bin/activate
```

You should see `(.venv)` prefix in your terminal prompt.

### 3. Install Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install from requirements.txt (when available)
pip install -r requirements.txt
```

### 4. Deactivate When Done

```bash
deactivate
```

---

## VS Code Integration

### Select Python Interpreter

1. Open VS Code in the LEGGOOO project
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. Type: **"Python: Select Interpreter"**
4. Choose the interpreter from `.venv`:
   - Windows: `.\.venv\Scripts\python.exe`
   - macOS/Linux: `./.venv/bin/python`

### Automatic Activation

VS Code will automatically activate the virtual environment when you open a new terminal if:

1. The Python extension is installed
2. An interpreter from `.venv` is selected
3. `"python.terminal.activateEnvironment": true` is in settings (default)

### Recommended VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/Scripts/python.exe",
  "python.terminal.activateEnvironment": true,
  "python.analysis.typeCheckingMode": "basic",
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

For macOS/Linux, change the interpreter path:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python"
}
```

---

## Common Issues

### PowerShell Execution Policy Error

If you see "cannot be loaded because running scripts is disabled":

```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### `python` Command Not Found (Windows)

Ensure Python is added to PATH during installation, or use:

```powershell
py -m venv .venv
```

### `python3` Command Not Found (macOS)

Install Python via Homebrew:

```bash
brew install python
```

### Wrong Python Version

Check your Python version:

```bash
python --version  # or python3 --version
```

LEGGOOO's AI service requires Python 3.10+. If you have multiple versions, specify explicitly:

```bash
python3.11 -m venv .venv
```

---

## Dependencies (Preview)

The AI service will require these packages (to be finalized):

```txt
# requirements.txt (preview)
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.5.0
httpx>=0.25.0
python-dotenv>=1.0.0

# AI/ML (optional, for local models)
gpt4all>=2.0.0
llama-cpp-python>=0.2.0

# OpenAI API (optional, for cloud fallback)
openai>=1.3.0
```

---

## Quick Reference

| Task         | Windows (PowerShell)              | macOS/Linux (Bash)                |
| ------------ | --------------------------------- | --------------------------------- |
| Create venv  | `python -m venv .venv`            | `python3 -m venv .venv`           |
| Activate     | `.\.venv\Scripts\Activate.ps1`    | `source .venv/bin/activate`       |
| Deactivate   | `deactivate`                      | `deactivate`                      |
| Install deps | `pip install -r requirements.txt` | `pip install -r requirements.txt` |
| Check Python | `python --version`                | `python3 --version`               |
