$ErrorActionPreference = "Stop"
$manifestUrl = "https://github.com/B-Divyesh/sf-caption-placement-check/releases/latest/download/latest.json"
$manifest = Invoke-RestMethod -Uri $manifestUrl
$assets = @($manifest.platforms.windows)
$asset = $assets | Where-Object { $_.name -match '\.(msi|exe)$' } | Select-Object -First 1
if (-not $asset) { throw "No Windows installer was found in the latest release." }
$destination = Join-Path $env:TEMP $asset.name
Invoke-WebRequest -Uri $asset.url -OutFile $destination
$actual = (Get-FileHash -Path $destination -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $asset.sha256.ToLowerInvariant()) { Remove-Item $destination; throw "Checksum verification failed." }
Write-Host "Verified $($asset.name) with SHA-256. Starting the installer."
if ($asset.name.EndsWith(".msi")) { Start-Process msiexec.exe -ArgumentList "/i `"$destination`"" -Wait } else { Start-Process $destination -Wait }
Write-Host "Caption Placement Check installer finished."
