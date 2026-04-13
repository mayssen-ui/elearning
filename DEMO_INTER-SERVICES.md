# Démo Communication Inter-Services — OpenFeign

## Résumé
Démonstration de la communication inter-services via OpenFeign : complétion cours → feedback auto → notification.

---

## Architecture

```
Frontend (React)
       │  POST /api/progress (percentage = 100)
       ▼
Progress Service (Ports 3003, 3019)
       │  OpenFeign: notifyCourseCompletion(courseId, userId)
       ▼
Course Service (Ports 3002, 3018)
       │  OpenFeign: createAutoFeedback(feedbackRequest)
       ▼
Feedback Service (Ports 3006, 3016)
       │  save()
       ▼
MySQL (feedback_db)
```

---

## Scénario Réel

### Quand un étudiant atteint 100% de progression :

1. **Frontend** envoie `POST /api/progress` avec `{ percentage: 100, courseId, userId }`
2. **Progress Service** détecte la complétion et appelle **Course Service** via OpenFeign
3. **Course Service** crée un feedback auto via OpenFeign → **Feedback Service**
4. **Notification** est créée avec le vrai nom du cours

---

## Ports des Services (Load Balancing)

| Service | Instance 1 | Instance 2 | Communication |
|---------|-----------|-----------|---------------|
| Progress Service | 3003 | 3019 | OpenFeign → Course Service |
| Course Service | 3002 | 3018 | OpenFeign → Feedback Service |
| Feedback Service | 3006 | 3016 | Réception feedback auto |
| Notification | 3005 | 3015 | Création notification |

---

## Règle Critique — @PathVariable Nommé

Tous les `@PathVariable` doivent inclure le nom explicitement :

```java
// Correct — fonctionne avec Feign
@PathVariable("courseId") Long courseId

// Incorrect — provoque une erreur
@PathVariable Long courseId
```

---

## Tests

### Test 1 — Chaîne complète via Progress Service
```http
POST http://localhost:3000/api/progress
Content-Type: application/json

{
  "userId": "votre-keycloak-sub",
  "courseId": 1,
  "percentage": 100
}
```

### Test 2 — Endpoint complétion direct
```http
POST http://localhost:3000/api/courses/1/complete/123
```

### Test 3 — Vérifier feedback créé
```http
GET http://localhost:3000/api/feedbacks
```

### Test 4 — Vérifier notification
```http
GET http://localhost:3000/api/notifications?userId=<userId>
```

---

## Points Clés

| Feature | Détail |
|---------|--------|
| OpenFeign | Progress → Course → Feedback |
| Ports LB | 3003/3019, 3002/3018, 3006/3016 |
| Gestion erreurs | `try/catch` dans tous les appels OpenFeign |
| `@PathVariable` | Doit être nommé explicitement |