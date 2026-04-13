# 📋 Guide de Test Postman - API Gateways et Microservices

## 🏗️ Architecture Overview

### Configuration des Ports
- **API Gateway 1**: `http://localhost:3000`
- **API Gateway 2**: `http://localhost:3010`
- **NGINX Load Balancer**: `http://localhost:8888`
- **Eureka Server**: `http://localhost:8761`
- **Keycloak**: `http://localhost:18080`

### Microservices Disponibles
- **User Service**: 2 instances (ports 3001, 3011)
- **Course Service**: 2 instances (ports 3002, 3012)
- **Progress Service**: 2 instances (ports 3003, 3013)
- **Feedback Service**: 2 instances (ports 3006, 3016)
- **Notification Service**: 2 instances (ports 3005, 3015)

---

## 🔧 Configuration Postman

### 1. Variables d'Environnement

Créez un environnement avec les variables suivantes :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `gateway1_url` | `http://localhost:3000` | Premier API Gateway |
| `gateway2_url` | `http://localhost:3010` | Deuxième API Gateway |
| `nginx_lb` | `http://localhost:8888` | Load Balancer NGINX |
| `eureka_url` | `http://localhost:8761` | Serveur Eureka |
| `keycloak_url` | `http://localhost:18080` | Keycloak IAM |
| `auth_token` | `{{your_jwt_token}}` | Token d'authentification |

### 2. Headers Globaux

Ajoutez ces headers à vos requêtes :

```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

---

## 🧪 Tests des API Gateways

### 🔍 Vérification de Santé des Gateways

#### Gateway 1
```http
GET {{gateway1_url}}/actuator/health
```

#### Gateway 2
```http
GET {{gateway2_url}}/actuator/health
```

#### NGINX Load Balancer
```http
GET {{nginx_lb}}/actuator/health
```

---

## 👤 User Service Tests

### Routes Disponibles
- `/api/users/**` → Direct vers User Service
- `/users/**` → Avec préfixe API

### Tests via Gateway 1

#### Créer un utilisateur
```http
POST {{gateway1_url}}/api/users/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}
```

#### Lister tous les utilisateurs
```http
GET {{gateway1_url}}/api/users
Authorization: Bearer {{auth_token}}
```

#### Obtenir un utilisateur par ID
```http
GET {{gateway1_url}}/api/users/1
Authorization: Bearer {{auth_token}}
```

#### Mettre à jour un utilisateur
```http
PUT {{gateway1_url}}/api/users/1
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "firstName": "Updated",
  "lastName": "Name"
}
```

#### Supprimer un utilisateur
```http
DELETE {{gateway1_url}}/api/users/1
Authorization: Bearer {{auth_token}}
```

### Tests via Gateway 2 (même endpoints, URL différente)
Remplacez `{{gateway1_url}}` par `{{gateway2_url}}` dans toutes les requêtes ci-dessus.

---

## 📚 Course Service Tests

### Routes Disponibles
- `/api/courses/**` → Direct vers Course Service
- `/courses/**` → Avec préfixe API

### Tests via Gateway 1

#### Créer un cours
```http
POST {{gateway1_url}}/api/courses
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "title": "Introduction to Spring Boot",
  "description": "Learn Spring Boot fundamentals",
  "instructorId": 1,
  "duration": 120,
  "level": "BEGINNER"
}
```

#### Lister tous les cours
```http
GET {{gateway1_url}}/api/courses
```

#### Rechercher des cours
```http
GET {{gateway1_url}}/api/courses/search?query=Spring
```

#### Obtenir un cours par ID
```http
GET {{gateway1_url}}/api/courses/1
```

#### Mettre à jour un cours
```http
PUT {{gateway1_url}}/api/courses/1
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "title": "Advanced Spring Boot",
  "description": "Deep dive into Spring Boot"
}
```

---

## 📈 Progress Service Tests

### Routes Disponibles
- `/api/progress/**` → Direct vers Progress Service
- `/progress/**` → Avec préfixe API

### Tests via Gateway 1

#### Créer une progression
```http
POST {{gateway1_url}}/api/progress
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "userId": 1,
  "courseId": 1,
  "completionPercentage": 25,
  "status": "IN_PROGRESS"
}
```

#### Obtenir la progression d'un utilisateur
```http
GET {{gateway1_url}}/api/progress/user/1
Authorization: Bearer {{auth_token}}
```

#### Mettre à jour la progression
```http
PUT {{gateway1_url}}/api/progress/1
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "completionPercentage": 50,
  "status": "IN_PROGRESS"
}
```

---

## 💬 Feedback Service Tests

### Routes Disponibles
- `/api/feedbacks/**` → Direct vers Feedback Service
- `/feedbacks/**` → Avec préfixe API

### Tests via Gateway 1

#### Créer un feedback
```http
POST {{gateway1_url}}/api/feedbacks
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "userId": 1,
  "courseId": 1,
  "rating": 5,
  "comment": "Excellent course!",
  "feedbackType": "COURSE_REVIEW"
}
```

#### Lister tous les feedbacks
```http
GET {{gateway1_url}}/api/feedbacks
```

#### Obtenir les feedbacks d'un cours
```http
GET {{gateway1_url}}/api/feedbacks/course/1
```

#### Obtenir les feedbacks d'un utilisateur
```http
GET {{gateway1_url}}/api/feedbacks/user/1
Authorization: Bearer {{auth_token}}
```

---

## � OpenFeign Integration Tests

### Architecture d'Intégration

L'architecture utilise **OpenFeign** pour la communication inter-services :

- **Course Service** → **Feedback Service** (via FeedbackClient)
- **Progress Service** → **Course Service** (via CourseClient)
- **Feedback Service** → **Notification Service** (via notifications)

### Tests d'Intégration via API Gateway

#### 1. Course → Feedback Integration

**Marquer un cours comme terminé (déclenche OpenFeign)**
```http
POST {{gateway1_url}}/api/courses/1/complete/1
Authorization: Bearer {{auth_token}}
```

**Résultat attendu** :
- Crée un feedback automatique dans le Feedback Service
- Retourne un message de félicitations
- Le feedback est visible via : `GET {{gateway1_url}}/api/feedbacks/course/1`

**Vérifier le feedback créé**
```http
GET {{gateway1_url}}/api/feedbacks/course/1
```

#### 2. Progress → Course Integration

**Mettre à jour une progression à 100% (déclenche OpenFeign)**
```http
PUT {{gateway1_url}}/api/progress/1
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "completionPercentage": 100,
  "status": "COMPLETED"
}
```

**Résultat attendu** :
- Notifie le Course Service via OpenFeign
- Déclenche la création d'un feedback automatique
- Met à jour les statistiques du cours

#### 3. Feedback Integration Endpoints

**Endpoint d'intégration direct (test OpenFeign)**
```http
POST {{gateway1_url}}/api/feedbacks/integration/auto
Content-Type: application/json

{
  "userId": 1,
  "courseId": 1,
  "rating": 5,
  "comment": "Test d'intégration OpenFeign",
  "type": "AUTO"
}
```

**Vérifier la santé du service d'intégration**
```http
GET {{gateway1_url}}/api/feedbacks/integration/health
```

**Notifier un nouveau feedback**
```http
POST {{gateway1_url}}/api/feedbacks/integration/notify
Content-Type: application/json

{
  "feedbackId": 123,
  "userId": 1,
  "courseId": 1,
  "rating": 5,
  "message": "Nouveau feedback créé"
}
```

### Tests de Charge OpenFeign

#### Test de Complétion en Masse

Testez comment le système gère plusieurs complétions de cours simultanées :

```http
# Test 1
POST {{gateway1_url}}/api/courses/1/complete/1

# Test 2 (simultané)
POST {{gateway1_url}}/api/courses/2/complete/1

# Test 3 (simultané)
POST {{gateway1_url}}/api/courses/3/complete/2
```

#### Test de Progression en Cascade

```http
# Étape 1 : Mettre à jour la progression
PUT {{gateway1_url}}/api/progress/1
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "completionPercentage": 75,
  "status": "IN_PROGRESS"
}

# Étape 2 : Marquer comme complété (déclenche OpenFeign)
PUT {{gateway1_url}}/api/progress/1
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "completionPercentage": 100,
  "status": "COMPLETED"
}
```

### Monitoring des Appels OpenFeign

#### Vérifier les Logs des Services

**Course Service logs** :
```bash
docker logs course_service_instance_1 | grep -i feign
```

**Feedback Service logs** :
```bash
docker logs feedback_service_instance_1 | grep -i integration
```

**Progress Service logs** :
```bash
docker logs progress_service_instance_1 | grep -i course
```

#### Tests de Résilience OpenFeign

**Test de timeout** (si un service est lent) :
1. Ralentissez un service manuellement
2. Envoyez une requête OpenFeign
3. Vérifiez le comportement de timeout

**Test de circuit breaker** (si un service est down) :
1. Arrêtez le Feedback Service
2. Essayez de compléter un cours
3. Vérifiez le fallback/erreur

### Endpoints de Debug OpenFeign

#### Vérifier la Configuration des Clients

**Course Service → Feedback Client** :
```http
GET {{gateway1_url}}/actuator/feign
```

**Progress Service → Course Client** :
```http
GET {{gateway1_url}}/api/progress/actuator/feign
```

#### Tester Directement les Services (bypass Gateway)

**Test direct Course Service** :
```http
POST http://localhost:3002/api/courses/1/complete/1
```

**Test direct Feedback Service** :
```http
POST http://localhost:3006/api/feedbacks/integration/auto
Content-Type: application/json

{
  "userId": 1,
  "courseId": 1,
  "rating": 5,
  "comment": "Test direct",
  "type": "AUTO"
}
```

### Scénarios de Test Complets

#### Scénario 1 : Flux Complet d'Apprentissage

1. **Créer un cours**
2. **Créer une progression**
3. **Mettre à jour la progression progressivement**
4. **Marquer comme complété** (déclenche OpenFeign)
5. **Vérifier le feedback automatique**
6. **Vérifier les notifications**

#### Scénario 2 : Intégration Multi-Services

1. **Créer plusieurs cours**
2. **Compléter plusieurs cours en parallèle**
3. **Vérifier la cohérence des données**
4. **Tester la résilience en arrêtant un service**

#### Scénario 3 : Charge et Performance

1. **Envoyer 100+ requêtes de complétion**
2. **Surveiller les temps de réponse OpenFeign**
3. **Vérifier qu'aucun appel n'est perdu**
4. **Tester la récupération après erreur**

---

## � Notification Service Tests

### Routes Disponibles
- `/api/notifications/**` → Direct vers Notification Service
- `/notifications/**` → Avec préfixe API

⚠️ **Note importante** : Le notification service utilise NestJS et n'a pas de préfixe `/api` dans ses routes. Utilisez `/notifications` directement.

### Tests via Gateway 1

#### Envoyer une notification
```http
POST {{gateway1_url}}/notifications
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "type": "achievement",
  "userId": 1,
  "courseId": 1
}
```

#### Types de notifications disponibles
- `achievement` : Notification de réussite de cours
- `upload` : Notification d'upload PDF
- `new_course` : Notification de nouveau cours
- `progress` : Notification de progression (avec `percentage`)
- `feedback` : Notification de feedback (avec `rating`)
- `reminder` : Notification de rappel

#### Lister les notifications d'un utilisateur
```http
GET {{gateway1_url}}/notifications?userId=1
Authorization: Bearer {{auth_token}}
```

#### Marquer une notification comme lue
```http
PATCH {{gateway1_url}}/notifications/1/read
Authorization: Bearer {{auth_token}}
```

#### Supprimer toutes les notifications d'un utilisateur
```http
DELETE {{gateway1_url}}/notifications?userId=1
Authorization: Bearer {{auth_token}}
```

#### Obtenir les préférences de notification
```http
GET {{gateway1_url}}/notifications/preferences?userId=1
Authorization: Bearer {{auth_token}}
```

#### Mettre à jour les préférences de notification
```http
PUT {{gateway1_url}}/notifications/preferences?userId=1
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "emailEnabled": true,
  "pushEnabled": false,
  "frequency": "daily"
}
```

### Test direct du service (dépannage)

Si les endpoints via gateway ne fonctionnent pas, testez directement :

```http
GET http://localhost:3005/notifications?userId=1
POST http://localhost:3005/notifications
Content-Type: application/json

{
  "type": "achievement",
  "userId": 1,
  "courseId": 1
}
```

---

## ⚖️ Tests de Load Balancing

### 1. Test de Distribution de Charge

Envoyez plusieurs requêtes identiques et observez les logs pour voir quelle instance répond :

```http
GET {{gateway1_url}}/api/users
```

Répétez 10+ fois et vérifiez dans les logs des services que les requêtes sont distribuées entre les instances.

### 2. Test de Failover

1. Arrêtez une instance de service :
```bash
docker stop user_service_instance_1
```

2. Envoyez des requêtes :
```http
GET {{gateway1_url}}/api/users
```

3. Vérifiez que les requêtes sont toujours traitées par l'instance restante.

### 3. Test des Deux Gateways

Comparez les réponses des deux gateways :

```http
GET {{gateway1_url}}/api/courses
GET {{gateway2_url}}/api/courses
```

Les réponses devraient être identiques.

---

## 🔄 Tests via NGINX Load Balancer

### Test de load balancing au niveau gateway

```http
GET {{nginx_lb}}/api/users
GET {{nginx_lb}}/api/courses
GET {{nginx_lb}}/api/feedbacks
```

NGINX distribuera les requêtes entre `gateway1` (port 3000) et `gateway2` (port 3010).

---

## 🔐 Tests d'Authentification avec Keycloak

### 1. Obtenir un Token

```http
POST {{keycloak_url}}/realms/master/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=admin-cli&username=admin&password=admin
```

### 2. Utiliser le Token

Copiez le `access_token` de la réponse et mettez-le dans la variable `{{auth_token}}`.

### 3. Test avec Authentification

```http
GET {{gateway1_url}}/api/users/profile
Authorization: Bearer {{auth_token}}
```

---

## 🧪 Tests de Performance

### Script de Test de Charge

Créez une collection Postman avec les tests suivants et utilisez Postman Runner pour exécuter 100+ requêtes :

1. **GET Users** - Test de lecture
2. **POST Course** - Test d'écriture
3. **PUT Progress** - Test de mise à jour
4. **POST Notification** - Test de notification

### Monitoring des Performances

Surveillez ces endpoints pendant les tests :

```http
GET {{gateway1_url}}/actuator/metrics
GET {{gateway2_url}}/actuator/metrics
GET {{eureka_url}}/instances
```

---

## 🐛 Dépannage

### Problèmes Communs

1. **Gateway ne répond pas**
   - Vérifiez : `docker ps | grep api-gateway`
   - Logs : `docker logs api_gateway_instance_1`

2. **Service non trouvé**
   - Vérifiez Eureka : `GET {{eureka_url}}/instances`
   - Redémarrez le service concerné

3. **Load balancing ne fonctionne pas**
   - Vérifiez la configuration NGINX
   - Assurez-vous que les deux gateways sont enregistrées dans Eureka

4. **Erreur 503 Service Unavailable**
   - Vérifiez que tous les services sont démarrés
   - Consultez les logs des services individuels

### 🔔 Notification Service - Problèmes Spécifiques

#### Erreur 404 sur les endpoints notifications

**Cause** : Le notification service utilise NestJS avec des routes différentes des autres services.

**Solutions** :

1. **Vérifiez que le service est démarré** :
   ```bash
   docker ps | grep notification
   ```

2. **Test direct du service** :
   ```http
   GET http://localhost:3005/notifications
   POST http://localhost:3005/notifications
   ```

3. **Vérifiez les logs du service** :
   ```bash
   docker logs notification_service_instance_1
   ```

4. **Endpoints corrects** :
   - ✅ `POST /notifications` (pas `/api/notifications/send`)
   - ✅ `GET /notifications?userId=X` (pas `/api/notifications/user/X`)
   - ✅ `PATCH /notifications/1/read` (pas `/api/notifications/1/read`)

5. **Format du corps de la requête** :
   ```json
   {
     "type": "achievement",
     "userId": 1,
     "courseId": 1
   }
   ```

#### Si le service ne démarre pas

1. **Vérifiez les variables d'environnement** :
   ```bash
   docker exec notification_service_instance_1 env | grep -E "(HTTP_PORT|DB_)"
   ```

2. **Redémarrez le service** :
   ```bash
   docker restart notification_service_instance_1
   ```

### 🔗 OpenFeign - Erreur 500 - Problèmes Spécifiques

#### ✅ SOLUTION APPLIQUÉE - Configuration Corrigée

**Problème identifié** : 
- Les clients Feign utilisaient `localhost:8761` au lieu de `host.docker.internal:8761`
- Les services ne s'enregistraient pas correctement dans Eureka
- Les URLs directes des services étaient incorrectes

**Corrections appliquées** :
1. **FeedbackClient** : `url = "http://172.18.0.18:3006"` (IP directe)
2. **CourseClient** : `url = "http://172.18.0.13:3002"` (IP directe)  
3. **Eureka URLs** : `http://host.docker.internal:8761/eureka/` dans tous les services
4. **Timeouts augmentés** : 10s pour les appels inter-services

#### Tests de validation

**✅ Test de complétion de cours** :
```http
POST http://localhost:3000/api/courses/1/complete/1
```

**✅ Vérification du feedback créé** :
```http
GET http://localhost:3000/api/feedbacks/course/1
```

**✅ Logs confirmés** :
- Feedback Service reçoit les appels : "Feedback automatique sauvegardé: ID=24"
- Course Service crée les feedbacks via OpenFeign
- Services enregistrés dans Eureka avec succès

#### État actuel

**Fonctionnel** :
- ✅ Connexion réseau entre services (testé avec `nc -zv 172.18.0.18 3006`)
- ✅ Enregistrement Eureka de tous les services
- ✅ Appels OpenFeign entre Course Service → Feedback Service
- ✅ Création automatique des feedbacks (IDs 24, 25 confirmés)

**En cours de debug** :
- Erreur 500 sur l'endpoint `/api/feedbacks/course/1` via Gateway
- L'appel OpenFeign fonctionne mais la réponse Gateway échoue

#### Prochaines étapes de debug

1. **Vérifier la configuration du feedback-service dans le Gateway**
2. **Tester l'endpoint feedback directement** : `GET http://localhost:3006/api/feedbacks/course/1`
3. **Vérifier les routes du Gateway pour le feedback-service**

### Commandes Utiles

```bash
# Vérifier tous les conteneurs
docker ps -a

# Logs d'un service spécifique
docker logs user_service_instance_1

# Redémarrer tous les services
docker-compose -f infrastructure/docker-compose-scaling.yml restart

# Vérifier l'état des services dans Eureka
curl http://localhost:8761/eureka/apps

# Vérifier spécifiquement le notification service
curl http://localhost:3005/notifications

# Monitoring OpenFeign
curl http://localhost:3002/actuator/feign
curl http://localhost:3006/api/feedbacks/integration/health

# Logs OpenFeign
docker logs course_service_instance_1 | grep -i feign
docker logs feedback_service_instance_1 | grep -i integration
docker logs progress_service_instance_1 | grep -i course
```

---

## 📊 Checklist de Test

- [ ] Gateway 1 accessible et fonctionnel
- [ ] Gateway 2 accessible et fonctionnel
- [ ] NGINX Load Balancer distribue correctement
- [ ] Tous les microservices répondent via les gateways
- [ ] **OpenFeign Course → Feedback fonctionne**
- [ ] **OpenFeign Progress → Course fonctionne**
- [ ] **Endpoints d'intégration accessibles**
- [ ] **Feedback automatique créé lors de la complétion**
- [ ] **Tests de charge OpenFeign passent**
- [ ] Failover fonctionne lors de l'arrêt d'une instance
- [ ] Authentification Keycloak fonctionne
- [ ] Tests de performance passent avec succès
- [ ] Monitoring et logs fonctionnent

---

## 🚀 Prochaines Étapes

1. **Automatisation** : Créez des scripts d'automatisation avec Newman
2. **Monitoring** : Intégrez Prometheus et Grafana
3. **Tests E2E** : Ajoutez des tests end-to-end avec Cypress
4. **Sécurité** : Implémentez OAuth 2.0 avancé
5. **Performance** : Optimisez les temps de réponse

---

*Pour toute question ou problème, consultez les logs des conteneurs ou contactez l'équipe de développement.*
