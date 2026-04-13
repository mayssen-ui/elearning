# Create Keycloak Realm
try {
    $tokenParams = @{ 
        grant_type = "password"
        client_id = "admin-cli"
        username = "admin"
        password = "admin"
    }
    
    Write-Host "[1/2] Getting admin token..."
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:18080/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenParams
    $token = $tokenResponse.access_token
    Write-Host "OK"
    
    Write-Host "[2/2] Creating realm 'elearning'..."
    $realmConfig = @{
        realm = "elearning"
        enabled = $true
        displayName = "E-Learning Platform"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "http://localhost:18080/admin/realms" -Method Post -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} -Body $realmConfig
        Write-Host "OK - Realm 'elearning' created!"
    } catch {
        if ($_.Exception.Message -like "*Conflict*" -or $_.Exception.Message -like "*exists*") {
            Write-Host "OK - Realm already exists"
        } else {
            Write-Host "ERROR: $($_.Exception.Message)"
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
