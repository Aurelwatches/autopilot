@echo off
cd /d C:\Users\brayd\autopilot
echo Fixing corrupted git index...
del .git\index 2>nul
git reset
echo Re-adding all project files...
git add -A
git commit -m "feat: add email notification to poller for real Google reviews"
git push
pause
