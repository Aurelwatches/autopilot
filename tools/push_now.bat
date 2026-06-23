@echo off
echo Removing git lock if stale...
cd /d C:\Users\brayd\autopilot
if exist .git\index.lock del /f .git\index.lock
echo Staging key files...
git add nixpacks.toml
git add tools\fix_and_push.bat
git add tools\push_now.bat
git add backend\server.js
git add backend\google-oauth-routes.js
git add backend\google-reviews-poller.js
git add src\dashboard\
git add index.html
echo Committing...
git commit -m "fix: add nixpacks.toml + security hardening"
echo Pushing...
git push
echo.
echo Done! Check Railway in ~2 minutes.
pause
