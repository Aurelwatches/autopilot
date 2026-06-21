@echo off
cd /d C:\Users\brayd\autopilot
echo Fixing corrupted git index...
del .git\index 2>nul
git reset
echo Re-adding all project files...
git add -A
git commit -m "fix: manual mode, env vars, Make.com dupe rows removed, test-review endpoint added"
git push
pause
