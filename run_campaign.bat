@echo off
cd /d C:\Users\brayd\autopilot
echo [%date% %time%] Campaign starting >> campaign_log.txt
"C:\Program Files\Epic Games\UE_5.4\Engine\Binaries\ThirdParty\Python3\Win64\python.exe" autopilot_campaign.py >> campaign_log.txt 2>&1
echo [%date% %time%] Campaign done >> campaign_log.txt
