# ============================================
# eDrive Admin Panel - IIS Setup Script
# Run this script as Administrator
# ============================================

$siteName    = "eDrive-Admin"
$distPath    = "F:\EdriveSource\amir bhai\e-drive-pk-public-admin\dist"
$port        = 8080
$appPoolName = "eDrive-Admin-Pool"

Write-Host "Starting IIS setup for eDrive Admin Panel..." -ForegroundColor Cyan

# Import IIS module
Import-Module WebAdministration -ErrorAction Stop

# ---- 1. Check URL Rewrite Module ----
$rewriteDll = "$env:SystemRoot\system32\inetsrv\rewrite.dll"
if (-not (Test-Path $rewriteDll)) {
    Write-Host "WARNING: IIS URL Rewrite module not found!" -ForegroundColor Yellow
    Write-Host "Download it from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
    Write-Host "Install it first, then re-run this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "URL Rewrite module found." -ForegroundColor Green

# ---- 2. Remove existing site/pool if exists ----
if (Get-Website -Name $siteName -ErrorAction SilentlyContinue) {
    Remove-Website -Name $siteName
    Write-Host "Removed existing site: $siteName" -ForegroundColor Yellow
}
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Remove-WebAppPool -Name $appPoolName
    Write-Host "Removed existing app pool: $appPoolName" -ForegroundColor Yellow
}

# ---- 3. Create App Pool ----
New-WebAppPool -Name $appPoolName | Out-Null
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "startMode" -Value "AlwaysRunning"
Write-Host "App Pool created: $appPoolName" -ForegroundColor Green

# ---- 4. Create Website ----
New-Website -Name $siteName `
            -Port $port `
            -PhysicalPath $distPath `
            -ApplicationPool $appPoolName | Out-Null
Write-Host "Website created: $siteName on port $port" -ForegroundColor Green

# ---- 5. Set folder permissions ----
$acl = Get-Acl $distPath
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
)
$acl.SetAccessRule($rule)
Set-Acl $distPath $acl
Write-Host "Permissions set for IIS_IUSRS on: $distPath" -ForegroundColor Green

# ---- 6. Start website ----
Start-Website -Name $siteName
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host " URL: http://localhost:$port" -ForegroundColor White
Write-Host " Or:  http://192.168.5.53:$port" -ForegroundColor White
Write-Host "=====================================" -ForegroundColor Cyan
