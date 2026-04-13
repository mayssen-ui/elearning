# Spring Boot Services

Cette section contient les services Spring Boot pour l'application E-Learning.

## Services disponibles

1. **user-service** (Port 3001) - SQLite
2. **course-service** (Port 3002) - SQLite
3. **feedback-service** (Port 3005) - MySQL
4. **progress-service** (Port 3003) - SQLite
5. **chat-service** (Port 3010) - SQLite - Messagerie en temps réel
6. **analytics-service** (Port 3007) - SQLite - Statistiques et analytics
7. **badge-service** (Port 3008) - SQLite - Système de badges
8. **leaderboard-service** (Port 3009) - SQLite - Classement et gamification

## Prérequis

- Java 17 ou supérieur
- Maven 3.6+
- Docker (pour MySQL et PostgreSQL)

## Configuration

### Base de données

- **user-service** : SQLite (`./user-db.sqlite`)
- **course-service** : SQLite (`./course-db.sqlite`)
- **feedback-service** : MySQL (port 3307, base `feedback_db`)
- **progress-service** : SQLite (`./progress-db.sqlite`)
- **chat-service** : SQLite (`./chat-db.sqlite`) - Port 3010
- **analytics-service** : SQLite (`./analytics-db.sqlite`)
- **badge-service** : SQLite (`./badge-db.sqlite`)
- **leaderboard-service** : SQLite (`./leaderboard-db.sqlite`)

### Eureka

Tous les services sont configurés pour s'enregistrer auprès d'Eureka Server sur `http://localhost:8761`.

## Démarrage des services

Pour chaque service, naviguez dans son répertoire et exécutez :

```bash
mvn spring-boot:run
```

Ou compilez d'abord puis exécutez :

```bash
mvn clean package
java -jar target/[service-name]-1.0.0.jar
```

## Endpoints REST

### User Service (http://localhost:3001)
- `GET /api/users` - Liste tous les utilisateurs

### Course Service (http://localhost:3002)
- `GET /api/courses` - Liste tous les cours
- `POST /api/courses` - Crée un nouveau cours
- `PUT /api/courses/{id}` - Met à jour un cours
- `DELETE /api/courses/{id}` - Supprime un cours

### Feedback Service (http://localhost:3005)
- `GET /api/feedbacks` - Liste tous les feedbacks
- `POST /api/feedbacks` - Crée un nouveau feedback
- `PUT /api/feedbacks/{id}` - Met à jour un feedback
- `DELETE /api/feedbacks/{id}` - Supprime un feedback

### Progress Service (http://localhost:3003)
- `GET /api/progress` - Liste tous les progrès
- `POST /api/progress` - Met à jour ou crée un progrès
- `DELETE /api/progress/{id}` - Supprime un progrès

### Chat Service (http://localhost:3010)
- `GET /api/chat/users/{userId}/conversations` - Liste les conversations d'un utilisateur
- `GET /api/chat/conversations/{conversationId}/messages` - Récupère les messages d'une conversation
- `POST /api/chat/messages` - Envoie un message
- `GET /api/chat/users/{userId}/unread/count` - Nombre de messages non lus
- `GET /api/chat/courses/{courseId}/discussion` - Discussion d'un cours
- `POST /api/chat/conversations/direct` - Crée une conversation directe

### Analytics Service (http://localhost:3007)
- `GET /api/analytics/users/{userId}/stats` - Statistiques d'apprentissage
- `GET /api/analytics/users/{userId}/activities` - Activités de l'utilisateur
- `POST /api/analytics/activities` - Enregistre une activité
- `GET /api/analytics/global` - Statistiques globales (admin)
- `GET /api/analytics/daily` - Statistiques quotidiennes (admin)

### Badge Service (http://localhost:3008)
- `GET /api/badges` - Liste tous les badges
- `GET /api/badges/users/{userId}` - Badges d'un utilisateur
- `GET /api/badges/users/{userId}/stats` - Statistiques des badges
- `POST /api/badges/init` - Initialise les badges par défaut
- `POST /api/badges/users/{userId}/progress` - Met à jour la progression

### Leaderboard Service (http://localhost:3009)
- `GET /api/leaderboard` - Classement (total/weekly/monthly)
- `GET /api/leaderboard/users/{userId}/rank` - Rang d'un utilisateur
- `GET /api/leaderboard/users/{userId}/stats` - Statistiques de points
- `POST /api/leaderboard/points/award` - Attribue des points

## Note importante

Les fichiers `pom.xml` contiennent une balise `<n>` qui devrait être `<name>`. Veuillez corriger manuellement cette balise dans chaque fichier `pom.xml` avant de compiler.

