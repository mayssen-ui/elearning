# Create Keycloak Clients
$ErrorActionPreference = "Stop"

$KEYCLOAK_URL = "http://localhost:18080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM_NAME = "elearning"

Write-Host "=========================================="
Write-Host "Create Keycloak Clients"
Write-Host "=========================================="

# Get token
Write-Host ""
Write-Host "[1/3] Getting admin token..."
$tokenParams = @{ grant_type = "password"; client_id = "admin-cli"; username = $ADMIN_USER; password = $ADMIN_PASS }
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenParams
$token = $tokenResponse.access_token
Write-Host "OK - Token obtained"

# Create elearning-frontend (public client)
Write-Host ""
Write-Host "[2/3] Creating client 'elearning-frontend'..."
$frontendClient = @{
    clientId = "elearning-frontend"
    name = "E-Learning Frontend"
    description = "Public client for React frontend"
    publicClient = $true
    standardFlowEnabled = $true
    implicitFlowEnabled = $false
    directAccessGrantsEnabled = $true
    serviceAccountsEnabled = $false
    enabled = $true
    redirectUris = @(
        "http://localhost:5173/*"
        "http://127.0.0.1:5173/*"
        "http://localhost:5173"
    )
    webOrigins = @(
        "http://localhost:5173"
        "http://127.0.0.1:5173"
        "+"
    )
    attributes = @{
        "pkce.code.challenge.method" = "S256"
        "access.token.lifespan" = "300"
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $frontendClient
    Write-Host "OK - Frontend client created"
} catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "SKIP - Frontend client exists"
    } else {
        Write-Host "ERROR: $($_.Exception.Message)"
    }
}

# Create elearning-backend (confidential client)
Write-Host ""
Write-Host "[3/3] Creating client 'elearning-backend'..."
$backendClient = @{
    clientId = "elearning-backend"
    name = "E-Learning Backend"
    description = "Confidential client for API Gateway"
    publicClient = $false
    standardFlowEnabled = $true
    implicitFlowEnabled = $false
    directAccessGrantsEnabled = $true
    serviceAccountsEnabled = $true
    authorizationServicesEnabled = $true
    enabled = $true
    redirectUris = @("http://localhost:3000/*")
    webOrigins = @("http://localhost:3000")
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $backendClient
    Write-Host "OK - Backend client created"
    
    # Get client secret
    $clients = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" -Method Get -Headers @{Authorization = "Bearer $token"}
    $client = $clients | Where-Object { $_.clientId -eq "elearning-backend" }
    if ($client) {
        $clientSecret = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$($client.id)/client-secret" -Method Get -Headers @{Authorization = "Bearer $token"}
        Write-Host ""
        Write-Host "IMPORTANT - Backend Client Secret:"
        Write-Host $clientSecret.value
    }
} catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "SKIP - Backend client exists"
    } else {
        Write-Host "ERROR: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "CLIENTS CREATED!"
Write-Host "=========================================="
