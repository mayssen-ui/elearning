@echo off
echo ==========================================
echo DOCKER START ONLY - All Services + Frontend
echo ==========================================

REM 1. Start all Docker containers
echo [1/4] Starting Docker containers...
cd infrastructure
docker-compose -f docker-compose-scaling.yml up -d --scale frontend=0 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start containers!
    echo Run first: docker-full-restart.bat
    echo.
    pause
    exit /b 1
)
cd ..

REM 2. Wait for Docker services
echo [2/4] Waiting 90 seconds for all services to register in Eureka...
echo (20+ microservices are starting with staggered delays...)
timeout /t 90 /nobreak >nul

REM 3. Start Frontend
echo [3/4] Starting Frontend...
start cmd /k "title Frontend && cd frontend && npm run dev"

REM 4. Wait for Frontend
echo [4/4] Waiting 5 seconds for Frontend...
timeout /t 5 /nobreak >nul

echo ==========================================
echo ✅ ALL SERVICES STARTED!
echo ------------------------------------------
echo.
echo INFRASTRUCTURE:
echo - Eureka Dashboard:  http://localhost:8761
echo - Nginx Load Balancer: http://localhost:8888
echo - Keycloak Admin:    http://localhost:18080/admin (admin/admin)
echo - phpMyAdmin:        http://localhost:8085
echo.
echo BACKEND SERVICES (2 instances each):
echo - API Gateway:       3000, 3011
echo - User Service:      3004, 3017
echo - Course Service:    3002, 3018
echo - Progress Service:  3003, 3019
echo - Feedback Service:  3044, 3054
echo - Chat Service:      3010, 3020
echo - Badge Service:     3008, 3021
echo - Leaderboard:       3009, 3022
echo - Analytics:         3007, 3023
echo - Notification:      3005, 3015 (NestJS)
echo.
echo FRONTEND:
echo - Frontend:          http://localhost:5173
echo.
echo ==========================================
echo Press any key to exit (services continue running)
pause >nul
