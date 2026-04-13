import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Progress from "./pages/Progress";
import Feedback from "./pages/Feedback";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import Chat from "./pages/Chat";
import Analytics from "./pages/Analytics";
import Badges from "./pages/Badges";
import Leaderboard from "./pages/Leaderboard";
import PrivateRoute from "./components/PrivateRoute";
import { ThemeProvider } from "./components/ThemeContext";

// Synchroniser l'utilisateur Keycloak vers le backend H2
const syncUserWithBackend = async (token: string) => {
    try {
        const username = keycloak.tokenParsed?.preferred_username || keycloak.subject;
        const email = keycloak.tokenParsed?.email || '';
        const role = keycloak.realmAccess?.roles?.[0] || 'user';
        const keycloakId = keycloak.subject;

        await fetch(`/api/users/sync?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}&keycloakId=${encodeURIComponent(keycloakId)}`, {
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

function App() {
    return (
        <ThemeProvider>
            <ReactKeycloakProvider
                authClient={keycloak}
                initOptions={{
                    onLoad: 'check-sso',
                    checkLoginIframe: false,
                    responseMode: 'query',
                    pkceMethod: 'S256'
                }}
                onEvent={(event, error) => {
                    if (event === 'onAuthSuccess') {
                        syncUserWithBackend(keycloak.token || '');
                    }
                    if (event === 'onAuthLogout') {
                        window.location.href = '/';
                    }
                }}
            >
                <BrowserRouter>
                    <div className="app-container">
                        <Nav />
                        <main style={{ paddingTop: "2rem" }}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <PrivateRoute>
                                            <Dashboard />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/courses"
                                    element={
                                        <PrivateRoute>
                                            <Courses />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/progress"
                                    element={
                                        <PrivateRoute>
                                            <Progress />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/feedback"
                                    element={
                                        <PrivateRoute>
                                            <Feedback />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/notifications"
                                    element={
                                        <PrivateRoute>
                                            <Notifications />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/settings"
                                    element={
                                        <PrivateRoute>
                                            <Settings />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <PrivateRoute>
                                            <Profile />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/admin/users"
                                    element={
                                        <PrivateRoute>
                                            <AdminUsers />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/chat"
                                    element={
                                        <PrivateRoute>
                                            <Chat />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/analytics"
                                    element={
                                        <PrivateRoute>
                                            <Analytics />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/badges"
                                    element={
                                        <PrivateRoute>
                                            <Badges />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/leaderboard"
                                    element={
                                        <PrivateRoute>
                                            <Leaderboard />
                                        </PrivateRoute>
                                    }
                                />
                                {/* Catch-all route for any undefined paths, especially weird /* redirect */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>
                    </div>
                </BrowserRouter>
            </ReactKeycloakProvider>
        </ThemeProvider>
    );
}

export default App;
