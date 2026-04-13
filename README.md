# Plateforme E-Learning (Microservices)

## Resume
Plateforme e-learning avec architecture microservices complete incluant :
- **Load Balancing** avec 2 instances par service
- **Service Discovery** via Eureka Server
- **Spring Cloud Config Server** pour la configuration centralisee
- **API Gateway** pour le routage des requetes
- **Authentification JWT** via Keycloak
- **Docker Hub** pour le deploiement portable

## Démarrage Rapide

### Option 1 : Depuis les sources (developpement)
```bash
# Lancer l'infrastructure complete
cd infrastructure
docker-compose -f docker-compose-scaling.yml up -d
```

### Option 2 : Depuis Docker Hub (production)
```bash
# Lancer avec les images pre-construites sur Docker Hub
docker-compose -f docker-compose-hub.yml up -d
```

### Démarrer le Frontend
```bash
cd frontend
npm install
npm run dev
```

## Points d'Acces

| Application | URL |
|-------------|-----|
| **Application** | http://localhost:5173 |
| **Keycloak** | http://localhost:18080/admin |
| **Eureka** | http://localhost:8761 |
| **Config Server** | http://localhost:8889 |
| **Nginx LB** | http://localhost:8888 |
| **phpMyAdmin** | http://localhost:8085 |

## Identifiants

| Utilisateur | Mot de passe | Rôle |
|-------------|--------------|------|
| `admin` | `admin123` | Admin |
| `testuser` | `test123` | Etudiant |

---

## Architecture

### Ports des Services (Load Balancing - 2 instances chacun)

| Service | Port Instance 1 | Port Instance 2 | Eureka | Base de donnees | Description |
|---------|-----------------|-----------------|--------|-----------------|-------------|
| API Gateway | 3000 | 3001 | ✅ | — | Routeur principal |
| User Service | 3004 | 3017 | ✅ | H2 | Gestion utilisateurs |
| Course Service | 3002 | 3018 | ✅ | SQLite | Gestion cours |
| Progress Service | 3003 | 3019 | ✅ | SQLite | Suivi progression |
| Feedback Service | 3044 | 3054 | ✅ | MySQL | Avis et notes |
| Notification | 3005 | 3015 | ✅ | PostgreSQL | Notifications NestJS |
| Chat Service | 3010 | 3020 | ✅ | H2 | Messagerie |
| Analytics Service | 3007 | 3023 | ✅ | SQLite | Statistiques |
| Badge Service | 3008 | 3021 | ✅ | SQLite | Badges |
| Leaderboard Service | 3009 | 3022 | ✅ | Redis | Classement |

### Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| Eureka Server | 8761 | Service Discovery |
| Config Server | 8889 | Configuration centralisee |
| Keycloak | 18080 | Authentification OAuth2/JWT |
| PostgreSQL | 5433 | Base de donnees notifications |
| MySQL | 3307 | Base de donnees Keycloak |
| H2 Server | 1522, 8083 | Base de donnees embarquee |
| Redis | 6379 | Cache leaderboard |
| Nginx | 8888 | Load Balancer externe |
| phpMyAdmin | 8085 | Administration MySQL |

---

## Fonctionnalités Clés

### 1. Load Balancing (Spring Cloud LoadBalancer)
- 2 instances de chaque microservice
- Distribution Round Robin des requetes
- Haute disponibilité (failover automatique)

### 2. Spring Cloud Config Server
- Configuration externalisee dans `/config-repo`
- Modification dynamique sans redémarrage
- Profil `native` pour fichier local

### 3. Service Discovery (Eureka)
- Enregistrement automatique des services
- Health checks
- Dashboard de monitoring : http://localhost:8761

### 4. API Gateway
- Routage dynamique via Eureka
- Load balancing integre
- Points d'entree unifies

### 5. Docker Hub Integration
- 17 images publiques : `mayss95/*`
- Deploiement portable sur n'importe quelle machine
- Versioning avec tags `:1.0.0`

---

## Structure du Projet

```
elearning-main/
├── backend/
│   └── spring-boot-services/
│       ├── api-gateway/          # API Gateway (Spring Cloud)
│       ├── config-server/        # Config Server (Spring Cloud)
│       ├── user-service/         # Gestion utilisateurs
│       ├── course-service/       # Gestion cours
│       ├── progress-service/     # Suivi progression
│       ├── feedback-service/     # Avis et notes
│       ├── chat-service/         # Messagerie
│       ├── badge-service/        # Systeme de badges
│       ├── leaderboard-service/  # Classement
│       └── analytics-service/    # Statistiques
├── frontend/                      # React + TypeScript + Keycloak
├── infrastructure/
│   ├── docker-compose-scaling.yml # Docker Compose local
│   ├── docker-compose-hub.yml     # Docker Compose avec Docker Hub
│   └── config-repo/               # Fichiers de configuration
├── notification-service/          # NestJS + PostgreSQL
└── GUIDE_*.md                     # Guides de demonstration
```

---

## Docker Hub

Toutes les images sont disponibles publiquement :

```bash
# Pull une image
docker pull mayss95/user-service:1.0.0

# Lancer un service
docker run -p 3004:3004 mayss95/user-service:1.0.0
```

### Images disponibles

| Image | Tag | Description |
|-------|-----|-------------|
| `mayss95/user-service` | 1.0.0 | Gestion utilisateurs |
| `mayss95/api-gateway` | 1.0.0 | Routeur API |
| `mayss95/course-service` | 1.0.0 | Gestion cours |
| `mayss95/progress-service` | 1.0.0 | Suivi progression |
| `mayss95/feedback-service` | 1.0.0 | Avis et notes |
| `mayss95/chat-service` | 1.0.0 | Messagerie |
| `mayss95/badge-service` | 1.0.0 | Badges |
| `mayss95/leaderboard-service` | 1.0.0 | Classement |
| `mayss95/analytics-service` | 1.0.0 | Statistiques |
| `mayss95/notification-service` | 1.0.0 | Notifications |
| `mayss95/config-server` | 1.0.0 | Configuration |
| `mayss95/eureka-server` | 1.0.0 | Service Discovery |
| `mayss95/keycloak` | 1.0.0 | Authentification |
| `mayss95/postgres` | 1.0.0 | PostgreSQL |
| `mayss95/h2-database` | 1.0.0 | H2 Server |
| `mayss95/phpmyadmin` | 1.0.0 | phpMyAdmin |

**Profil Docker Hub :** https://hub.docker.com/u/mayss95

---

## Guides de Demonstration

### Config Server
- `GUIDE_COMPLET_CONFIG_SERVER.md` - Guide theorique
- `DEMO_CONFIG_SERVER_V2.md` - Guide de demonstration

### Load Balancing
- `DEMO_LOAD_BALANCING_BROWSER.md` - Demo via navigateur
- `GUIDE_DOCKERHUB_DEPLOY.md` - Deploiement Docker Hub

### Docker Hub
- `DOCKERHUB_GUIDE.md` - Guide complet Docker Hub

---

## Commandes Utiles

### Docker
```bash
# Voir tous les containers
docker ps

# Voir les logs d'un service
docker logs user_service_instance_1

# Redémarrer un service
docker restart user_service_instance_1

# Entrer dans un container
docker exec -it user_service_instance_1 sh
```

### Docker Compose
```bash
# Démarrer tout
docker-compose -f docker-compose-scaling.yml up -d

# Arrêter tout
docker-compose -f docker-compose-scaling.yml down

# Voir les logs
docker-compose -f docker-compose-scaling.yml logs -f
```

### Tests API
```bash
# Tester Eureka
curl http://localhost:8761/eureka/apps

# Tester API Gateway
curl http://localhost:3000/api/users/health

# Tester Config Server
curl http://localhost:8889/user-service/default
```

---

## Technologies Utilisees

### Backend
- **Spring Boot 3.x** - Framework principal
- **Spring Cloud Gateway** - API Gateway
- **Spring Cloud Config** - Configuration externalisee
- **Spring Cloud Netflix Eureka** - Service Discovery
- **Spring Security + Keycloak** - Authentification
- **H2 / SQLite / MySQL / PostgreSQL** - Bases de donnees

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Keycloak JS** - Authentification cote client
- **Axios** - Client HTTP

### Infrastructure
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration
- **Nginx** - Reverse proxy / Load balancer
- **Eureka Server** - Service Discovery

---

- Architecture microservices avec Spring Cloud, Load Balancing et Docker Hub.

**Docker Hub :** [mayss95](https://hub.docker.com/u/mayss95)
