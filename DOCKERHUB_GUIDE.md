# 🐳 DOCKER HUB - Guide Complet

## 🎯 Objectif
Pousser (push) les images Docker de ton projet vers Docker Hub pour :
- Les rendre accessibles de n'importe où
- Les partager avec ton professeur
- Préparer le déploiement cloud

---

## ✅ PRÉREQUIS

- [ ] Compte Docker Hub créé → https://hub.docker.com/signup
- [ ] Docker Desktop connecté à Docker Hub

---

## 🔧 ÉTAPE 1 : Se connecter à Docker Hub

```powershell
# Dans PowerShell, tape :
docker login

# Entre ton username Docker Hub
# Entre ton password (masqué)
# Résultat : Login Succeeded
```

---

## 🏗️ ÉTAPE 2 : Créer les Dockerfiles (si pas encore fait)

### Dockerfile pour User Service (exemple)
```dockerfile
# Fichier : backend/spring-boot-services/user-service/Dockerfile

FROM eclipse-temurin:17-jdk-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier le JAR compilé
COPY target/user-service-1.0.0.jar user-service.jar

# Exposer le port
EXPOSE 3004

# Commande de démarrage
ENTRYPOINT ["java", "-jar", "user-service.jar"]
```

### Dockerfile pour API Gateway
```dockerfile
# Fichier : backend/spring-boot-services/api-gateway/Dockerfile

FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/api-gateway-1.0.0.jar api-gateway.jar
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "api-gateway.jar"]
```

**Crée un Dockerfile pour chaque microservice !**

---

## 🏭 ÉTAPE 3 : Builder les images Docker

```powershell
# Aller dans le dossier de chaque service et builder

cd "C:\Users\User\Desktop\à modifier\elearning-main\backend\spring-boot-services\user-service"
docker build -t tonusername/user-service:1.0.0 .

cd "..\api-gateway"
docker build -t tonusername/api-gateway:1.0.0 .

cd "..\course-service"
docker build -t tonusername/course-service:1.0.0 .

# etc... pour chaque service
```

**Remarque :** Remplace `tonusername` par ton vrai username Docker Hub !

---

## 🚀 ÉTAPE 4 : Pousser vers Docker Hub

```powershell
# Pousser chaque image
docker push tonusername/user-service:1.0.0
docker push tonusername/api-gateway:1.0.0
docker push tonusername/course-service:1.0.0

# etc... pour chaque service
```

**Résultat attendu :**
```
The push refers to repository [docker.io/tonusername/user-service]
1.0.0: digest: sha256:... size: 1234
```

---

## 🌐 ÉTAPE 5 : Vérifier sur Docker Hub

1. Va sur https://hub.docker.com/repositories
2. Connecte-toi avec ton compte
3. Tu dois voir tes repositories :
   - `tonusername/user-service`
   - `tonusername/api-gateway`
   - `tonusername/course-service`
   - etc.

---

## 📋 ÉTAPE 6 : Créer un docker-compose.yml utilisant Docker Hub

Crée un nouveau fichier pour la production :

```yaml
# docker-compose-hub.yml
version: '3.8'

services:
  user-service-1:
    image: tonusername/user-service:1.0.0  # ← Image depuis Docker Hub
    container_name: user_service_instance_1
    environment:
      - SERVER_PORT=3004
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://host.docker.internal:8761/eureka/
    ports:
      - "3004:3004"

  user-service-2:
    image: tonusername/user-service:1.0.0  # ← Même image, 2ème instance
    container_name: user_service_instance_2
    environment:
      - SERVER_PORT=3017
    ports:
      - "3017:3017"

  api-gateway-1:
    image: tonusername/api-gateway:1.0.0
    container_name: api_gateway_instance_1
    ports:
      - "3000:3000"

  api-gateway-2:
    image: tonusername/api-gateway:1.0.0
    container_name: api_gateway_instance_2
    ports:
      - "3001:3000"
```

---

## 🎓 POUR LA SOUTENANCE

### Ce que tu dis au prof :
> "J'ai poussé toutes mes images vers Docker Hub. Maintenant, n'importe qui peut télécharger et exécuter mon projet avec une seule commande :"

```bash
docker-compose -f docker-compose-hub.yml up -d
```

### Bénéfices à mentionner :
1. **Portabilité** - Le projet fonctionne sur n'importe quelle machine
2. **Versioning** - Les images sont versionnées (:1.0.0)
3. **Scalabilité** - On peut lancer autant d'instances qu'on veut
4. **CI/CD Ready** - Prêt pour l'intégration continue

---

## 🔧 COMMANDES RAPIDES (Résumé)

```powershell
# 1. Login
docker login

# 2. Builder
docker build -t tonusername/nom-service:1.0.0 .

# 3. Push
docker push tonusername/nom-service:1.0.0

# 4. Pull (sur une autre machine)
docker pull tonusername/nom-service:1.0.0

# 5. Run
docker run -p 3004:3004 tonusername/user-service:1.0.0
```

---

## 🎯 EXERCICE PRATIQUE

**Crée un Dockerfile pour user-service et pousse-le :**

1. Crée `backend/spring-boot-services/user-service/Dockerfile`
2. Build : `docker build -t tonusername/user-service:1.0.0 .`
3. Push : `docker push tonusername/user-service:1.0.0`
4. Vérifie sur https://hub.docker.com

**Félicitations ! Tu as déployé ton premier microservice sur Docker Hub !** 🎉
