$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000'

function safeJsonPrint($label, $obj){
  Write-Output "--- $label ---"
  try { $obj | ConvertTo-Json -Depth 6 | Write-Output } catch { Write-Output $obj }
}

try {
  Write-Output "1) Registering test user..."
  $uSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $regBody = @{ username = "testuser_auto"; email = "testuser_auto@example.com"; password = "Testpass123!"; firstName = "Auto"; lastName = "Tester" }
  $reg = Invoke-RestMethod -Uri "$base/api/register" -Method POST -Body (ConvertTo-Json $regBody) -ContentType 'application/json' -WebSession $uSession
  safeJsonPrint "register response" $reg

  Write-Output "`n2) Submitting deposit confirmation as test user..."
  $deposit = @{ amount = 50; transactionHash = "0xdeadbeef"; method = "bitcoin"; planName = "AutoPlan" }
  $depResp = Invoke-RestMethod -Uri "$base/api/transactions/deposit-confirmation" -Method POST -Body (ConvertTo-Json $deposit) -ContentType 'application/json' -WebSession $uSession
  safeJsonPrint "deposit response" $depResp
  $txId = $null
  try { $txId = $depResp.data.transaction.id } catch { $txId = $depResp.transaction.id }
  if (-not $txId) { throw "Could not determine transaction id from deposit response" }
  Write-Output "Created transaction id: $txId"

  Write-Output "`n3) Creating admin (reset-and-create-admin)..."
  $reset = Invoke-RestMethod -Uri "$base/api/admin/reset-and-create-admin" -Method POST -Body '{}' -ContentType 'application/json'
  safeJsonPrint "reset-and-create-admin response" $reset

  Write-Output "`n4) Admin login (direct-admin-login)..."
  $aSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $adminCreds = @{ username = "admin"; password = "Axix-Admin@123" }
  $login = Invoke-RestMethod -Uri "$base/api/direct-admin-login" -Method POST -Body (ConvertTo-Json $adminCreds) -ContentType 'application/json' -WebSession $aSession
  safeJsonPrint "admin login response" $login

  Write-Output "`n5) Approving deposit as admin..."
  $approve = Invoke-RestMethod -Uri "$base/api/admin/deposits/$txId/approve" -Method POST -Body '{}' -ContentType 'application/json' -WebSession $aSession
  safeJsonPrint "approve response" $approve

  Write-Output "`n6) Fetching user balance (as test user)..."
  $balance = Invoke-RestMethod -Uri "$base/api/balance" -Method GET -WebSession $uSession
  safeJsonPrint "user balance" $balance

  Write-Output "`nTest flow complete."
} catch {
  Write-Output "ERROR during test flow:"
  Write-Output $_.Exception.Message
  if ($_.Exception.Response) {
    try {
      $raw = $_.Exception.Response.GetResponseStream()
      $sr = New-Object System.IO.StreamReader($raw)
      $txt = $sr.ReadToEnd()
      Write-Output "Response body:"
      Write-Output $txt
    } catch {}
  }
}
