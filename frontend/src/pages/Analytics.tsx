import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";
import { API_BASE_URL } from "../config";

interface Activity {
    id: number;
    activityType: string;
    courseId?: number;
    durationSeconds: number;
    createdAt: string;
    metadata?: string;
}

interface DailyStats {
    statDate: string;
    activeUsers: number;
    newEnrollments: number;
    completedCourses: number;
    totalLearningTimeSeconds: number;
    messagesSent: number;
    feedbacksGiven: number;
}

const Analytics = () => {
    const { keycloak } = useKeycloak();
    const userSub = keycloak.tokenParsed?.sub;
    const isAdmin = keycloak.tokenParsed?.realm_access?.roles.includes('admin');

    const [userStats, setUserStats] = useState<any>(null);
    const [globalStats, setGlobalStats] = useState<any>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"personal" | "global">(isAdmin ? "personal" : "personal");
    const [courses, setCourses] = useState<any[]>([]);

    useEffect(() => {
        if (keycloak.authenticated) {
            loadData();
        }
    }, [keycloak.authenticated]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [userStatsRes, activitiesRes, coursesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/analytics/users/${userSub}/stats`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: null })),
                axios.get(`${API_BASE_URL}/api/analytics/users/${userSub}/activities`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/api/courses`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: [] })),
            ]);

            setUserStats(userStatsRes.data);
            setActivities(activitiesRes.data.slice(0, 20));
            setCourses(coursesRes.data);

            if (isAdmin) {
                const [globalRes, dailyRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/analytics/global`, {
                        headers: { Authorization: `Bearer ${keycloak.token}` },
                    }).catch(() => ({ data: null })),
                    axios.get(`${API_BASE_URL}/api/analytics/daily?days=30`, {
                        headers: { Authorization: `Bearer ${keycloak.token}` },
                    }).catch(() => ({ data: [] })),
                ]);
                setGlobalStats(globalRes.data);
                setDailyStats(dailyRes.data);
            }
        } catch (error) {
            console.error("Error loading analytics:", error);
        }
        setLoading(false);
    };

    const trackActivity = async (activityType: string, duration: number = 0, courseId?: number) => {
        try {
            await axios.post(`${API_BASE_URL}/api/analytics/activities`, {
                userId: userSub,
                activityType,
                durationSeconds: duration,
                courseId,
            }, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            await loadData();
        } catch (error) {
            console.error("Error tracking activity:", error);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "COURSE_START": return "📚";
            case "COURSE_COMPLETE": return "🎓";
            case "VIDEO_WATCH": return "🎥";
            case "PDF_DOWNLOAD": return "📄";
            case "FEEDBACK_GIVE": return "⭐";
            case "MESSAGE_SEND": return "💬";
            case "STREAK_DAYS": return "🔥";
            default: return "📊";
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "COURSE_COMPLETE": return "#10b981";
            case "COURSE_START": return "#3b82f6";
            case "VIDEO_WATCH": return "#8b5cf6";
            case "PDF_DOWNLOAD": return "#6366f1";
            case "FEEDBACK_GIVE": return "#f59e0b";
            case "MESSAGE_SEND": return "#ec4899";
            case "STREAK_DAYS": return "#ef4444";
            default: return "#64748b";
        }
    };

    const renderPersonalStats = () => (
        <>
            {userStats && (
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                    gap: "1.5rem",
                    marginBottom: "2rem"
                }}>
                    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⏱️</div>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>
                            {userStats.learningTimeWeekMinutes || 0}m
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Cette semaine</div>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎓</div>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                            {userStats.coursesCompleted || 0}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Cours terminés</div>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📚</div>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#8b5cf6" }}>
                            {userStats.coursesStarted || 0}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Cours commencés</div>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📄</div>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" }}>
                            {userStats.pdfsDownloaded || 0}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>PDFs téléchargés</div>
                    </div>
                </div>
            )}

            <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>📊 Activités récentes</h3>
                {activities.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
                        Aucune activité enregistrée. Commencez à apprendre!
                    </p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {activities.map(activity => (
                            <div 
                                key={activity.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    padding: "0.75rem",
                                    background: "rgba(255,255,255,0.03)",
                                    borderRadius: "8px",
                                    borderLeft: `3px solid ${getActivityColor(activity.activityType)}`,
                                }}
                            >
                                <span style={{ fontSize: "1.5rem" }}>{getActivityIcon(activity.activityType)}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "500", textTransform: "capitalize" }}>
                                        {activity.activityType.replace(/_/g, " ").toLowerCase()}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        {new Date(activity.createdAt).toLocaleString("fr-FR")}
                                    </div>
                                </div>
                                {activity.durationSeconds > 0 && (
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                        {formatDuration(activity.durationSeconds)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>⚡ Actions rapides</h3>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button onClick={() => trackActivity("VIDEO_WATCH", 300)} style={{ fontSize: "0.85rem" }}>
                        🎥 Regarder vidéo (+5min)
                    </button>
                    <button onClick={() => trackActivity("PDF_DOWNLOAD")} style={{ fontSize: "0.85rem" }}>
                        📄 Télécharger PDF
                    </button>
                    <button onClick={() => trackActivity("FEEDBACK_GIVE")} style={{ fontSize: "0.85rem" }}>
                        ⭐ Donner avis
                    </button>
                    <button onClick={() => trackActivity("MESSAGE_SEND")} style={{ fontSize: "0.85rem" }}>
                        💬 Envoyer message
                    </button>
                </div>
            </div>
        </>
    );

    const renderGlobalStats = () => (
        <>
            {globalStats && (
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                    gap: "1.5rem",
                    marginBottom: "2rem"
                }}>
                    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>👥</div>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>
                            {globalStats.activeUsersWeek || 0}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Utilisateurs actifs (7j)</div>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⏱️</div>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>
                            {globalStats.totalLearningTimeHours || 0}h
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Temps d'apprentissage (30j)</div>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📈</div>
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#8b5cf6" }}>
                            {globalStats.activeUsersMonth || 0}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Utilisateurs actifs (30j)</div>
                    </div>
                </div>
            )}

            {dailyStats.length > 0 && (
                <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                    <h3 style={{ marginBottom: "1rem" }}>📅 Statistiques quotidiennes (30 derniers jours)</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                    <th style={{ textAlign: "left", padding: "0.75rem" }}>Date</th>
                                    <th style={{ textAlign: "center", padding: "0.75rem" }}>Utilisateurs</th>
                                    <th style={{ textAlign: "center", padding: "0.75rem" }}>Inscriptions</th>
                                    <th style={{ textAlign: "center", padding: "0.75rem" }}>Terminés</th>
                                    <th style={{ textAlign: "center", padding: "0.75rem" }}>Messages</th>
                                    <th style={{ textAlign: "center", padding: "0.75rem" }}>Feedbacks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyStats.slice(0, 10).map(stat => (
                                    <tr key={stat.statDate} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <td style={{ padding: "0.75rem" }}>
                                            {new Date(stat.statDate).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td style={{ textAlign: "center", padding: "0.75rem" }}>{stat.activeUsers}</td>
                                        <td style={{ textAlign: "center", padding: "0.75rem" }}>{stat.newEnrollments}</td>
                                        <td style={{ textAlign: "center", padding: "0.75rem" }}>{stat.completedCourses}</td>
                                        <td style={{ textAlign: "center", padding: "0.75rem" }}>{stat.messagesSent}</td>
                                        <td style={{ textAlign: "center", padding: "0.75rem" }}>{stat.feedbacksGiven}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "2rem", textAlign: "center" }}>
                <h1 className="text-gradient">📊 Analytics & Statistiques</h1>
                <p style={{ color: "var(--text-muted)" }}>
                    Suivez votre progression et les statistiques de la plateforme
                </p>
            </header>

            {isAdmin && (
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
                    <button 
                        onClick={() => setActiveTab("personal")}
                        style={{ 
                            background: activeTab === "personal" ? "var(--primary)" : "var(--surface)",
                            minWidth: "150px"
                        }}
                    >
                        👤 Personnel
                    </button>
                    <button 
                        onClick={() => setActiveTab("global")}
                        style={{ 
                            background: activeTab === "global" ? "var(--primary)" : "var(--surface)",
                            minWidth: "150px"
                        }}
                    >
                        🌍 Global
                    </button>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                    <p>Chargement des statistiques...</p>
                </div>
            ) : (
                activeTab === "personal" ? renderPersonalStats() : renderGlobalStats()
            )}
        </div>
    );
};

export default Analytics;

// Updated to use API_BASE_URL
