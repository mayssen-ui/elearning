import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

interface LeaderboardEntry {
    rank: number;
    userId: string;
    totalPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    level: number;
    learningPoints: number;
    socialPoints: number;
    achievementPoints: number;
}

const RANK_COLORS = ["#f59e0b", "#9ca3af", "#b45309", "#6366f1"];
const RANK_ICONS = ["🥇", "🥈", "🥉", ""];

const Leaderboard = () => {
    const { keycloak } = useKeycloak();
    const userSub = keycloak.tokenParsed?.sub;

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<any>(null);
    const [userStats, setUserStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"total" | "weekly" | "monthly">("total");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (keycloak.authenticated) {
            loadData();
        }
    }, [keycloak.authenticated, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [leaderboardRes, rankRes, statsRes] = await Promise.all([
                axios.get(`/api/leaderboard?type=${activeTab}&limit=20`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: { leaderboard: [] } })),
                axios.get(`/api/leaderboard/users/${userSub}/rank`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: null })),
                axios.get(`/api/leaderboard/users/${userSub}/stats`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: null })),
            ]);

            setLeaderboard(leaderboardRes.data?.leaderboard || []);
            setUserRank(rankRes.data);
            setUserStats(statsRes.data);
        } catch (error) {
            console.error("Error loading leaderboard:", error);
        }
        setLoading(false);
    };

    const getLevelTitle = (level: number) => {
        if (level >= 20) return "🎓 Maître";
        if (level >= 15) return "🏆 Expert";
        if (level >= 10) return "⭐ Vétéran";
        if (level >= 7) return "🌟 Avancé";
        if (level >= 5) return "📚 Intermédiaire";
        if (level >= 3) return "🌱 Apprenti";
        return "🌱 Novice";
    };

    const getPointsForTab = (entry: LeaderboardEntry) => {
        switch (activeTab) {
            case "weekly": return entry.weeklyPoints;
            case "monthly": return entry.monthlyPoints;
            default: return entry.totalPoints;
        }
    };

    const isCurrentUser = (userId: string) => userId === userSub;

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "2rem", textAlign: "center" }}>
                <h1 className="text-gradient">🏆 Classement & Gamification</h1>
                <p style={{ color: "var(--text-muted)" }}>
                    Gagnez des points et grimpez dans le classement!
                </p>
            </header>

            {userRank && (
                <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "2rem",
                        textAlign: "center"
                    }}>
                        <div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#f59e0b" }}>
                                #{userRank.totalRank}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Classement global</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                sur {userRank.totalParticipants} participants
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#8b5cf6" }}>
                                {userRank.level}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Niveau</div>
                            <div style={{ fontSize: "0.75rem", color: "#8b5cf6", marginTop: "0.25rem" }}>
                                {getLevelTitle(userRank.level)}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#3b82f6" }}>
                                {userRank.totalPoints?.toLocaleString()}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Points totaux</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#10b981" }}>
                                {userRank.percentile}%
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Percentile</div>
                        </div>
                    </div>

                    {userStats?.levelProgress && (
                        <div style={{ marginTop: "2rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.9rem" }}>
                                    Progression vers niveau {userStats.levelProgress.nextLevel}
                                </span>
                                <span style={{ fontSize: "0.9rem", color: "#8b5cf6" }}>
                                    {userStats.levelProgress.pointsNeeded} points restants
                                </span>
                            </div>
                            <div style={{ 
                                height: "12px", 
                                background: "rgba(0,0,0,0.3)", 
                                borderRadius: "6px",
                                overflow: "hidden"
                            }}>
                                <div style={{
                                    width: `${userStats.levelProgress.progressPercentage}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                                    borderRadius: "6px",
                                    transition: "width 0.5s ease"
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
                <button 
                    onClick={() => setActiveTab("total")}
                    style={{ 
                        background: activeTab === "total" ? "var(--primary)" : "var(--surface)",
                        minWidth: "120px"
                    }}
                >
                    🏆 Global
                </button>
                <button 
                    onClick={() => setActiveTab("weekly")}
                    style={{ 
                        background: activeTab === "weekly" ? "var(--primary)" : "var(--surface)",
                        minWidth: "120px"
                    }}
                >
                    📅 Cette semaine
                </button>
                <button 
                    onClick={() => setActiveTab("monthly")}
                    style={{ 
                        background: activeTab === "monthly" ? "var(--primary)" : "var(--surface)",
                        minWidth: "120px"
                    }}
                >
                    📆 Ce mois
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                    <p>Chargement du classement...</p>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid var(--glass-border)" }}>
                                <th style={{ padding: "1rem", textAlign: "center" }}>Rang</th>
                                <th style={{ padding: "1rem", textAlign: "left" }}>Utilisateur</th>
                                <th style={{ padding: "1rem", textAlign: "center" }}>Niveau</th>
                                <th style={{ padding: "1rem", textAlign: "right" }}>Points</th>
                                <th style={{ padding: "1rem", textAlign: "right" }}>📚</th>
                                <th style={{ padding: "1rem", textAlign: "right" }}>💬</th>
                                <th style={{ padding: "1rem", textAlign: "right" }}>🏅</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => {
                                const isMe = isCurrentUser(entry.userId);
                                return (
                                    <tr 
                                        key={entry.rank}
                                        style={{ 
                                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                                            background: isMe ? "rgba(99, 102, 241, 0.15)" : "transparent",
                                        }}
                                    >
                                        <td style={{ padding: "1rem", textAlign: "center" }}>
                                            <span style={{ 
                                                fontSize: "1.5rem",
                                                color: RANK_COLORS[entry.rank - 1] || "var(--text)"
                                            }}>
                                                {RANK_ICONS[entry.rank - 1] || `#${entry.rank}`}
                                            </span>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <div style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    borderRadius: "50%",
                                                    background: "var(--gradient)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "0.9rem",
                                                    fontWeight: "bold"
                                                }}>
                                                    {entry.userId?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: "500" }}>
                                                        {entry.userId === userSub ? "Vous" : `Utilisateur ${entry.userId?.substring(0, 8)}`}
                                                    </div>
                                                    {isMe && (
                                                        <div style={{ fontSize: "0.75rem", color: "#8b5cf6" }}>
                                                            C'est vous!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "center" }}>
                                            <span style={{
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "100px",
                                                fontSize: "0.8rem",
                                                background: entry.level >= 10 ? "#f59e0b30" : entry.level >= 5 ? "#8b5cf630" : "#3b82f630",
                                                color: entry.level >= 10 ? "#f59e0b" : entry.level >= 5 ? "#8b5cf6" : "#3b82f6",
                                            }}>
                                                {entry.level}
                                            </span>
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", color: "#f59e0b" }}>
                                            {getPointsForTab(entry).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "right", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                            {entry.learningPoints?.toLocaleString()}
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "right", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                            {entry.socialPoints?.toLocaleString()}
                                        </td>
                                        <td style={{ padding: "1rem", textAlign: "right", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                            {entry.achievementPoints?.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {leaderboard.length === 0 && (
                        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                            Aucun participant dans ce classement pour l'instant.
                        </div>
                    )}
                </div>
            )}

            {userStats?.pointsByCategory && (
                <div className="glass-card" style={{ padding: "1.5rem", marginTop: "2rem" }}>
                    <h3 style={{ marginBottom: "1rem" }}>📊 Répartition de vos points</h3>
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem"
                    }}>
                        {Object.entries(userStats.pointsByCategory).map(([category, points]: [string, any]) => (
                            <div 
                                key={category}
                                style={{
                                    padding: "1rem",
                                    background: "rgba(255,255,255,0.03)",
                                    borderRadius: "8px",
                                    textAlign: "center"
                                }}
                            >
                                <div style={{ 
                                    fontSize: "1.5rem", 
                                    marginBottom: "0.5rem",
                                    textTransform: "capitalize"
                                }}>
                                    {category === "learning" ? "📚" : category === "social" ? "💬" : category === "engagement" ? "🔥" : "🏅"}
                                </div>
                                <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                                    {points.toLocaleString()} pts
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                                    {category}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card" style={{ padding: "1.5rem", marginTop: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>💡 Comment gagner des points</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                    <div style={{ padding: "1rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
                        <strong style={{ color: "#10b981" }}>📚 Apprentissage</strong>
                        <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
                            <li>Terminer un cours: +100 pts</li>
                            <li>Commencer un cours: +10 pts</li>
                            <li>Regarder une vidéo: +5 pts</li>
                            <li>Télécharger un PDF: +3 pts</li>
                        </ul>
                    </div>
                    <div style={{ padding: "1rem", background: "rgba(236, 72, 153, 0.1)", borderRadius: "8px" }}>
                        <strong style={{ color: "#ec4899" }}>💬 Social</strong>
                        <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
                            <li>Envoyer un message: +2 pts</li>
                            <li>Donner un feedback: +15 pts</li>
                            <li>Aider un autre étudiant: +25 pts</li>
                        </ul>
                    </div>
                    <div style={{ padding: "1rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "8px" }}>
                        <strong style={{ color: "#f59e0b" }}>🏅 Réalisations</strong>
                        <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
                            <li>Gagner un badge: +50 pts</li>
                            <li>Série 3 jours: +30 pts</li>
                            <li>Série 7 jours: +75 pts</li>
                            <li>Première connexion: +20 pts</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
