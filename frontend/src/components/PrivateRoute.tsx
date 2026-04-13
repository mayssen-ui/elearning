import { useKeycloak } from "@react-keycloak/web";
import { useEffect } from "react";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const { keycloak, initialized } = useKeycloak();

    useEffect(() => {
        if (initialized && !keycloak.authenticated) {
            keycloak.login();
        }
    }, [initialized, keycloak]);

    if (!initialized || !keycloak.authenticated) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: 'white',
                background: 'var(--background)'
            }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '1rem' }}>
                    {!initialized ? "Initializing Security..." : "Redirecting to Login..."}
                </p>
            </div>
        );
    }

    return children;
};

export default PrivateRoute;
