# Guide Connexion Bases de Données

## Résumé
Connexions aux bases de données de chaque microservice.

---

## PostgreSQL — Notification Service

**Outil : pgAdmin 4**

1. Ouvrir pgAdmin 4
2. Clic droit **Servers** → **Register** → **Server**
3. Onglet **General** — Nom : `E-Learning Notifications`
4. Onglet **Connection** :
   - Host : `localhost`
   - Port : `5433`
   - Database : `notification_db`
   - Username : `admin`
   - Password : `adminpassword`
5. Cliquer **Save**

**Tables :**
- `notifications` — id, user_id, message, read, type, course_id, created_at
- `notification_preferences` — id, user_id, email, push, sms, in_app

---

## MySQL — Feedback Service (WAMP phpMyAdmin)

**Port MySQL WAMP : `3306`**

### Accès phpMyAdmin WAMP
- URL : http://localhost/phpmyadmin
- Server : `localhost`
- Port : `3306`
- Username : `root`
- Password : *(vide)*
- Database : `feedback_db`

### Configuration Docker
Le conteneur feedback-service se connecte à MySQL WAMP via :
- Host : `host.docker.internal:3306`
- User : `root`
- Password : *(vide)*

---

## H2 — User, Course, Progress Services

Services Spring Boot avec bases H2 fichier (persistantes). La console H2 est accessible sur le même port que le service.

| Service | Console H2 | Ports Service | JDBC URL |
|---------|-----------|---------------|----------|
| **User** | http://localhost:3004/h2-console | 3004, 3017 | `jdbc:h2:file:/app/data/userdb` |
| **Course** |  http://localhost:8083 | 3002, 3018 | `jdbc:h2:tcp://localhost:1522/coursedb` |
| **Progress** | http://localhost:8084 | 3003, 3019 | `jdbc:h2:tcp://localhost:1523/progressdb` |
| **Chat** | http://localhost:8086 | 3010, 3020 | `jdbc:h2:tcp://localhost:1524/chatdb` |

**Paramètres de connexion H2 :**
- Driver Class : `org.h2.Driver`
- User Name : `sa`
- Password : *(vide)*
- JDBC URL : voir tableau ci-dessus

> Le service doit être **démarré** pour accéder à la console H2.

---

## Référence Rapide

| Service | Outil | Host | Port | DB | User | Password |
|---------|-------|------|------|-----|------|----------|
| **Notification** | pgAdmin | `localhost` | `5433` | `notification_db` | `admin` | `adminpassword` |
| **Feedback** | phpMyAdmin WAMP | `localhost` | `3306` | `feedback_db` | `root` | *(vide)* |
| **User** | H2 Console | `localhost` | `3004, 3017` | `userdb` | `sa` | *(vide)* |
| **Course** | H2 Console | `localhost` | `3002, 3018` | `coursedb` | `sa` | *(vide)* |
| **Progress** | H2 Console | `localhost` | `3003, 3019` | `progressdb` | `sa` | *(vide)* |

---

## Vérifier les Conteneurs

```bash
docker ps
```

Conteneurs attendus : `elearning_postgres` (port 5433) et `elearning_mysql` (port 3307).
