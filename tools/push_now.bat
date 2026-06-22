@echo off
cd /d C:\Users\brayd\autopilot
git add backend/server.js src/App.jsx src/dashboard/pages/Reviews.jsx src/dashboard/pages/Subscription.jsx src/dashboard/pages/Upgrade.jsx src/pages/Pricing.jsx src/pages/Privacy.jsx src/pages/Terms.jsx AutoPilot-Client-Service-Agreement.md tools/git_push.bat
git commit -m "Upgrade page, uptime monitor, Growth/Pro live, legal docs updated"
git push
pause
