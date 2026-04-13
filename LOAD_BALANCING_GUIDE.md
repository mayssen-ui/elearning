# Guide Load Balancing

## Résumé
Load balancing à 2 niveaux : Nginx (externe) + Eureka (discovery interne). 2 instances par microservice.

## Ports des Services

| Service | Instance 1 | Instance 2 | Eureka |
|---------|-----------|-----------|--------|
| API Gateway | 3000 | 3011 | ✅ |
| User Service | 3004 | 3017 | ✅ |
| Course Service | 3002 | 3018 | ✅ |
| Progress Service | 3003 | 3019 | ✅ |
| Feedback Service | 3006 | 3016 | ✅ |
| Notification HTTP | 3005 | 3015 | ❌ |
| Notification TCP | 8877 | 8879 | ❌ |

## Infrastructure Nginx

| Service | Port | Description |
|---------|------|-------------|
| Nginx HTTP | 8888 | Point d'entrée principal |
| Nginx Internal | 8880 | LB inter-services |

## Démarrage

```bash
# Une commande
start-all.bat
```

## Vérification

| URL | Description |
|-----|-------------|
| http://localhost:8888 | Application via Nginx |
| http://localhost:8761 | Eureka Dashboard |

## Fichiers Clés

- `infrastructure/nginx/nginx.conf` — Configuration Nginx
- `start-all.bat` — Script démarrage

## Commandes Utiles

```bash
# Logs Nginx
docker logs elearning_nginx_lb

# Vérifier instances Eureka
curl http://localhost:8761/eureka/apps
```


Voici le tableau complet avec 2 instances pour chaque microservice :

Microservice	Instance 1	Instance 2	Base de données	Type
API Gateway	3000	3011	-	Spring Boot
User Service	3004	3017	H2 fichier	Spring Boot
Course Service	3002	3018	H2 fichier	Spring Boot
Progress Service	3003	3019	H2 fichier	Spring Boot
Feedback Service	3024	3034	MySQL (3306/3307)	Spring Boot
Notification Service	3005	3015	PostgreSQL (5432/5433)	NestJS
Chat Service	3010	3020	SQLite fichier	Spring Boot
Badge Service	3008	3021	H2 fichier	Spring Boot
Leaderboard Service	3009	3022	H2 fichier	Spring Boot
Analytics Service	3007	3023	H2 fichier	Spring Boot
Eureka Server	8761	-	-	Spring Boot
Frontend (Vite)	5173	-	-	React
Infrastructure :

Service	Port Externe	Port Interne
MySQL	3307	3306
PostgreSQL	5433	5432
Keycloak	18080	8080
Nginx	8888	80