# Fix Keycloak Content Security Policy (CSP)
$ErrorActionPreference = "Stop"

$KEYCLOAK_URL = "http://localhost:18080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM_NAME = "elearning"

Write-Host "=========================================="
Write-Host "Fix Keycloak CSP Headers"
Write-Host "=========================================="

# Get token
Write-Host ""
Write-Host "[1/2] Getting admin token..."
$tokenParams = @{ grant_type = "password"; client_id = "admin-cli"; username = $ADMIN_USER; password = $ADMIN_PASS }
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenParams
$token = $tokenResponse.access_token
Write-Host "OK - Token obtained"

# Get current realm config first
Write-Host ""
Write-Host "[2/2] Getting and updating realm 'elearning'..."

try {
    $realm = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME" -Method Get -Headers @{Authorization = "Bearer $token"}
    Write-Host "OK - Got realm config"
    
    # Update browserSecurityHeaders
    $realm.browserSecurityHeaders = @{
        contentSecurityPolicy = "frame-src 'self' http://localhost:18080; frame-ancestors 'self' http://localhost:5173 http://127.0.0.1:5173;"
        xFrameOptions = "ALLOW-FROM http://localhost:5173"
    }
    
    $body = $realm | ConvertTo-Json -Depth 10
    
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME" -Method Put -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $body
    Write-Host "OK - CSP headers updated"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody"
    }
    exit 1
}

Write-Host ""
Write-Host "=========================================="
Write-Host "CSP FIXED!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Important: You may need to refresh Keycloak config:"
Write-Host "  1. Go to Keycloak Admin Console: http://localhost:18080/admin"
Write-Host "  2. Realm Settings > Security Defenses > Headers"
Write-Host "  3. Verify CSP: $cspValue"
Write-Host ""
Write-Host "Then refresh your frontend page."
