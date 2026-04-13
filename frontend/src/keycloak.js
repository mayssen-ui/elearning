import Keycloak from 'keycloak-js';

const keycloakConfig = {
  realm: 'elearning',
  clientId: 'elearning-frontend',
  url: 'http://localhost:18080',
  'ssl-required': 'none',
  'public-client': true,
  'verify-token-audience': true,
  'use-resource-role-mappings': true,
  'onLoad': 'check-sso'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;

export const initKeycloak = () => {
  return new Promise((resolve, reject) => {
    keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      silentCheckSsoFallback: false,
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })
      .then((authenticated) => {
        if (authenticated) {
          // Synchroniser l'utilisateur avec le backend H2
          syncUserWithBackend();
        }
        resolve(authenticated);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// Synchroniser l'utilisateur Keycloak vers le backend H2
const syncUserWithBackend = async () => {
  try {
    const token = keycloak.token;
    const username = keycloak.tokenParsed?.preferred_username || keycloak.subject;
    const email = keycloak.tokenParsed?.email || '';
    const role = keycloak.realmAccess?.roles?.[0] || 'user';
    const keycloakId = keycloak.subject;

    await fetch(`http://localhost:3000/api/users/sync?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}&keycloakId=${encodeURIComponent(keycloakId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ Utilisateur synchronisé avec le backend');
  } catch (error) {
    console.error('✗ Erreur de synchronisation:', error);
  }
};

export const isAuthenticated = () => {
  return keycloak.authenticated;
};

export const getRoles = () => {
  return keycloak.realmAccess?.roles || [];
};

export const hasRole = (role) => {
  return getRoles().includes(role);
};

export const getToken = () => {
  return keycloak.token;
};

export const login = () => {
  keycloak.login();
};

export const logout = () => {
  keycloak.logout({ redirectUri: 'http://localhost:5173' });
};

export const updateToken = (minValidity = 5) => {
  return keycloak.updateToken(minValidity);
};
