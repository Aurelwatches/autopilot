@echo off
cd /d C:\Users\brayd\autopilot
echo Fixing corrupted git index...
del .git\index 2>nul
echo Removing reserved filenames that break git...
if exist nul del /f nul 2>nul
git reset
echo Re-adding all project files...
git add -A
git commit -m "chore: update project"
git push
pause
