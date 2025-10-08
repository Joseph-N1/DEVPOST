🧠 AI Prompts to Generate and Connect the Code

Here’s a practical step-by-step with prompts to build the project quickly with AI help (like ChatGPT or GitHub Copilot):

🏗 Step 1: Scaffold the Project

Prompt:

“Generate a dockerized project structure with Next.js + Tailwind CSS frontend and FastAPI backend for a poultry performance dashboard. The backend should analyze CSV uploads and return performance comparisons between farm rooms.”

🎨 Step 2: Create the Frontend UI

Prompt:

“Build a responsive dashboard using Tailwind CSS that shows multiple poultry rooms in cards, each with metrics like feed efficiency, growth rate, and mortality. Include an upload button for CSV and a chart section using Recharts or Chart.js.”

⚙️ Step 3: Build Backend APIs

Prompt:

“In FastAPI, create a route /upload that accepts a CSV file containing room performance data and parses it into a Pandas DataFrame. Create another route /analyze that compares all rooms and returns which room performs best based on feed-to-weight gain ratio.”

🧠 Step 4: Add AI Analytics

Prompt:

“Add a module ai_analyzer.py in FastAPI that uses scikit-learn or a simple regression model to predict expected performance for each room, and generate an AI summary comparing rooms.”

🌐 Step 5: Connect Frontend to Backend

Prompt:

“In the Next.js frontend, connect to FastAPI routes using Axios. Create API calls in /app/api/upload.ts and /app/api/analysis.ts that display results on the dashboard.”

🌍 Step 6: Add Language Localization

Prompt:

“Implement multi-language support for English, Hausa, Yoruba, and Igbo using i18next in Next.js. The LanguageSwitcher should allow toggling between them.”

📊 Step 7: Visual Enhancements

Prompt:

“Enhance the dashboard visuals with gradient charts, animated transitions, and a clean sidebar using Tailwind and Framer Motion.”

🧩 Step 8: Docker & Test

Prompt:

“Write a Dockerfile for both frontend and backend, and a docker-compose.yml that runs them together. Test the app locally by uploading a CSV file.”

⚡ Suggested Technologies Summary
Purpose Technology
Frontend Framework Next.js 14 (React-based)
Styling Tailwind CSS + Framer Motion
Charts Recharts or Chart.js
Backend FastAPI
Data Processing Pandas, NumPy, scikit-learn
AI Summaries OpenAI API or HuggingFace Transformers
Localization i18next
Containerization Docker + docker-compose
CSV Handling Pandas
Version Control Git + GitHub
Dev Environment VS Code with Docker & Python extensions
