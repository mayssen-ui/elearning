import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

interface Badge {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    color: string;
    requirementType: string;
    requirementValue: number;
}

interface UserBadge {
    id: number;
    badge: Badge;
    earnedAt: string;
    progressCurrent: number;
    isEarned: boolean;
}

const BADGE_CATEGORIES = {
    beginner: { label: "Débutant", color: "#22c55e" },
    learning: { label: "Apprentissage", color: "#3b82f6" },
    engagement: { label: "Engagement", color: "#ef4444" },
    social: { label: "Social", color: "#ec4899" },
    special: { label: "Spécial", color: "#8b5cf6" },
};

const Badges = () => {
    const { keycloak } = useKeycloak();
    const userSub = keycloak.tokenParsed?.sub;

    const [badges, setBadges] = useState<Badge[]>([]);
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [userStats, setUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    useEffect(() => {
        if (keycloak.authenticated) {
            loadData();
        }
    }, [keycloak.authenticated]);

    const loadData = async () => {
        setLoading(true);
        try {
            await axios.post("/api/badges/init", {}, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            }).catch(() => {});

            const [badgesRes, userBadgesRes, statsRes] = await Promise.all([
                axios.get("/api/badges", {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: [] })),
                axios.get(`/api/badges/users/${userSub}`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: [] })),
                axios.get(`/api/badges/users/${userSub}/stats`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: null })),
            ]);

            setBadges(badgesRes.data);
            setUserBadges(userBadgesRes.data);
            setUserStats(statsRes.data);
        } catch (error) {
            console.error("Error loading badges:", error);
        }
        setLoading(false);
    };

    const getUserBadgeForBadge = (badgeId: number): UserBadge | undefined => {
        return userBadges.find(ub => ub.badge.id === badgeId);
    };

    const getProgressPercentage = (badge: Badge, userBadge?: UserBadge) => {
        if (!userBadge) return 0;
        if (userBadge.isEarned) return 100;
        return Math.min(100, (userBadge.progressCurrent * 100) / badge.requirementValue);
    };

    const filteredBadges = selectedCategory === "all" 
        ? badges 
        : badges.filter(b => b.category === selectedCategory);

    const earnedCount = userBadges.filter(ub => ub.isEarned).length;
    const totalBadges = badges.length;

    const renderBadgeCard = (badge: Badge) => {
        const userBadge = getUserBadgeForBadge(badge.id);
        const isEarned = userBadge?.isEarned || false;
        const progress = getProgressPercentage(badge, userBadge);

        return (
            <div
                key={badge.id}
                style={{
                    padding: "1.5rem",
                    borderRadius: "12px",
                    background: isEarned 
                        ? `linear-gradient(135deg, ${badge.color}20, ${badge.color}10)`
                        : "rgba(255,255,255,0.03)",
                    border: `2px solid ${isEarned ? badge.color : "rgba(255,255,255,0.1)"}`,
                    position: "relative",
                    transition: "all 0.3s ease",
                    opacity: isEarned ? 1 : 0.7,
                }}
            >
                {isEarned && (
                    <div style={{
                        position: "absolute",
                        top: "-10px",
                        right: "-10px",
                        background: badge.color,
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                    }}>
                        ✓
                    </div>
                )}

                <div style={{ 
                    fontSize: "3rem", 
                    textAlign: "center", 
                    marginBottom: "1rem",
                    filter: isEarned ? "none" : "grayscale(100%)"
                }}>
                    {badge.icon}
                </div>

                <h4 style={{ textAlign: "center", marginBottom: "0.5rem", color: isEarned ? badge.color : "var(--text)" }}>
                    {badge.name}
                </h4>

                <p style={{ 
                    fontSize: "0.8rem", 
                    textAlign: "center", 
                    color: "var(--text-muted)",
                    marginBottom: "1rem",
                    minHeight: "40px"
                }}>
                    {badge.description}
                </p>

                <div style={{ 
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "100px",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    background: BADGE_CATEGORIES[badge.category as keyof typeof BADGE_CATEGORIES]?.color + "30",
                    color: BADGE_CATEGORIES[badge.category as keyof typeof BADGE_CATEGORIES]?.color,
                    marginBottom: "1rem",
                }}>
                    {BADGE_CATEGORIES[badge.category as keyof typeof BADGE_CATEGORIES]?.label || badge.category}
                </div>

                <div style={{ marginTop: "auto" }}>
                    <div style={{ 
                        height: "6px", 
                        background: "rgba(0,0,0,0.3)", 
                        borderRadius: "3px",
                        overflow: "hidden",
                        marginBottom: "0.5rem"
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: isEarned ? badge.color : "#64748b",
                            borderRadius: "3px",
                            transition: "width 0.5s ease"
                        }} />
                    </div>
                    <div style={{ 
                        fontSize: "0.75rem", 
                        textAlign: "center",
                        color: isEarned ? badge.color : "var(--text-muted)"
                    }}>
                        {isEarned 
                            ? `✓ Obtenu le ${new Date(userBadge!.earnedAt).toLocaleDateString("fr-FR")}`
                            : `${userBadge?.progressCurrent || 0} / ${badge.requirementValue}`
                        }
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "2rem", textAlign: "center" }}>
                <h1 className="text-gradient">🏅 Badges & Récompenses</h1>
                <p style={{ color: "var(--text-muted)" }}>
                    Collectionnez des badges en apprenant et interagissant
                </p>
            </header>

            {userStats && (
                <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem", textAlign: "center" }}>
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "2rem"
                    }}>
                        <div>
                            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#f59e0b" }}>
                                {earnedCount}/{totalBadges}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Badges collectés</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#8b5cf6" }}>
                                {userStats.completionPercentage || 0}%
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Complétion</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#10b981" }}>
                                {userStats.byCategory?.learning || 0}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Badges d'apprentissage</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#ec4899" }}>
                                {userStats.byCategory?.social || 0}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Badges sociaux</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                    onClick={() => setSelectedCategory("all")}
                    style={{ 
                        background: selectedCategory === "all" ? "var(--primary)" : "var(--surface)",
                        fontSize: "0.85rem",
                        padding: "0.5rem 1rem"
                    }}
                >
                    Tous
                </button>
                {Object.entries(BADGE_CATEGORIES).map(([key, { label, color }]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        style={{ 
                            background: selectedCategory === key ? color : "var(--surface)",
                            fontSize: "0.85rem",
                            padding: "0.5rem 1rem",
                            color: selectedCategory === key ? "white" : "var(--text)"
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                    <p>Chargement des badges...</p>
                </div>
            ) : (
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "1.5rem"
                }}>
                    {filteredBadges.map(renderBadgeCard)}
                </div>
            )}

            {userStats?.inProgress?.length > 0 && (
                <div className="glass-card" style={{ padding: "1.5rem", marginTop: "2rem" }}>
                    <h3 style={{ marginBottom: "1rem" }}>🎯 En cours de progression</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {userStats.inProgress.slice(0, 5).map((item: any) => (
                            <div 
                                key={item.badge.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    padding: "0.75rem",
                                    background: "rgba(255,255,255,0.03)",
                                    borderRadius: "8px",
                                }}
                            >
                                <span style={{ fontSize: "1.5rem", filter: "grayscale(100%)" }}>
                                    {item.badge.icon}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "500" }}>{item.badge.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        {item.current} / {item.required}
                                    </div>
                                </div>
                                <div style={{ 
                                    width: "100px",
                                    height: "6px",
                                    background: "rgba(0,0,0,0.3)",
                                    borderRadius: "3px",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        width: `${item.percentage}%`,
                                        height: "100%",
                                        background: item.badge.color,
                                        borderRadius: "3px"
                                    }} />
                                </div>
                                <span style={{ fontSize: "0.8rem", color: item.badge.color, minWidth: "40px", textAlign: "right" }}>
                                    {item.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Badges;
