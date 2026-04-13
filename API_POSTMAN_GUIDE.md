# 📚 E-Learning API - Guide Postman

**Base URL:** `http://localhost:3100` (API Gateway)  
**Ports directs:**
- API Gateway: 3100
- User Service: 3104
- Chat Service: 3010
- Badge Service: 3008
- Leaderboard Service: 3009
- Analytics Service: 3007
- Feedback Service: 3006

---

## 🔐 Authentification

**Header requis pour toutes les requêtes:**
```
Authorization: Bearer {votre_token_keycloak}
Content-Type: application/json (pour POST/PUT)
```

---

## 👤 USER SERVICE (Port 3104)

### 1. Get All Users
```
GET http://localhost:3104/api/users
```

### 2. Get User by ID
```
GET http://localhost:3104/api/users/{id}
```

### 3. Sync User (Keycloak)
```
POST http://localhost:3104/api/users/sync

Query Params:
- username=admin
- email=admin@elearning.com
- role=admin
- keycloakId=a141f10f-e998-47f3-ab25-dd34656d463d
```

---

## 💬 CHAT SERVICE (Port 3010)

### 1. Get User Conversations
```
GET http://localhost:3100/api/chat/users/{userId}/conversations
```

### 2. Get Messages by Conversation
```
GET http://localhost:3100/api/chat/conversations/{conversationId}/messages
```

### 3. Send Message
```
POST http://localhost:3100/api/chat/messages

Body:
{
  "senderId": "votre_user_id",
  "receiverId": "destinataire_id",
  "content": "Bonjour ! Comment ça va ?",
  "messageType": "TEXT",
  "conversationId": "direct_user1_user2"
}
```

### 4. Create Direct Conversation
```
POST http://localhost:3100/api/chat/conversations/direct

Body:
{
  "user1": "votre_user_id",
  "user2": "autre_user_id"
}
```

### 5. Delete Conversation
```
DELETE http://localhost:3100/api/chat/conversations/{conversationId}?userId={userId}
```

### 6. Get Unread Count
```
GET http://localhost:3100/api/chat/users/{userId}/unread/count
```

### 7. Mark Conversation as Read
```
POST http://localhost:3100/api/chat/conversations/{conversationId}/read?userId={userId}
```

---

## 🏅 BADGE SERVICE (Port 3008)

### 1. Get All Badges
```
GET http://localhost:3100/api/badges
```

### 2. Get User Badges
```
GET http://localhost:3100/api/badges/users/{userId}
```

### 3. Get User Earned Badges
```
GET http://localhost:3100/api/badges/users/{userId}/earned
```

### 4. Get User Badge Stats
```
GET http://localhost:3100/api/badges/users/{userId}/stats
```

### 5. Update Badge Progress
```
POST http://localhost:3100/api/badges/users/{userId}/progress?requirementType=COURSE_COMPLETE&increment=1

Types disponibles:
- FIRST_LOGIN (Premier Pas)
- COURSE_START (Apprenti)
- COURSE_COMPLETE (Diplômé/Expert)
- STREAK_DAYS (Régulier/Assidu)
- FEEDBACK_GIVE (Critique)
- MESSAGE_SEND (Sociable)
- PDF_DOWNLOAD (Lecteur)
- NIGHT_STUDY (Couche-tard)
- MORNING_STUDY (Lève-tôt)
```

### 6. Award Badge Directly
```
POST http://localhost:3100/api/badges/users/{userId}/award/{badgeId}

Badge IDs:
- 1: Premier Pas (👋)
- 2: Apprenti (📚)
- 3: Diplômé (🎓)
- 4: Expert (🏆)
- 5: Régulier (🔥)
- 6: Assidu (🔥)
- 7: Critique (⭐)
- 8: Sociable (💬)
- 9: Mentor (🤝)
- 10: Lecteur (📄)
- 11: Couche-tard (🦉)
- 12: Lève-tôt (🐦)
```

### 7. Initialize Default Badges
```
POST http://localhost:3100/api/badges/init
```

### 8. Get Badge Leaderboard
```
GET http://localhost:3100/api/badges/leaderboard?limit=10
```

---

## 🏆 LEADERBOARD SERVICE (Port 3009)

### 1. Get Global Leaderboard
```
GET http://localhost:3100/api/leaderboard?type=global&limit=10
```

### 2. Get Weekly Leaderboard
```
GET http://localhost:3100/api/leaderboard?type=weekly&limit=10
```

### 3. Get Monthly Leaderboard
```
GET http://localhost:3100/api/leaderboard?type=monthly&limit=10
```

### 4. Get User Rank
```
GET http://localhost:3100/api/leaderboard/users/{userId}/rank
```

### 5. Get User Stats
```
GET http://localhost:3100/api/leaderboard/users/{userId}/stats
```

### 6. Award Points
```
POST http://localhost:3100/api/leaderboard/points/award?userId={userId}&actionType=COURSE_COMPLETE&description=Cours%20terminé

Action Types et Points:
- COURSE_COMPLETE: 100 pts
- COURSE_START: 10 pts
- VIDEO_WATCH: 5 pts
- PDF_DOWNLOAD: 3 pts
- FEEDBACK_GIVE: 15 pts
- MESSAGE_SEND: 2 pts
- HELP_OTHERS: 25 pts
- STREAK_3_DAYS: 30 pts
- STREAK_7_DAYS: 75 pts
- FIRST_LOGIN: 20 pts
- BADGE_EARNED: 50 pts
- DAILY_LOGIN: 5 pts
```

### 7. Reset Weekly Points (Admin)
```
POST http://localhost:3100/api/leaderboard/reset/weekly
```

### 8. Reset Monthly Points (Admin)
```
POST http://localhost:3100/api/leaderboard/reset/monthly
```

---

## 📊 ANALYTICS SERVICE (Port 3007)

### 1. Track Activity
```
POST http://localhost:3100/api/analytics/activities

Body:
{
  "userId": "votre_user_id",
  "activityType": "COURSE_START",
  "courseId": 1,
  "duration": 0,
  "metadata": "Started course"
}

Types d'activités:
- COURSE_START
- COURSE_COMPLETE
- VIDEO_WATCH
- PDF_DOWNLOAD
- MESSAGE_SEND
- FEEDBACK_GIVE
- STREAK_DAYS
```

### 2. Get User Activities
```
GET http://localhost:3100/api/analytics/users/{userId}/activities
```

### 3. Get User Learning Stats
```
GET http://localhost:3100/api/analytics/users/{userId}/stats
```

### 4. Get User Dashboard
```
GET http://localhost:3100/api/analytics/users/{userId}/dashboard
```

### 5. Get Global Stats
```
GET http://localhost:3100/api/analytics/global
```

### 6. Get Daily Stats (30 days)
```
GET http://localhost:3100/api/analytics/daily?days=30
```

### 7. Increment Daily Stat
```
POST http://localhost:3100/api/analytics/daily/increment?statType=completedCourses&increment=1

Stat types:
- activeUsers
- newEnrollments
- completedCourses
- messagesSent
- feedbacksGiven
```

---

## ⭐ FEEDBACK SERVICE (Port 3006)

### 1. Get All Feedbacks
```
GET http://localhost:3100/api/feedback
```

### 2. Get Course Feedbacks
```
GET http://localhost:3100/api/feedback/course/{courseId}
```

### 3. Get Feedback by ID
```
GET http://localhost:3100/api/feedback/{id}
```

### 4. Create Feedback
```
POST http://localhost:3100/api/feedback

Body:
{
  "userId": "votre_user_id",
  "courseId": 1,
  "rating": 5,
  "comment": "Excellent cours, très bien expliqué !"
}
```

### 5. Update Feedback
```
PUT http://localhost:3100/api/feedback/{id}

Body:
{
  "userId": "votre_user_id",
  "courseId": 1,
  "rating": 4,
  "comment": "Très bon cours"
}
```

### 6. Delete Feedback
```
DELETE http://localhost:3100/api/feedback/{id}
```

---

## 📚 COURSE & PROGRESS SERVICE

### 1. Get All Courses
```
GET http://localhost:3100/api/courses
```

### 2. Get Course by ID
```
GET http://localhost:3100/api/courses/{id}
```

### 3. Create Course
```
POST http://localhost:3100/api/courses

Body:
{
  "title": "Nouveau Cours React",
  "description": "Apprenez React from scratch"
}
```

### 4. Update Course
```
PUT http://localhost:3100/api/courses/{id}

Body:
{
  "title": "Cours React Avancé",
  "description": "Maîtrisez React et ses hooks"
}
```

### 5. Delete Course
```
DELETE http://localhost:3100/api/courses/{id}
```

### 6. Upload PDF to Course
```
POST http://localhost:3100/api/courses/{courseId}/pdf

Content-Type: multipart/form-data
Body:
- file: [sélectionnez votre PDF]
```

### 7. Delete PDF from Course
```
DELETE http://localhost:3100/api/courses/{courseId}/pdf
```

### 8. Get All Progress
```
GET http://localhost:3100/api/progress
```

### 9. Get User Progress
```
GET http://localhost:3100/api/progress/user/{userId}
```

### 10. Create/Update Progress
```
POST http://localhost:3100/api/progress

Body:
{
  "userId": "votre_user_id",
  "courseId": 1,
  "percentage": 75
}
```

---

## 🎯 EXEMPLES DE SCENARIOS COMPLETS

### Scenario 1: Compléter un cours et gagner des badges/points

**Étape 1:** Commencer le cours
```
POST http://localhost:3100/api/analytics/activities
Body: {"userId": "xxx", "activityType": "COURSE_START", "courseId": 1}

POST http://localhost:3100/api/badges/users/xxx/progress?requirementType=COURSE_START&increment=1

POST http://localhost:3100/api/leaderboard/points/award?userId=xxx&actionType=COURSE_START&description=Cours%20commencé
```

**Étape 2:** Terminer le cours
```
POST http://localhost:3100/api/analytics/activities
Body: {"userId": "xxx", "activityType": "COURSE_COMPLETE", "courseId": 1}

POST http://localhost:3100/api/badges/users/xxx/progress?requirementType=COURSE_COMPLETE&increment=1

POST http://localhost:3100/api/leaderboard/points/award?userId=xxx&actionType=COURSE_COMPLETE&description=Cours%20terminé
```

**Étape 3:** Vérifier les résultats
```
GET http://localhost:3100/api/badges/users/xxx/stats
GET http://localhost:3100/api/leaderboard/users/xxx/stats
GET http://localhost:3100/api/analytics/users/xxx/dashboard
```

### Scenario 2: Envoyer un message et gagner points

```
POST http://localhost:3100/api/chat/messages
Body: {
  "senderId": "xxx",
  "receiverId": "yyy",
  "content": "Salut !",
  "messageType": "TEXT",
  "conversationId": "direct_xxx_yyy"
}

POST http://localhost:3100/api/analytics/activities
Body: {"userId": "xxx", "activityType": "MESSAGE_SEND", "metadata": "Sent message"}

POST http://localhost:3100/api/badges/users/xxx/progress?requirementType=MESSAGE_SEND&increment=1

POST http://localhost:3100/api/leaderboard/points/award?userId=xxx&actionType=MESSAGE_SEND&description=Message%20envoyé
```

### Scenario 3: Donner un feedback

```
POST http://localhost:3100/api/feedback
Body: {"userId": "xxx", "courseId": 1, "rating": 5, "comment": "Super cours !"}

POST http://localhost:3100/api/analytics/activities
Body: {"userId": "xxx", "activityType": "FEEDBACK_GIVE", "courseId": 1}

POST http://localhost:3100/api/badges/users/xxx/progress?requirementType=FEEDBACK_GIVE&increment=1

POST http://localhost:3100/api/leaderboard/points/award?userId=xxx&actionType=FEEDBACK_GIVE&description=Feedback%20donné
```

---

## 📱 VARIABLES POSTMAN RECOMMANDÉES

Créez un environnement Postman avec ces variables :

| Variable | Valeur d'exemple | Description |
|----------|------------------|-------------|
| `baseUrl` | `http://localhost:3100` | URL de base |
| `token` | `eyJhbG...` | Token Keycloak |
| `userId` | `3de80e94-eb2c-4a7a-2a2-5b90fcfd3149` | Votre ID |
| `courseId` | `1` | ID du cours |
| `conversationId` | `direct_xxx_yyy` | ID conversation |

---

## 🔥 CONSEILS

1. **Toujours utiliser le Token** : Sans le header `Authorization: Bearer {token}`, toutes les requêtes échoueront avec 401

2. **Ordre des appels** : Pour tester un scénario complet, faites les appels dans l'ordre :
   - Analytics (track activity)
   - Badges (update progress)
   - Leaderboard (award points)

3. **Vérification** : Après chaque action, vérifiez avec :
   - `GET /api/badges/users/{id}/stats` → Voir les badges
   - `GET /api/leaderboard/users/{id}/stats` → Voir les points
   - `GET /api/analytics/users/{id}/activities` → Voir les activités

4. **Erreurs communes** :
   - 401 : Token manquant ou invalide
   - 404 : Service non démarré ou mauvais port
   - 500 : Erreur serveur (voir logs)

---

**Bonne exploration de l'API ! 🚀**
