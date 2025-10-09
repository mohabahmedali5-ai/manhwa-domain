# check-vulns.ps1
$paths = @(".\app", ".\src", ".\components", ".\pages")
$out = ".\vuln-results.txt"
if (Test-Path $out) { Remove-Item $out }
Add-Content $out "Vulnerability scan results - $(Get-Date)"
foreach ($p in $paths) {
  if (Test-Path $p) {
    Add-Content $out "`n--- Scanning $p ---`n"
    Select-String -Path "$p\**\*" -Pattern "style={{" -SimpleMatch -ErrorAction SilentlyContinue |
      ForEach-Object { Add-Content $out $_.Line; Add-Content $out ("  => " + $_.Path + ":" + $_.LineNumber) }
    Select-String -Path "$p\**\*" -Pattern "dangerouslySetInnerHTML" -SimpleMatch -ErrorAction SilentlyContinue |
      ForEach-Object { Add-Content $out $_.Line; Add-Content $out ("  => " + $_.Path + ":" + $_.LineNumber) }
    Select-String -Path "$p\**\*" -Pattern "eval\(" -AllMatches -ErrorAction SilentlyContinue |
      ForEach-Object { Add-Content $out $_.Line; Add-Content $out ("  => " + $_.Path + ":" + $_.LineNumber) }
    Select-String -Path "$p\**\*" -Pattern "<script" -SimpleMatch -ErrorAction SilentlyContinue |
      ForEach-Object { Add-Content $out $_.Line; Add-Content $out ("  => " + $_.Path + ":" + $_.LineNumber) }
    Select-String -Path "$p\**\*" -Pattern "new Function" -SimpleMatch -ErrorAction SilentlyContinue |
      ForEach-Object { Add-Content $out $_.Line; Add-Content $out ("  => " + $_.Path + ":" + $_.LineNumber) }
  }
}
Write-Host "Scan finished. See vuln-results.txt"
