import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:18080",
    realm: "elearning",
    clientId: "elearning-frontend",
});

export default keycloak;
