@echo off
echo ==========================================
echo DOCKER FULL RESTART - Build JARs + Recree tout
echo ==========================================

REM 1. Build tous les JARs Spring Boot
echo [1/6] Build de tous les JARs Maven...
cd backend\spring-boot-services

echo   - Config Server...
cd config-server
call mvn clean package -DskipTests -q
cd ..

echo   - API Gateway...
cd api-gateway
call mvn clean package -DskipTests -q
cd ..

echo   - User Service...
cd user-service
call mvn clean package -DskipTests -q
cd ..

echo   - Course Service...
cd course-service
call mvn clean package -DskipTests -q
cd ..

echo   - Progress Service...
cd progress-service
call mvn clean package -DskipTests -q
cd ..

echo   - Feedback Service...
cd feedback-service
call mvn clean package -DskipTests -q
cd ..

echo   - Chat Service...
cd chat-service
call mvn clean package -DskipTests -q
cd ..

echo   - Badge Service...
cd badge-service
call mvn clean package -DskipTests -q
cd ..

echo   - Leaderboard Service...
cd leaderboard-service
call mvn clean package -DskipTests -q
cd ..

echo   - Analytics Service...
cd analytics-service
call mvn clean package -DskipTests -q
cd ..

cd ..\..

echo [2/6] Arret des containers du projet E-Learning...
cd infrastructure
call docker-compose -f docker-compose-scaling.yml down 2>nul
cd ..

echo [3/6] Nettoyage Docker (sans supprimer les volumes)...
call docker system prune -f

echo [4/6] Attente 5 secondes...
timeout /t 5 /nobreak >nul

echo [5/6] Demarrage de tous les services avec 2 instances...
cd infrastructure
call docker-compose -f docker-compose-scaling.yml up -d --scale frontend=0 --build
cd ..

echo [6/6] Attente 90 secondes pour le demarrage complet de tous les services...
echo (Eureka charge 20+ microservices, veuillez patienter...)
timeout /t 90 /nobreak >nul

echo ==========================================
echo ✅ TOUS les services demarres avec 2 instances!
echo ------------------------------------------
echo - Eureka: http://localhost:8761
echo - Config Server: http://localhost:8889
echo - Nginx: http://localhost:8888
echo - Keycloak: http://localhost:18080/admin (admin/admin)
echo - phpMyAdmin: http://localhost:8085
echo.
echo Services avec 2 instances:
echo - API Gateway: 3000, 3011
echo - User Service: 3004, 3017
echo - Course Service: 3002, 3018
echo - Progress Service: 3003, 3019
echo - Feedback Service: 3044, 3054
echo - Notification: 3005, 3015
echo - Chat Service: 3010, 3020
echo - Badge Service: 3008, 3021
echo - Leaderboard: 3009, 3022
echo - Analytics: 3007, 3023
echo.
echo Pour le frontend (port 5173), lancer:
echo   cd frontend ^&^& npm run dev
echo ==========================================
pause
