import { useKeycloak } from "@react-keycloak/web";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

const Nav = () => {
    const { keycloak } = useKeycloak();
    const { theme, toggleTheme } = useTheme();
    const isAdmin = keycloak.hasRealmRole("admin");
    const [unreadCount, setUnreadCount] = useState(0);
    const userSub = keycloak.tokenParsed?.sub;

    useEffect(() => {
        if (keycloak.authenticated && userSub) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 10000);
            return () => clearInterval(interval);
        }
    }, [keycloak.authenticated, userSub]);

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/users/${userSub}/unread/count`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count || 0);
            }
        } catch (error) {
            // Silently fail - chat service might not be running
        }
    };

    const handleResetBadge = async () => {
        try {
            // Mark all messages as read
            await fetch(`${API_BASE_URL}/api/chat/users/${userSub}/mark-all-read`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${keycloak.token}`
                }
            });
            setUnreadCount(0);
        } catch (error) {
            console.error('Error resetting badge:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" className="nav-link" style={{ fontSize: "1.5rem", fontWeight: "bold", opacity: 1 }}>
                    <span className="text-gradient">E-Learning Platform</span>
                </Link>
            </div>
            <div className="navbar-menu" style={{ display: "flex", alignItems: "center" }}>
                {!!keycloak.authenticated && (
                    <>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <Link to="/courses" className="nav-link">Courses</Link>
                        <Link to="/progress" className="nav-link">Progress</Link>
                        <Link to="/feedback" className="nav-link">Feedback</Link>
                        <Link to="/chat" className="nav-link">
                            💬 Chat
                            {unreadCount > 0 && (
                                <span style={{
                                    background: "#ef4444",
                                    color: "white",
                                    borderRadius: "50%",
                                    padding: "2px 6px",
                                    fontSize: "0.7rem",
                                    marginLeft: "4px",
                                    cursor: "pointer"
                                }} onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleResetBadge();
                                }} title="Click to reset badge">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/badges" className="nav-link">🏅 Badges</Link>
                        <Link to="/leaderboard" className="nav-link">🏆 Leaderboard</Link>
                        <Link to="/analytics" className="nav-link">📊 Analytics</Link>
                        <Link to="/notifications" className="nav-link">Notifications</Link>
                        <Link to="/profile" className="nav-link">Profile</Link>
                        {isAdmin && (
                            <Link to="/admin/users" className="nav-link" style={{ color: '#f59e0b' }}>👥 Admin</Link>
                        )}
                    </>
                )}

                <div style={{ marginLeft: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--glass-border)",
                            padding: "0.5rem",
                            minWidth: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text)"
                        }}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {!keycloak.authenticated && (
                        <>
                            <button className="btn-glass" onClick={() => keycloak.login()} style={{ padding: "0.6rem 1.5rem", fontSize: "0.9rem" }}>
                                Login
                            </button>
                        </>
                    )}

                    {!!keycloak.authenticated && (
                        <button onClick={async () => { 
                            await keycloak.logout({ redirectUri: window.location.origin + '/' }); 
                        }} style={{ background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem" }}>
                            Logout ({keycloak.tokenParsed?.preferred_username})
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Nav;
