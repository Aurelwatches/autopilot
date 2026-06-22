@echo off
echo Fixing package-lock.json and pushing...
cd /d C:\Users\brayd\autopilot
npm install
echo.
echo Running git push...
call tools\git_push.bat
echo.
echo Done! Check Railway in ~2 minutes.
pause
