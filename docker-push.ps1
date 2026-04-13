# Push ALL Containers to Docker Hub
# Usage: .\docker-push.ps1 -Username "mayss95"

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [string]$Version = "1.0.0"
)

Write-Host "Push ALL Containers to Docker Hub" -ForegroundColor Cyan
Write-Host "Username: $Username" -ForegroundColor Yellow
Write-Host "Version: $Version" -ForegroundColor Yellow
Write-Host ""

# Liste de tous les containers
$containers = @(
    @{ Name = "user_service_instance_1"; Image = "${Username}/user-service" },
    @{ Name = "user_service_instance_2"; Image = "${Username}/user-service" },
    @{ Name = "api_gateway_instance_1"; Image = "${Username}/api-gateway" },
    @{ Name = "api_gateway_instance_2"; Image = "${Username}/api-gateway" },
    @{ Name = "course_service_instance_1"; Image = "${Username}/course-service" },
    @{ Name = "course_service_instance_2"; Image = "${Username}/course-service" },
    @{ Name = "progress_service_instance_1"; Image = "${Username}/progress-service" },
    @{ Name = "progress_service_instance_2"; Image = "${Username}/progress-service" },
    @{ Name = "feedback_service_instance_1"; Image = "${Username}/feedback-service" },
    @{ Name = "feedback_service_instance_2"; Image = "${Username}/feedback-service" },
    @{ Name = "chat_service_instance_1"; Image = "${Username}/chat-service" },
    @{ Name = "chat_service_instance_2"; Image = "${Username}/chat-service" },
    @{ Name = "badge_service_instance_1"; Image = "${Username}/badge-service" },
    @{ Name = "badge_service_instance_2"; Image = "${Username}/badge-service" },
    @{ Name = "leaderboard_service_instance_1"; Image = "${Username}/leaderboard-service" },
    @{ Name = "leaderboard_service_instance_2"; Image = "${Username}/leaderboard-service" },
    @{ Name = "analytics_service_instance_1"; Image = "${Username}/analytics-service" },
    @{ Name = "analytics_service_instance_2"; Image = "${Username}/analytics-service" },
    @{ Name = "notification_service_instance_1"; Image = "${Username}/notification-service" },
    @{ Name = "notification_service_instance_2"; Image = "${Username}/notification-service" },
    @{ Name = "config_server"; Image = "${Username}/config-server" },
    @{ Name = "elearning_eureka"; Image = "${Username}/eureka-server" },
    @{ Name = "elearning_nginx"; Image = "${Username}/nginx-lb" },
    @{ Name = "elearning_keycloak"; Image = "${Username}/keycloak" },
    @{ Name = "elearning_phpmyadmin"; Image = "${Username}/phpmyadmin" },
    @{ Name = "h2_server"; Image = "${Username}/h2-database" },
    @{ Name = "h2_server_chat"; Image = "${Username}/h2-database-chat" }
)

# Pour chaque container
foreach ($container in $containers) {
    $containerName = $container.Name
    $imageName = "$($container.Image):$Version"
    
    Write-Host ""
    Write-Host "Traitement de $containerName..." -ForegroundColor Green
    
    # Verifier si le container existe
    $exists = docker ps -a --format "{{.Names}}" | findstr "$containerName"
    
    if ($exists) {
        Write-Host "   Commit $containerName vers $imageName..." -ForegroundColor Gray
        docker commit $containerName $imageName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Commit reussi !" -ForegroundColor Green
            
            Write-Host "   Pushing vers Docker Hub..." -ForegroundColor Gray
            docker push $imageName
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   Push reussi !" -ForegroundColor Green
            } else {
                Write-Host "   Echec du push !" -ForegroundColor Red
            }
        } else {
            Write-Host "   Echec du commit !" -ForegroundColor Red
        }
    } else {
        Write-Host "   Container $containerName introuvable !" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Termine ! Toutes les images sont sur Docker Hub !" -ForegroundColor Cyan
Write-Host "https://hub.docker.com/repositories/$Username" -ForegroundColor Cyan
