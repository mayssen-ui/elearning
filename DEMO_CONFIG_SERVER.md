# 🎓 Démonstration du Config Server - Guide pour l'Encadrant

## 📋 Prérequis
Avant la démo, assure-toi que tous les services tournent :
```powershell
cd "C:\Users\User\Desktop\à modifier\elearning-main\infrastructure"
docker-compose -f docker-compose-scaling.yml ps
```

Tous les containers doivent être **Up**.

---

## 🎬 Scénario de Démonstration (5-10 minutes)

### **Étape 1 : Accéder au Config Server (30s)**
**URL à montrer :** http://localhost:8889/actuator/health

**Ce que tu dis :**
> "Voici notre Config Server Spring Cloud. Il centralise toute la configuration de nos microservices."

**Ce que tu montres :**
- La page affiche `{"status":"UP"}` → montre que le service est UP
- Si erreur 404 sur `/`, c'est normal - le Config Server n'a pas de page d'accueil

---

### **Étape 2 : Voir la configuration d'un service (1min)**
**URL à montrer :** http://localhost:8889/user-service/default

**Ce que tu dis :**
> "Chaque microservice récupère sa configuration ici. Par exemple, voici la config du user-service."

**Ce que tu montres :**
- Le JSON contient : `eureka.client.serviceUrl.defaultZone`, `server.port`, `spring.datasource.url`
- Montre que **tout est centralisé**, pas besoin de chercher dans le code

---

### **Étape 3 : Démonstration du changement dynamique (2min)** ⭐
**ACTION :** Modifie un fichier de config en direct

```powershell
# Dans un terminal, tape :
cd "C:\Users\User\Desktop\à modifier\elearning-main\infrastructure\config-repo"
notepad user-service.yml
```

**Modifie :** Change la valeur `logging.level.root` de `INFO` à `DEBUG`

**Ce que tu dis :**
> "Je change la configuration SANS redémarrer le service. Watch this !"

**Puis rafraîchis :** http://localhost:8889/user-service/default

**Le changement apparaît immédiatement !**

---

### **Étape 4 : Vérifier le refresh automatique (2min)** ⭐⭐
**ACTION :** Vérifie que le service a pris en compte la config

**URL :** http://localhost:3004/actuator/env (user-service direct)

**OU** regarde les logs :
```powershell
docker logs user_service_instance_1 --tail 20
```

**Ce que tu dis :**
> "Le service peut rafraîchir sa config à chaud avec @RefreshScope. Pas besoin de redémarrer tous les containers !"

---

### **Étape 5 : Comparer avec et sans Config Server (1min)**
**Ce que tu dis :**
> "Sans Config Server, on aurait 12 fichiers application.yml à modifier un par un. Avec, on change UNE FOIS ici, et tous les services récupèrent la nouvelle config."

Montre le dossier `config-repo/` :
```powershell
ls infrastructure/config-repo/
```

**12 services = 12 fichiers centralisés au même endroit !**

---

## 🎯 Points Forts à Souligner

| Avantage | Explication |
|----------|-------------|
| **Centralisation** | Une seule source de vérité pour toute la config |
| **Changement à chaud** | Modifie sans redémarrer les services |
| **Environnements multiples** | `user-service-dev.yml`, `user-service-prod.yml` |
| **Versioning possible** | Git backend pour historique des changements |
| **Sécurité** | Chiffrement des mots de passe avec {cipher} |

---

## 🚨 Questions/Réponses Anticipées

**Q: "Pourquoi pas juste des variables d'environnement ?"**
A: "Avec le Config Server, on peut changer la config sans redémarrer les containers. C'est plus flexible pour le cloud."

**Q: "Et si le Config Server tombe ?"**
A: "Les services gardent leur config en cache. Ils continuent de fonctionner. On peut aussi scaler le Config Server."

**Q: "C'est overkill pour un petit projet ?"**
A: "Oui, mais c'est une compétence indispensable pour l'entreprise. 90% des microservices pro utilisent ça."

---

## 📁 Fichiers à Montrer

1. `infrastructure/config-repo/` - Tous les fichiers de config
2. `backend/spring-boot-services/config-server/` - Le code du serveur
3. N'importe quel `application.yml` d'un microservice - Montre qu'il est vide ! (tout vient du Config Server)

---

**Bonne chance pour ta soutenance ! 🚀**
