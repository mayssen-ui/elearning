# Guide Configuration Keycloak

## Résumé
Configuration Keycloak pour authentification JWT. Realm `elearning`, clients `elearning-frontend` et `elearning-backend`.

---

## 1. Créer le Realm

1. Aller à : http://localhost:18080/admin (admin/admin)
2. Cliquer sur la flèche **"Master"** → **Create Realm**
3. Nom : `elearning`
4. Cliquer **Create**

---

## 2. Créer le Client Frontend (React)

1. Aller à **Clients** → **Create client**
2. **Client ID** : `elearning-frontend`
3. Cliquer **Next**
4. **Client authentication** : `OFF` (client public)
5. Cliquer **Next** → **Save**
6. Remplir :
   - **Root URL** : `http://localhost:5173`
   - **Home URL** : `http://localhost:5173`
   - **Valid redirect URIs** : `http://localhost:5173/*`
   - **Web origins** : `*`
7. Cliquer **Save**

---

## 3. Créer le Client Backend (Spring Boot)

1. Aller à **Clients** → **Create client**
2. **Client ID** : `elearning-backend`
3. Cliquer **Next**
4. Activer **Client authentication** → `ON`
5. Cliquer **Next** → **Save**
6. Onglet **Credentials**
7. Copier le **Client secret** pour configurer l'API Gateway

---

## 4. Créer les Rôles du Realm

1. Aller à **Realm roles** → **Create role**
2. Créer ces rôles :
   - `admin`
   - `instructor`
   - `student`

---

## 5. Créer les Utilisateurs

### Admin
1. Aller à **Users** → **Add user**
2. **Username** : `admin`
3. Cliquer **Create**
4. Onglet **Credentials** → **Set password** → `admin123` → désactiver **Temporary**
5. Onglet **Role mapping** → **Assign role** → sélectionner `admin` → **Assign**

### Étudiant
1. Aller à **Users** → **Add user**
2. **Username** : `testuser`
3. Cliquer **Create**
4. Onglet **Credentials** → **Set password** → `test123` → désactiver **Temporary**
5. Onglet **Role mapping** → **Assign role** → sélectionner `student` → **Assign**

---

## 6. Thème Personnalisé (Optionnel)

1. Dans le realm `elearning`, aller à **Realm settings** → **Themes**
2. **Login theme** : `premium-elearning`
3. **Account theme** : `premium-elearning`
4. Cliquer **Save**

> Le thème fonctionne si le dossier `premium-elearning` est présent dans le conteneur Keycloak.

---

## 7. Vérification

1. Ouvrir http://localhost:5173
2. Redirection vers la page Keycloak
3. Connexion `admin` / `admin123` → Interface admin
4. Connexion `testuser` / `test123` → Interface étudiant

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Realm introuvable | Vérifier le nom exact `elearning` (minuscules) |
| Redirection échoue | Vérifier **Valid redirect URIs** contient `http://localhost:5173/*` |
| Token invalide | Vérifier le **Client secret** correspond dans l'API Gateway |
| 401 sur toutes les requêtes | Vérifier l'URL Keycloak et le realm dans la config API Gateway |
