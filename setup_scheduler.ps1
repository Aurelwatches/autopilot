# AutoPilot Campaign Scheduler Setup
# Right-click this file and select "Run with PowerShell"

$taskName    = "AutoPilot Campaign"
$scriptPath  = "C:\Users\brayd\autopilot\run_campaign.bat"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Trigger: Mon-Fri at 9:00 AM
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday `
    -At "9:00AM"

# Action: run the batch file
$action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$scriptPath`""

# Settings
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $taskName `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -RunLevel Highest `
    -Force

Write-Host ""
Write-Host "✓ AutoPilot Campaign scheduled — runs every weekday at 9:00 AM" -ForegroundColor Green
Write-Host "  Logs saved to: C:\Users\brayd\autopilot\campaign_log.txt"
Write-Host ""
pause
