# QimatnaDz_CreateTask.ps1
# Cree ou recree la tache planifiee horaire pour le scraper Qimatna

$taskName = "QimatnaDz_Scraper"
$workDir  = "D:\Qimatna Dz"
$batFile  = "D:\Qimatna Dz\run_scrapers_automated.bat"

# Supprimer si deja existante
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Action : lancer le .bat via cmd
$action = New-ScheduledTaskAction `
    -Execute  "cmd.exe" `
    -Argument "/c `"$batFile`"" `
    -WorkingDirectory $workDir

# Declencheur : toutes les heures, indefiniment
$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).Date `
    -RepetitionInterval  (New-TimeSpan -Hours 1)

# Parametres d'execution
$settings = New-ScheduledTaskSettingsSet `
    -MultipleInstances     IgnoreNew `
    -ExecutionTimeLimit    (New-TimeSpan -Hours 3) `
    -RunOnlyIfNetworkAvailable `
    -StartWhenAvailable

# Enregistrement avec droits eleves
Register-ScheduledTask `
    -TaskName   $taskName `
    -Action     $action `
    -Trigger    $trigger `
    -Settings   $settings `
    -RunLevel   Highest `
    -Force

Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan
$task = Get-ScheduledTask -TaskName $taskName
Write-Host "Nom     : $($task.TaskName)"
Write-Host "Statut  : $($task.State)"
$info = $task | Get-ScheduledTaskInfo
Write-Host "Prochain run : $($info.NextRunTime)"
Write-Host ""
Write-Host "OK - Tache QimatnaDz_Scraper creee avec succes - execution toutes les heures." -ForegroundColor Green
