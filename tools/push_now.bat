@echo off
echo Removing git lock if stale...
cd /d C:\Users\brayd\autopilot
if exist .git\index.lock del /f .git\index.lock
echo Staging key files...
git add nixpacks.toml
git add vercel.json
git add tools\fix_and_push.bat
git add tools\push_now.bat
git add backend\server.js
git add backend\google-oauth-routes.js
git add backend\google-reviews-poller.js
git add src\dashboard\
git add index.html
git add src\pages\Privacy.jsx
git add src\pages\Login.jsx
git add src\pages\Signup.jsx
git add src\components\Hero.jsx
git add src\components\FAQ.jsx
git add src\pages\Pricing.jsx
git add src\pages\HowItWorks.jsx
git add src\index.css
echo Committing...
git commit -m "fix: remove false advertising, sanitize API errors, add CSP/HSTS/security headers"
echo Pushing...
git push
echo.
echo Done! Check Railway in ~2 minutes.
pause
