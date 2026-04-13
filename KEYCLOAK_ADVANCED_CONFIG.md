# Configuration Avancée Keycloak

## 8. Client Scopes (Important pour JWT)

Les **Client Scopes** définissent quelles informations sont incluses dans le token JWT.

### 8.1 Créer un Scope Personnalisé

1. Aller à **Client scopes** → **Create client scope**
2. **Name** : `elearning-profile`
3. **Type** : Default
4. Cliquer **Save**

### 8.2 Ajouter des Mappers

Dans le scope `elearning-profile`, onglet **Mappers** → **Configure a new mapper** :

> **Note** : Dans la fenêtre "Configure a new mapper", tu verras une liste de types. Voici lesquels choisir :

#### Mapper 1 : Username
**Type à sélectionner** : **User Property** ("Map a built in user property to a token claim")

Configuration :
- **Name** : username
- **Property** : username
- **Token Claim Name** : preferred_username
- ☑️ **Add to ID token** : ON
- ☑️ **Add to access token** : ON

#### Mapper 2 : Email
**Type à sélectionner** : **User Property** ("Map a built in user property to a token claim")

Configuration :
- **Name** : email
- **Property** : email
- **Token Claim Name** : email
- ☑️ **Add to ID token** : ON
- ☑️ **Add to access token** : ON

#### Mapper 3 : Rôles (TRÈS IMPORTANT !)
**Type à sélectionner** : **User Realm Role** ("Map a user realm role to a token claim")

Configuration :
- **Name** : realm roles
- **Token Claim Name** : roles
- ☑️ **Add to ID token** : ON
- ☑️ **Add to access token** : ON
- ☑️ **Add to userinfo** : ON

#### Mapper 4 : Full Name (Optionnel)
**Type à sélectionner** : **User's full name** ("Maps the user's first and last name to the OpenID Connect 'name' claim")

Configuration :
- **Name** : full name
- ☑️ **Add to ID token** : ON
- ☑️ **Add to access token** : ON
- ☑️ **Add to userinfo** : ON

> **Note** : Ce mapper n'a pas de champ "Token Claim Name" car il utilise automatiquement le claim `name` d'OpenID Connect.

---

**Résumé des types à choisir dans la liste :**

| Mapper | Type à sélectionner | Description affichée |
|--------|---------------------|---------------------|
| Username | **User Property** | "Map a built in user property..." |
| Email | **User Property** | "Map a built in user property..." |
| Rôles | **User Realm Role** | "Map a user realm role to a token claim" |
| Full Name | **User's full name** | "Maps the user's first and last name..." |

### 8.3 Assigner le Scope au Client

1. Aller à **Clients** → `elearning-frontend` → **Client scopes**
2. Onglet **Setup**
3. **Add client scope** → sélectionner `elearning-profile` → **Add** → **Default**

---

## 9. Configuration des Tokens

Pour éviter les déconnexions fréquentes :

### 9.1 Access Tokens (Onglet Tokens)
1. Aller à **Realm settings** → **Tokens**
2. Configurer :
   - **Access Token Lifespan** : 60 minutes (au lieu de 5 min)
   - **Access Token Lifespan For Implicit Flow** : 60 minutes

### 9.2 Sessions (Onglet Sessions)
1. Aller à **Realm settings** → **Sessions**
2. Configurer :
   - **SSO Session Idle** : 30 minutes
   - **SSO Session Max** : 10 hours
   - **SSO Session Idle Timeout Remember Me** : 10 hours

---

## 10. Créer des Groupes (Optionnel)

Pour organiser les utilisateurs :

1. Aller à **Groups** → **Create group**
2. Créer :
   - `Administrators` (assigner rôle `admin`)
   - `Instructors` (assigner rôle `instructor`)
   - `Students` (assigner rôle `student`)

### Assigner des utilisateurs aux groupes :
1. Aller à **Users** → sélectionner un utilisateur
2. Onglet **Groups** → **Join Group**
3. Sélectionner le groupe approprié

---

## 11. Configuration CORS (si problèmes)

Si tu as des erreurs CORS :

1. Aller à **Clients** → `elearning-frontend` → **Settings**
2. **Web origins** : Ajoute explicitement :
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`

---

## 12. Content Security Policy (CSP) - IMPORTANT

Si tu as cette erreur dans le navigateur :
```
Framing 'http://localhost:18080/' violates Content Security Policy
```

**Solution : Configurer dans Realm Settings (PAS dans le client)**

1. Aller à **Realm Settings** (en bas à gauche)

2. Onglet **Security Defenses** → Sous-onglet **Headers**

3. **Content-Security-Policy** : Remplace par :
   ```
   frame-src 'self' http://localhost:18080; frame-ancestors 'self' http://localhost:5173 http://127.0.0.1:5173; object-src 'none';
   ```

4. Optionnel : désactive **X-Frame-Options** (ou mets à `SAMEORIGIN`)

5. Cliquer **Save**

**Et aussi vérifier le client :**

6. Aller à **Clients** → `elearning-frontend` → **Settings**

7. **Valid Redirect URIs** : Vérifie qu'il y a :
   ```
   http://localhost:5173/*
   http://localhost:5173/silent-check-sso.html
   ```

8. **Web Origins** : Ajoute :
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   ```

9. Cliquer **Save**

> **Note** : La CSP dans Realm Settings permet à Keycloak de s'afficher dans une iframe du frontend React.

---

## 13. Activer l'Inscription (Optionnel)

Pour permettre aux utilisateurs de s'inscrire :

1. Aller à **Realm settings** → **Login**
2. Activer :
   - **User registration** : ON
   - **Email as username** : OFF (si tu veux username personnalisé)
   - **Login with email** : ON
   - **Duplicate emails** : OFF

---

## 13. Configuration Email (Optionnel)

Pour l'envoi d'emails (mot de passe oublié, etc.) :

1. Aller à **Realm settings** → **Email**
2. Configurer :
   - **From** : noreply@elearning.com
   - **Host** : smtp.gmail.com (exemple)
   - **Port** : 587
   - **Encryption** : Enable StartTLS
   - **Authentication** : ON
   - **Username** : ton-email@gmail.com
   - **Password** : ton-mot-de-passe-app

---

## 14. Sécurité Renforcée

1. Aller à **Authentication** → **Flows**
2. Sélectionner **Browser flow**
3. Vérifier que **Cookie** et **Keycloak Forms** sont actifs

### Brute Force Protection :
1. **Realm settings** → **Security Defenses** → **Brute Force Detection**
2. Activer :
   - **Brute Force Detection** : ON
   - **Max Login Failures** : 5
   - **Wait Increment Seconds** : 60
   - **Max Wait** : 15 minutes
   Max Login Failures	5	Bloque après 5 tentatives échouées
Wait Increment	60 secondes	Attendre 1 minute de plus à chaque échec
Max Wait	15 minutes	Attente maximum de 15 minutes
Quick Login Check Milliseconds	1000	Délai minimum entre 2 tentatives

---

## 15. Vérification Finale

Teste ces URLs dans ton navigateur :

| URL | Description |
|-----|-------------|
| `http://localhost:18080/realms/elearning/.well-known/openid-configuration` | Configuration OIDC |
| `http://localhost:18080/realms/elearning/protocol/openid-connect/certs` | Clés JWT publiques |
| `http://localhost:18080/realms/elearning/protocol/openid-connect/token` | Endpoint token |

Si tu vois du JSON, tout est configuré ! ✅

---

## Résumé des Éléments Clés

✅ **Minimum requis pour l'app E-Learning :**
1. Realm `elearning`
2. Client `elearning-frontend` (public)
3. Client `elearning-backend` (confidential avec secret)
4. Rôles : `admin`, `instructor`, `student`
5. Utilisateurs avec mots de passe
6. **Client Scope** avec mappers pour username/email/roles
7. **Token lifespan** augmenté (60 min)

🎨 **Optionnels mais recommandés :**
- Thème personnalisé (déjà fait)
- Brute force protection
- Groupes pour organisation
- Email configuration

---

**Le plus important qui manque :** Les **Client Scopes** avec les mappers ! Sans ça, l'API Gateway ne reçoit pas les infos utilisateur (username, roles) dans le token JWT.
