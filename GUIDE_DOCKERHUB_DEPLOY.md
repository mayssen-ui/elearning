# 🐳 Guide Complet - Déploiement avec Docker Hub

## 📋 Objectif
Démontrer que ton projet microservices peut être déployé n'importe où en utilisant les images poussées sur Docker Hub.

---

## ✅ PrÉREQUIS

- [ ] Docker Desktop installé et démarré
- [ ] Compte Docker Hub (mayss95) avec les images poussées
- [ ] Fichier `docker-compose-hub.yml` présent

---

## 🚀 ÉTAPE 1 : ArrÊter l'ancienne infrastructure

```powershell
# Aller dans le dossier infrastructure
cd "C:\Users\User\Desktop\à modifier\elearning-main\infrastructure"

# Arrêter tous les containers actuels
docker-compose -f docker-compose-scaling.yml down

# Vérifier qu'il ne reste plus de containers
docker ps
```

**Résultat attendu :** `CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES` (vide)

---

## 🐳 ÉTAPE 2 : Lancer avec Docker Hub

```powershell
# Aller à la racine du projet
cd "C:\Users\User\Desktop\à modifier\elearning-main"

# Lancer tous les services avec les images Docker Hub
docker-compose -f docker-compose-hub.yml up -d
```

**Ce qui se passe :**
- Docker télécharge (pull) les images depuis Docker Hub
- Crée les containers
- Démarre tous les services

---

## ⏳ ÉTAPE 3 : Attendre le dÉmarrage (30-60 secondes)

```powershell
# Voir les logs en temps réél (Ctrl+C pour quitter)
docker-compose -f docker-compose-hub.yml logs -f

# Ou attendre simplement
Start-Sleep -Seconds 45
```

---

## 🔍 ÉTAPE 4 : VÉrifier que tout fonctionne

### 4.1 Voir tous les containers
```powershell
docker ps
```

**Tu dois voir 31+ containers UP !**

### 4.2 Vérifier Eureka (Load Balancing)
**Ouvrir :** http://localhost:8761

**Vérifie que chaque service a UP (2) :**
- ✅ USER-SERVICE : UP (2)
- ✅ API-GATEWAY : UP (2)
- ✅ COURSE-SERVICE : UP (2)
- ✅ PROGRESS-SERVICE : UP (2)
- ✅ FEEDBACK-SERVICE : UP (2)
- ✅ CHAT-SERVICE : UP (2)
- ✅ BADGE-SERVICE : UP (2)
- ✅ LEADERBOARD-SERVICE : UP (2)
- ✅ ANALYTICS-SERVICE : UP (2)
- ✅ NOTIFICATION-SERVICE : UP (2)

### 4.3 Tester l'API Gateway
```powershell
# Tester le User Service via API Gateway
Invoke-RestMethod http://localhost:3000/api/users/health

# Ou avec curl
curl http://localhost:3000/api/users/health
```

### 4.4 Tester le Load Balancing (Round Robin)
**Fais 3 requêtes rapides :**
```powershell
for ($i=1; $i -le 3; $i++) { Invoke-RestMethod http://localhost:3000/api/users/health }
```

**Vérifie les logs pour voir que les requêtes alternent entre les 2 instances :**
```powershell
# Instance 1
docker logs user_service_instance_1 --tail 5

# Instance 2
docker logs user_service_instance_2 --tail 5
```

---

## 🎯 ÉTAPE 5 : DÉmonstration au professeur

### Phrase d'ouverture :
> "J'ai poussé toutes mes images microservices sur Docker Hub. Mon projet est maintenant portable et peut être déployé sur n'importe quelle machine en quelques minutes."

### Commandes à montrer :

**1. Montrer les images sur Docker Hub :**
```powershell
# Lister les images locales (téléchargées depuis Docker Hub)
docker images | findstr mayss95
```

**2. Montrer le fichier docker-compose-hub.yml :**
```powershell
# Ouvrir le fichier
notepad docker-compose-hub.yml
```

**Pointer les lignes :**
```yaml
user-service-1:
  image: mayss95/user-service:1.0.0  # ← Image depuis Docker Hub
```

**3. Montrer Eureka avec UP (2) :**
Ouvrir http://localhost:8761 dans le navigateur

**Expliquer :**
> "Chaque service a 2 instances. Le load balancer répartit automatiquement les requêtes entre les instances."

**4. Simuler une panne (démonstration de la résilience) :**
```powershell
# Arrêter une instance
docker stop user_service_instance_2

# Rafraîchir Eureka → UP (1)
# Relancer
docker start user_service_instance_2

# Rafraîchir Eureka → UP (2) de nouveau
```

---

## 📊 ÉTAPE 6 : Faire le mÉnage (aprÈs la dÉmo)

```powershell
# Arrêter tout
docker-compose -f docker-compose-hub.yml down

# Supprimer les images téléchargées (optionnel)
docker rmi mayss95/user-service:1.0.0
docker rmi mayss95/api-gateway:1.0.0
# etc...
```

---

## 🎓 Questions anticipÉes du professeur

### Q: "Pourquoi utiliser Docker Hub ?"
**R:** "Pour rendre le projet portable. N'importe qui avec Docker peut lancer mon projet sans installer Java, Maven, Node.js, etc."

### Q: "Comment fonctionne le load balancing ?"
**R:** "Spring Cloud LoadBalancer distribue les requêtes entre les 2 instances. Si une tombe, l'autre continue de répondre."

### Q: "Les données sont-elles persistantes ?"
**R:** "Oui, j'utilise des volumes Docker pour MySQL, PostgreSQL et H2. Les données survivent aux redémarrages."

### Q: "Puis-je scaler à 3 instances ?"
**R:** "Oui, il suffit d'ajouter un user-service-3 dans le docker-compose avec un port différent. Eureka l'enregistrera automatiquement."

---

## 🔗 URLs importantes

| Service | URL |
|---------|-----|
| Eureka Dashboard | http://localhost:8761 |
| API Gateway | http://localhost:3000 |
| phpMyAdmin | http://localhost:8085 |
| Keycloak Admin | http://localhost:18080/admin |

---

## 🎉 RÉsumÉ pour la soutenance

1. **17 images** poussées sur Docker Hub
2. **Architecture complète** déployable en une commande
3. **Load Balancing** avec 2 instances par service
4. **Haute disponibilité** grâce à la redondance

**Commande magique :**
```bash
docker-compose -f docker-compose-hub.yml up -d
```

**Et tout fonctionne !** 🚀

---

## 💡 Astuce bonus

Créer un README sur Docker Hub pour chaque image :
```
# mayss95/user-service

Microservice de gestion des utilisateurs pour la plateforme e-learning.

## Ports
- 3004: Instance 1
- 3017: Instance 2

## Dépendances
- Eureka Server (découverte de services)
- H2 Database (stockage local)

## Lancer
```bash
docker run -p 3004:3004 mayss95/user-service:1.0.0
```
```
