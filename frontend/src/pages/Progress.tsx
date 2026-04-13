import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

interface Course {
    id: number;
    title: string;
    description?: string;
    lessons?: number;
}

interface ProgressItem {
    id: number;
    userId: string;
    courseId: number;
    percentage: number;
    completedLessons?: number;
    totalLessons?: number;
    lastAccessed?: string;
    createdAt?: string;
}

const Progress = () => {
    const { keycloak } = useKeycloak();
    const [progress, setProgress] = useState<ProgressItem[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProgress, setEditingProgress] = useState<ProgressItem | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');

    const fetchData = async () => {
        try {
            const [progressRes, coursesRes] = await Promise.all([
                axios.get("/api/progress", {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }),
                axios.get("/api/courses", {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                })
            ]);
            const userSub = keycloak.tokenParsed?.sub;
            const isAdmin = keycloak.tokenParsed?.realm_access?.roles.includes('admin');
            // Admins see all progress, regular users see only their own
            const filteredProgress = isAdmin 
                ? progressRes.data 
                : progressRes.data.filter((p: any) => p.userId === userSub);
            setProgress(filteredProgress);
            setCourses(coursesRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching progress data", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (keycloak.authenticated) {
            fetchData();
        }
    }, [keycloak.authenticated, keycloak.token]);

    // Listen for progress updates from other components (Courses page)
    useEffect(() => {
        const handleProgressUpdate = (event: CustomEvent) => {
            console.log('Progress updated from Courses, refreshing progress:', event.detail);
            fetchData();
        };
        window.addEventListener('progressUpdated', handleProgressUpdate as EventListener);
        return () => {
            window.removeEventListener('progressUpdated', handleProgressUpdate as EventListener);
        };
    }, []);

    const handleDeleteProgress = async (id: number) => {
        if (!window.confirm('Reset this course progress?')) return;
        try {
            await axios.delete(`/api/progress/${id}`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting progress:', error);
        }
    };

    const sendNotification = async (type: string, courseId?: number, extra?: Record<string, any>) => {
        try {
            const userId = keycloak.tokenParsed?.sub;
            if (!userId) return;
            await axios.post('/api/notifications', {
                type, userId, courseId, ...extra,
            }, { headers: { Authorization: `Bearer ${keycloak.token}` } });
        } catch { /* silent */ }
    };

    const handleUpdateProgress = async (e: React.FormEvent) => {
        e.preventDefault();
        const pct = editingProgress.percentage;
        const courseId = editingProgress.courseId;
        try {
            // Backend automatically updates if exists (by userId+courseId) or creates new
            await axios.post(`/api/progress`, {
                userId: keycloak.tokenParsed?.sub,
                courseId,
                percentage: pct,
            }, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            setEditingProgress(null);
            await fetchData();
            // Notify other components (like Courses) that progress has changed
            window.dispatchEvent(new CustomEvent('progressUpdated', { detail: { courseId, percentage: pct } }));
            // Send milestone notification for 25, 50, 75 %
            if ([25, 50, 75].includes(pct)) {
                await sendNotification('progress', courseId, { percentage: pct });
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const isAdmin = keycloak.tokenParsed?.realm_access?.roles.includes('admin');

    const getCourseName = (id: number) => {
        const course = courses.find((c) => c.id === id);
        return course ? course.title : `Course #${id}`;
    };

    const getCourseLessons = (id: number) => {
        const course = courses.find((c) => c.id === id);
        return course?.lessons || 15; // Default fallback
    };

    const calculateLessonsCompleted = (percentage: number, totalLessons: number) => {
        return Math.round((percentage / 100) * totalLessons);
    };

    const getProgressColor = (percentage: number) => {
        if (percentage === 100) return { bg: "#10b981", gradient: "linear-gradient(90deg, #10b981, #34d399)", color: "#10b981" };
        if (percentage >= 75) return { bg: "#8b5cf6", gradient: "linear-gradient(90deg, #8b5cf6, #a78bfa)", color: "#8b5cf6" };
        if (percentage >= 50) return { bg: "#3b82f6", gradient: "linear-gradient(90deg, #3b82f6, #60a5fa)", color: "#3b82f6" };
        if (percentage >= 25) return { bg: "#f59e0b", gradient: "linear-gradient(90deg, #f59e0b, #fbbf24)", color: "#f59e0b" };
        return { bg: "#ef4444", gradient: "linear-gradient(90deg, #ef4444, #f87171)", color: "#ef4444" };
    };

    const getStatusLabel = (percentage: number) => {
        if (percentage === 100) return { text: "Terminé", icon: "🏆", color: "#10b981" };
        if (percentage >= 75) return { text: "Presque fini", icon: "🔥", color: "#8b5cf6" };
        if (percentage >= 50) return { text: "En bonne voie", icon: "📈", color: "#3b82f6" };
        if (percentage >= 25) return { text: "En cours", icon: "📚", color: "#f59e0b" };
        return { text: "Démarré", icon: "🌱", color: "#ef4444" };
    };

    const filteredProgress = progress.filter((item) => {
        if (activeTab === 'completed') return item.percentage === 100;
        if (activeTab === 'in-progress') return item.percentage < 100;
        return true;
    });

    const completedCount = progress.filter((p) => p.percentage === 100).length;
    const inProgressCount = progress.filter((p) => p.percentage > 0 && p.percentage < 100).length;
    const averageProgress = progress.length > 0 
        ? Math.round(progress.reduce((acc, p) => acc + p.percentage, 0) / progress.length) 
        : 0;

    const stats = [
        { label: "Cours terminés", value: completedCount, icon: "🏆", color: "#10b981", trend: "+2 cette semaine" },
        { label: "En cours", value: inProgressCount, icon: "📚", color: "#8b5cf6", trend: "Continuez !" },
        { label: "Progression moyenne", value: `${averageProgress}%`, icon: "📊", color: "#3b82f6", trend: "Global" },
        { label: "Série d'apprentissage", value: "🔥 5 jours", icon: "⚡", color: "#f59e0b", trend: "Streak actif" },
    ];

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                    Academic <span className="text-gradient">Portfolio</span>
                </h1>
                <p style={{ color: "var(--text-muted)" }}>Track your milestones, progress, and professional growth.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card" style={{ 
                        textAlign: "center", 
                        padding: "1.5rem",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = `0 20px 40px ${stat.color}20`;
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "var(--shadow)";
                    }}>
                        <div style={{ 
                            position: "absolute", 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            height: "3px", 
                            background: stat.color 
                        }} />
                        <div style={{ 
                            fontSize: "2.5rem", 
                            marginBottom: "0.5rem",
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
                        }}>{stat.icon}</div>
                        <p style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "0.25rem", color: stat.color }}>{stat.value}</p>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{stat.label}</p>
                        <span style={{ fontSize: "0.75rem", color: stat.color, opacity: 0.8 }}>{stat.trend}</span>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                {[
                    { key: 'all', label: 'Tous les cours', count: progress.length },
                    { key: 'in-progress', label: 'En cours', count: inProgressCount },
                    { key: 'completed', label: 'Terminés', count: completedCount }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        style={{
                            padding: "0.75rem 1.5rem",
                            borderRadius: "var(--radius)",
                            border: "1px solid var(--glass-border)",
                            background: activeTab === tab.key ? "var(--gradient)" : "var(--surface)",
                            color: activeTab === tab.key ? "white" : "var(--text)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontWeight: "600"
                        }}
                    >
                        {tab.label}
                        <span style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "100px",
                            background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "var(--glass)",
                            fontSize: "0.75rem"
                        }}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {editingProgress && (
                <div className="glass-card" style={{ marginBottom: "3rem", maxWidth: "500px" }}>
                    <h2 style={{ marginBottom: "1.5rem" }}>Edit Progress: {getCourseName(editingProgress.courseId)}</h2>
                    <form onSubmit={handleUpdateProgress}>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Completion Percentage ({editingProgress.percentage}%)</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={editingProgress.percentage}
                                onChange={(e) => setEditingProgress({ ...editingProgress, percentage: parseInt(e.target.value) })}
                                style={{ width: "100%", accentColor: "var(--primary)" }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button type="submit">Update</button>
                            <button type="button" onClick={() => setEditingProgress(null)} style={{ background: "var(--surface)" }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1.5rem" }}>📚 Mes Cours</h2>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        {filteredProgress.length} cours {activeTab !== 'all' && `• ${activeTab === 'completed' ? 'terminés' : 'en cours'}`}
                    </span>
                </div>
                
                {loading ? (
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius)", border: "1px solid var(--glass-border)" }}>
                                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                    <div style={{ width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: "20px", width: "200px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "0.5rem" }} />
                                        <div style={{ height: "12px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProgress.length > 0 ? (
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        {filteredProgress.map((item) => {
                            const totalLessons = getCourseLessons(item.courseId);
                            const completedLessons = calculateLessonsCompleted(item.percentage, totalLessons);
                            const status = getStatusLabel(item.percentage);
                            const colors = getProgressColor(item.percentage);
                            
                            return (
                                <div key={item.id} style={{
                                    padding: "1.5rem",
                                    background: "rgba(255,255,255,0.02)",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--glass-border)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1rem",
                                    transition: "all 0.3s ease",
                                    cursor: "pointer"
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                    e.currentTarget.style.transform = "translateX(8px)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                    e.currentTarget.style.transform = "translateX(0)";
                                }}>
                                    {/* Header avec titre et badge */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                            {/* Icône de cours */}
                                            <div style={{
                                                width: "50px",
                                                height: "50px",
                                                borderRadius: "12px",
                                                background: colors.gradient,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "1.5rem",
                                                boxShadow: `0 8px 16px ${colors.bg}40`
                                            }}>
                                                {status.icon}
                                            </div>
                                            
                                            <div>
                                                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.25rem" }}>
                                                    {getCourseName(item.courseId)}
                                                </h3>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                                                    <span style={{ color: colors.color }}>{status.text}</span>
                                                    <span style={{ color: "var(--text-muted)" }}>•</span>
                                                    <span style={{ color: "var(--text-muted)" }}>{completedLessons}/{totalLessons} leçons</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Actions admin */}
                                        {isAdmin && (
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingProgress(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                                                    style={{ padding: "0.4rem", background: "rgba(255,255,255,0.1)", borderRadius: "8px", border: "none", cursor: "pointer" }}
                                                    title="Modifier">🔧</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProgress(item.id); }} 
                                                    style={{ padding: "0.4rem", background: "rgba(239, 68, 68, 0.2)", borderRadius: "8px", border: "none", cursor: "pointer", color: "#ef4444" }}
                                                    title="Supprimer">🗑️</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Barre de progrès */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
                                            <div style={{
                                                width: `${item.percentage}%`,
                                                background: colors.gradient,
                                                height: "100%",
                                                borderRadius: "5px",
                                                transition: "width 1s ease",
                                                boxShadow: `0 0 10px ${colors.bg}60`
                                            }} />
                                        </div>
                                        <span style={{ 
                                            fontWeight: "800", 
                                            fontSize: "1.1rem", 
                                            minWidth: "50px",
                                            color: colors.color
                                        }}>{item.percentage}%</span>
                                    </div>

                                    {/* Footer avec info temps */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        <div style={{ display: "flex", gap: "1rem" }}>
                                            <span>🕐 Dernière activité: {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                            {item.percentage < 100 && (
                                                <span style={{ color: colors.color }}>
                                                    ⚡ {Math.round((100 - item.percentage) / 10)} leçons restantes
                                                </span>
                                            )}
                                        </div>
                                        {item.percentage === 100 && (
                                            <span style={{ color: "#10b981", fontWeight: "600" }}>✓ Certificat disponible</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "4rem" }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🌱</div>
                        <h3 style={{ marginBottom: "0.5rem", fontSize: "1.3rem" }}>Aucun cours {activeTab === 'completed' ? 'terminé' : activeTab === 'in-progress' ? 'en cours' : ''}</h3>
                        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                            {activeTab === 'all' 
                                ? "Commencez votre parcours d'apprentissage dès maintenant !" 
                                : activeTab === 'completed' 
                                    ? "Terminez vos cours en cours pour les voir ici."
                                    : "Vous n'avez pas encore commencé de cours."}
                        </p>
                        <a href="/courses"><button style={{ padding: "0.75rem 2rem" }}>🚀 Découvrir les cours</button></a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Progress;
