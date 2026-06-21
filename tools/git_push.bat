@echo off
cd /d C:\Users\brayd\autopilot
echo Fixing corrupted git index...
del .git\index 2>nul
git reset
echo Re-adding all project files...
git add -A
git commit -m "fix: re-add all files after git index corruption, package.json was untracked"
git push
pause
