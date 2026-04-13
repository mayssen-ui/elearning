# Keycloak Final Configuration
$ErrorActionPreference = "Stop"

$KEYCLOAK_URL = "http://localhost:18080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM_NAME = "elearning"

Write-Host "=========================================="
Write-Host "Keycloak Final Configuration"
Write-Host "=========================================="

# Get token
Write-Host ""
Write-Host "[1/6] Getting admin token..."
$tokenParams = @{ grant_type = "password"; client_id = "admin-cli"; username = $ADMIN_USER; password = $ADMIN_PASS }
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenParams
$token = $tokenResponse.access_token
Write-Host "OK - Token obtained"

# Create roles
Write-Host ""
Write-Host "[2/6] Creating roles..."
$roles = @("admin", "instructor", "student")
foreach ($role in $roles) {
    $roleConfig = @{ name = $role; description = "$role role" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $roleConfig
        Write-Host "  OK - Role '$role' created"
    } catch {
        Write-Host "  SKIP - Role '$role' exists"
    }
}

# Create client scope
Write-Host ""
Write-Host "[3/6] Creating client scope 'elearning-profile'..."
$scopeConfig = @{ name = "elearning-profile"; description = "E-Learning user profile claims"; protocol = "openid-connect" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/client-scopes" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $scopeConfig
    Write-Host "OK - Client scope created"
} catch {
    Write-Host "SKIP - Scope exists"
}

# Get scope ID
Write-Host ""
Write-Host "[4/6] Getting scope ID..."
$scopes = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/client-scopes" -Method Get -Headers @{Authorization = "Bearer $token"}
$scopeId = ($scopes | Where-Object { $_.name -eq "elearning-profile" }).id
Write-Host "OK - Scope ID: $scopeId"

# Add mappers
Write-Host ""
Write-Host "[5/6] Adding mappers..."

# Username mapper
$mapper1 = @{ name = "username"; protocol = "openid-connect"; protocolMapper = "oidc-usermodel-property-mapper"; config = @{ "user.attribute" = "username"; "claim.name" = "preferred_username"; "jsonType.label" = "String"; "id.token.claim" = "true"; "access.token.claim" = "true"; "userinfo.token.claim" = "true" } } | ConvertTo-Json -Depth 10
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/client-scopes/$scopeId/protocol-mappers/models" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $mapper1
    Write-Host "  OK - Username mapper"
} catch { Write-Host "  SKIP - Username mapper exists" }

# Email mapper
$mapper2 = @{ name = "email"; protocol = "openid-connect"; protocolMapper = "oidc-usermodel-property-mapper"; config = @{ "user.attribute" = "email"; "claim.name" = "email"; "jsonType.label" = "String"; "id.token.claim" = "true"; "access.token.claim" = "true"; "userinfo.token.claim" = "true" } } | ConvertTo-Json -Depth 10
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/client-scopes/$scopeId/protocol-mappers/models" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $mapper2
    Write-Host "  OK - Email mapper"
} catch { Write-Host "  SKIP - Email mapper exists" }

# Roles mapper (CRITICAL)
$mapper3 = @{ name = "realm roles"; protocol = "openid-connect"; protocolMapper = "oidc-usermodel-realm-role-mapper"; config = @{ "multivalued" = "true"; "claim.name" = "roles"; "jsonType.label" = "String"; "id.token.claim" = "true"; "access.token.claim" = "true"; "userinfo.token.claim" = "true" } } | ConvertTo-Json -Depth 10
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/client-scopes/$scopeId/protocol-mappers/models" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $mapper3
    Write-Host "  OK - Roles mapper (CRITICAL)"
} catch { Write-Host "  SKIP - Roles mapper exists" }

# Assign scope to client
Write-Host ""
Write-Host "[6/6] Assigning scope to client..."
$clients = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" -Method Get -Headers @{Authorization = "Bearer $token"}
$clientId = ($clients | Where-Object { $_.clientId -eq "elearning-frontend" }).id

try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients/$clientId/default-client-scopes/$scopeId" -Method Put -Headers @{Authorization = "Bearer $token"}
    Write-Host "OK - Scope assigned to client"
} catch {
    Write-Host "SKIP - Could not assign (may already be assigned)"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "CONFIGURATION COMPLETE"
Write-Host "=========================================="
Write-Host ""
Write-Host "Created:"
Write-Host "  - Roles: admin, instructor, student"
Write-Host "  - Client Scope: elearning-profile"
Write-Host "  - Mappers: username, email, roles"
Write-Host "  - Scope assigned to elearning-frontend"
Write-Host ""
Write-Host "MANUAL STEP REQUIRED:"
Write-Host "  Configure CSP in Realm Settings > Security Defenses > Headers"
Write-Host "  Value: frame-src 'self' http://localhost:18080; frame-ancestors 'self' http://localhost:5173;"
