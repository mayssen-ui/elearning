# Architecture — Plateforme E-Learning

## Résumé
Architecture microservices avec Spring Boot, NestJS, React. Load balancing Nginx + Eureka discovery. Authentification Keycloak JWT.

---

## Microservices

### 1. API Gateway (Spring Boot)
- **Rôle** : Point d'entrée unique, routing vers services
- **Ports** : 3000 (instance 1), 3011 (instance 2)
- **Technologie** : Spring Cloud Gateway

### 2. User Service (Spring Boot)
- **Rôle** : Gestion utilisateurs
- **Ports** : 3004, 3017
- **Base** : H2 fichier (`./data/userdb`)

### 3. Course Service (Spring Boot)
- **Rôle** : Gestion cours, PDF, complétion
- **Ports** : 3002, 3018
- **Base** : H2 fichier (`./data/coursedb`)
- **Endpoints** : `/api/courses`, `/api/courses/{id}/pdf`

### 4. Progress Service (Spring Boot)
- **Rôle** : Suivi progression étudiants
- **Ports** : 3003, 3019
- **Base** : H2 fichier (`./data/progressdb`)
- **Feature** : Appel Course Service via OpenFeign à 100%

### 5. Notification Service (NestJS)
- **Rôle** : Notifications typées
- **Ports** : 3005, 3015 (HTTP) + 8877, 8879 (TCP)
- **Base** : PostgreSQL (Docker, port 5433)

### 6. Feedback Service (Spring Boot)
- **Rôle** : Avis et notation cours
- **Ports** : 3006, 3016
- **Base** : MySQL (Docker, port 3307)

---

## Infrastructure

| Service | Technologie | Rôle |
|---------|-------------|------|
| **Eureka** | Spring Cloud Netflix | Service discovery |
| **Keycloak** | JBoss | Authentification JWT |
| **Nginx** | Nginx | Load balancing |
| **PostgreSQL** | Docker | Base notifications |
| **MySQL** | Docker | Base feedbacks |

---

## Communication Inter-Services

1. **Eureka** : Tous les services Spring Boot s'enregistrent
2. **API Gateway** : Frontend → Gateway → Services
3. **Keycloak** : Validation JWT sur chaque requête
4. **OpenFeign** : Progress → Course (complétion)

---

## Bases de Données

| Service | Type | Technologie |
|---------|------|-------------|
| User Service | SQL | H2 fichier |
| Course Service | SQL | H2 fichier |
| Progress Service | SQL | H2 fichier |
| Feedback Service | SQL | MySQL (Docker) |
| Notification | SQL | PostgreSQL (Docker) |

---

## Structure

```
backend/
├── apps/notification-microservice/ (NestJS)
└── spring-boot-services/
    ├── api-gateway/ (Ports 3000, 3011)
    ├── user-service/ (Ports 3004, 3017)
    ├── course-service/ (Ports 3002, 3018)
    ├── progress-service/ (Ports 3003, 3019)
    ├── feedback-service/ (Ports 3044, 3054)
    ├── chat-service/ (Ports 3010, 3020)
    ├── badge-service/ (Ports 3008, 3021)
    ├── leaderboard-service/ (Ports 3009, 3022)
    └── analytics-service/ (Ports 3007, 3023)

frontend/ (React + Vite, Port 5173)
infrastructure/ (Docker Compose)
```

---

## Statut Services

| Service | Ports | Statut |
|---------|-------|--------|
| API Gateway | 3000, 3011 | ✅ Running |
| User Service | 3004, 3017 | ✅ Running |
| Course Service | 3002, 3018 | ✅ Running |
| Progress Service | 3003, 3019 | ✅ Running |
| Feedback Service | 3044, 3054 | ✅ Running |
| Chat Service | 3010, 3020 | ✅ Running |
| Badge Service | 3008, 3021 | ✅ Running |
| Leaderboard Service | 3009, 3022 | ✅ Running |
| Analytics Service | 3007, 3023 | ✅ Running |
| Notification | 3005, 3015 | ✅ Running |
| Frontend | 5173 | ✅ Running |
| PostgreSQL | 5433 | ✅ Running |
| MySQL | 3307 | ✅ Running |
| Keycloak | 18080 | ✅ Running |
| Eureka | 8761 | ✅ Running |
| Nginx | 8888 | ✅ Running |

---

## Pourquoi Nginx + Eureka ensemble ?

| | **Eureka** | **Nginx** |
|---|---|---|
| **Rôle** | Annuaire interne des services | Porte d'entrée unique |
| **Usage** | Services se trouvent entre eux | Clients externes accèdent à l'app |
| **Scope** | Interne (microservices) | Externe (utilisateurs) |
| **Sans ça** | Chaque service doit connaître les IP/port des autres | 10+ ports exposés, CORS complexe, pas de load balancing |

**Analogie simple** : Eureka = répertoire téléphonique interne de l'entreprise. Nginx = standardiste unique qui reçoit tous les appels externes et les transfère.

**Dans notre architecture** :
```
Utilisateur → Nginx (8888) → API Gateway (3000/3011) → Eureka → Course-Service (3002/3018)
                      ↑                    ↑              ↑
                 Porte d'entrée         Load balancing   Discovery interne
```

**Sans Nginx** : Le frontend React devrait gérer 10 URLs différentes (3000, 3002, 3003...) avec CORS complexe entre 5173 et tous les ports.

**Sans Eureka** : Chaque service Spring Boot/NestJS devrait coder en dur les adresses des autres services (ex: "http://localhost:3002"), impossible à scaler.

✅ **Les deux ensemble** : Architecture propre, scalable et maintenable.

---

## Comment intégrer un service NestJS dans Eureka ?

Le Notification Service (NestJS) n'est pas Spring Boot, donc il ne s'enregistre pas automatiquement. Voici la solution rapide :

### 1. Package
```bash
npm install eureka-js-client
```

### 2. Code (main.ts)
```typescript
const { Eureka } = require('eureka-js-client');

const client = new Eureka({
  instance: {
    app: 'notification-service',
    instanceId: process.env.EUREKA_INSTANCE_INSTANCE_ID,
    port: { '$': httpPort, '@enabled': 'true' },
    vipAddress: 'notification-service',
    dataCenterInfo: { '@class': '...', name: 'MyOwn' }
  },
  eureka: {
    host: 'host.docker.internal',
    port: 8761,
    servicePath: '/eureka/apps/'
  }
});
client.start(() => console.log('Registered!'));
```

### 3. Docker Compose
Variables d'environnement ajoutées :
- `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE`
- `EUREKA_INSTANCE_INSTANCE_ID`
- `EUREKA_INSTANCE_HOSTNAME`

**Résultat** : Le service NestJS apparaît dans Eureka comme les services Spring Boot !

---

## Résumé : Nginx + Eureka en 1 phrase

> **Nginx** = Porte d'entrée unique pour les clients (frontend). **Eureka** = Annuaire interne pour que les microservices se trouvent entre eux.  
> Sans Nginx : 10+ ports exposés. Sans Eureka : Adresses codées en dur.  
> ✅ **Ensemble** : 1 port pour le client, découverte automatique des services.