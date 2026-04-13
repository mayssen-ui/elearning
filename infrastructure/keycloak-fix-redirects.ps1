# Fix Keycloak Client Redirect URIs for elearning-frontend
$ErrorActionPreference = "Stop"

$KEYCLOAK_URL = "http://localhost:18080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM_NAME = "elearning"

Write-Host "=========================================="
Write-Host "Fix Keycloak Redirect URIs"
Write-Host "=========================================="

# Get token
Write-Host ""
Write-Host "[1/2] Getting admin token..."
$tokenParams = @{ grant_type = "password"; client_id = "admin-cli"; username = $ADMIN_USER; password = $ADMIN_PASS }
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenParams
$token = $tokenResponse.access_token
Write-Host "OK - Token obtained"

# Get client ID
Write-Host ""
Write-Host "[2/2] Updating client 'elearning-frontend' redirect URIs..."
$clients = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" -Method Get -Headers @{Authorization = "Bearer $token"}
$client = $clients | Where-Object { $_.clientId -eq "elearning-frontend" }

if (-not $client) {
    Write-Host "ERROR: Client 'elearning-frontend' not found!"
    exit 1
}

$clientId = $client.id

# Update client with proper redirect URIs
$updateConfig = @{
    clientId = "elearning-frontend"
    enabled = $true
    redirectUris = @(
        "http://localhost:5173/*",
        "http://127.0.0.1:5173/*",
        "http://localhost:5174/*",
        "http://localhost:3000/*"
    )
    webOrigins = @(
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    )
    standardFlowEnabled = $true
    implicitFlowEnabled = $false
    directAccessGrantsEnabled = $true
    serviceAccountsEnabled = $false
    publicClient = $true  # Frontend is a public client
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$clientId" -Method Put -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $updateConfig
    Write-Host "OK - Client 'elearning-frontend' updated with redirect URIs"
    Write-Host ""
    Write-Host "Configured Redirect URIs:"
    Write-Host "  - http://localhost:5173/*"
    Write-Host "  - http://127.0.0.1:5173/*"
    Write-Host "  - http://localhost:5174/*"
    Write-Host "  - http://localhost:3000/*"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "=========================================="
Write-Host "REDIRECT URIS FIXED!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Refresh your frontend page - SSO should work now!"
