# Create elearning-frontend client with registration enabled
$ErrorActionPreference = "Stop"

$KEYCLOAK_URL = "http://localhost:18080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM_NAME = "elearning"

Write-Host "=========================================="
Write-Host "Create elearning-frontend Client"
Write-Host "=========================================="

# Get token
Write-Host ""
Write-Host "[1/2] Getting admin token..."
$tokenParams = @{ grant_type = "password"; client_id = "admin-cli"; username = $ADMIN_USER; password = $ADMIN_PASS }
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenParams
$token = $tokenResponse.access_token
Write-Host "OK - Token obtained"

# Create client
Write-Host ""
Write-Host "[2/2] Creating elearning-frontend client..."

$clientConfig = @{
    clientId = "elearning-frontend"
    name = "E-Learning Frontend"
    description = "Frontend application with user registration"
    publicClient = $true
    standardFlowEnabled = $true
    implicitFlowEnabled = $false
    directAccessGrantsEnabled = $true
    serviceAccountsEnabled = $false
    enabled = $true
    registrationAllowed = $true  # Enable user registration
    redirectUris = @(
        "http://localhost:5173/*"
        "http://127.0.0.1:5173/*"
        "http://localhost:5173"
    )
    webOrigins = @(
        "http://localhost:5173"
        "http://127.0.0.1:5173"
    )
    attributes = @{
        "pkce.code.challenge.method" = "S256"
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $clientConfig
    Write-Host "OK - Client created with registration enabled"
} catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "Client exists, updating registration setting..."
        # Get client ID
        $clients = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" -Method Get -Headers @{Authorization = "Bearer $token"}
        $client = $clients | Where-Object { $_.clientId -eq "elearning-frontend" }
        if ($client) {
            # Update client
            $client.registrationAllowed = $true
            $updateBody = $client | ConvertTo-Json -Depth 10
            Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$($client.id)" -Method Put -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $updateBody
            Write-Host "OK - Registration enabled on existing client"
        }
    } else {
        Write-Host "ERROR: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "FRONTEND CLIENT CONFIGURED!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Registration is now enabled for elearning-frontend"
