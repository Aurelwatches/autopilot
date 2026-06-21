@echo off
cd /d C:\Users\brayd\autopilot
echo Fixing corrupted git index...
del .git\index 2>nul
git reset
echo Re-adding all project files...
git add -A
git commit -m "fix: manual mode approve flow, env var fallbacks, MAKE_WEBHOOK guard, hardcoded URLs"
git push
pause
