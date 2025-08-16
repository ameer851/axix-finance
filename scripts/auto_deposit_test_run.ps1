$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000'

try {
  Write-Output "1) Registering test user..."
  $uSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $regBody = @{ username = "testuser_auto"; email = "testuser_auto@example.com"; password = "Testpass123!"; firstName = "Auto"; lastName = "Tester" }
  $reg = Invoke-RestMethod -Uri "$base/api/register" -Method POST -Body (ConvertTo-Json $regBody) -ContentType 'application/json' -WebSession $uSession
  $reg | ConvertTo-Json -Depth 6 | Write-Output

  Write-Output "2) Submitting deposit confirmation as test user..."
  $deposit = @{ amount = 50; transactionHash = "0xdeadbeef"; method = "bitcoin"; planName = "AutoPlan" }
  $depResp = Invoke-RestMethod -Uri "$base/api/transactions/deposit-confirmation" -Method POST -Body (ConvertTo-Json $deposit) -ContentType 'application/json' -WebSession $uSession
  $depResp | ConvertTo-Json -Depth 6 | Write-Output
  $txId = $null
  try { $txId = $depResp.data.transaction.id } catch { $txId = $depResp.transaction.id }
  if (-not $txId) { throw "Could not determine transaction id from deposit response" }
  Write-Output "Created transaction id: $txId"

  Write-Output "3) Admin login with provided creds..."
  $aSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $adminCreds = @{ username = "admin@axixfinance.com"; password = "Axix_Admin001!" }
  $login = Invoke-RestMethod -Uri "$base/api/direct-admin-login" -Method POST -Body (ConvertTo-Json $adminCreds) -ContentType 'application/json' -WebSession $aSession
  $login | ConvertTo-Json -Depth 6 | Write-Output

  Write-Output "4) Approving deposit as admin..."
  $approve = Invoke-RestMethod -Uri "$base/api/admin/deposits/$txId/approve" -Method POST -Body '{}' -ContentType 'application/json' -WebSession $aSession
  $approve | ConvertTo-Json -Depth 6 | Write-Output

  Write-Output "5) Fetching user balance (as test user)..."
  $balance = Invoke-RestMethod -Uri "$base/api/balance" -Method GET -WebSession $uSession
  $balance | ConvertTo-Json -Depth 6 | Write-Output

  Write-Output "Test flow complete."
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
