@echo off
set NODE_ENV=development
REM Commented out — Turso unstable; using local sql.js
REM set TURSO_URL=libsql://everest-academy-ziad-assem1.aws-eu-west-1.turso.io
REM set TURSO_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODM3MDE5ODUsImlkIjoiMDE5ZjRiMGUtZWIwMS03ZDk3LThmMzItODg1ODI2M2JkZmY3Iiwia2lkIjoiazlPdHdXa3VzZmxOaV9sNWRPR3ZfdXhFWFBKQzU3REVfQnhmc1FKeXNHWSIsInJpZCI6Ijc2ZDRlZmMwLWU2ZGQtNGNiZi05MjBhLWIyZjU0MmYwNDgyOSJ9.BJGFQ23k27gDQtQbE7OAvoEZch0gd8fA7sIKNW67mZUB_iM4SNUelqu0-eYqcZWo6pUlD5lEV6UN7nr_ZFBgBA
REM set GEMINI_API_KEY=your_gemini_key_here
set CORS_ORIGIN=http://localhost:4000,http://localhost:3000

echo Killing any process on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
  echo Killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo Starting backend...
node server.js
pause
