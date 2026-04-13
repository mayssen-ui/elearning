import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

const Dashboard = () => {
    const { keycloak } = useKeycloak();
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (keycloak.authenticated) {
            setLoading(true);
            
            Promise.all([
                axios.get("/api/users", {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }),
                axios.get("/api/courses", {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }),
                axios.get("/api/progress", {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                })
            ])
            .then(([usersRes, coursesRes, progressRes]) => {
                setUsers(usersRes.data);
                setCourses(coursesRes.data);
                setProgress(progressRes.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching data", err);
                setLoading(false);
            });
        }
    }, [keycloak.authenticated, keycloak.token]);

    const userSub = keycloak.tokenParsed?.sub;
    const isAdmin = keycloak.tokenParsed?.realm_access?.roles.includes('admin');
    
    // Calculer les statistiques réelles
    const myProgress = progress.filter((p: any) => p.userId === userSub);
    const completedCourses = myProgress.filter((p: any) => p.percentage === 100).length;
    const inProgressCourses = myProgress.filter((p: any) => p.percentage > 0 && p.percentage < 100).length;
    const averageProgress = myProgress.length > 0 
        ? Math.round(myProgress.reduce((acc: number, p: any) => acc + p.percentage, 0) / myProgress.length)
        : 0;

    const stats = [
        { 
            label: "Utilisateurs", 
            value: users.length, 
            icon: "👥", 
            color: "#8b5cf6",
            subtitle: "sur la plateforme"
        },
        { 
            label: "Cours disponibles", 
            value: courses.length, 
            icon: "📚", 
            color: "#3b82f6",
            subtitle: "actifs"
        },
        { 
            label: "Mes cours terminés", 
            value: completedCourses, 
            icon: "🏆", 
            color: "#10b981",
            subtitle: "certifiés"
        },
        { 
            label: "En cours", 
            value: inProgressCourses, 
            icon: "🚀", 
            color: "#f59e0b",
            subtitle: "à compléter"
        },
    ];

    return (
        <div className="container animate-fade-in">
            {/* Header amélioré */}
            <header style={{ marginBottom: "3rem", textAlign: "center" }}>
                <div style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "var(--glass)",
                    borderRadius: "100px",
                    marginBottom: "1rem",
                    border: "1px solid var(--glass-border)"
                }}>
                    <span style={{ fontSize: "1.2rem" }}>👋</span>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Bon retour</span>
                </div>
                <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                    <span className="text-gradient">{keycloak.tokenParsed?.preferred_username}</span>
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
                    Voici votre résumé d'activité et progression
                </p>
            </header>

            {/* Stats Cards Modernes */}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: "1.5rem", 
                marginBottom: "3rem" 
            }}>
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-card" style={{ padding: "1.5rem", opacity: 0.5 }}>
                            <div style={{ height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "1rem" }} />
                            <div style={{ height: "20px", width: "60%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                        </div>
                    ))
                ) : (
                    stats.map((stat, i) => (
                        <div key={i} className="glass-card" style={{ 
                            padding: "1.5rem",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            cursor: "pointer"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                            e.currentTarget.style.boxShadow = `0 20px 40px ${stat.color}20`;
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0) scale(1)";
                            e.currentTarget.style.boxShadow = "var(--shadow)";
                        }}>
                            {/* Barre de couleur en haut */}
                            <div style={{ 
                                position: "absolute", 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                height: "3px", 
                                background: stat.color 
                            }} />
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "2rem" }}>{stat.icon}</span>
                                <p style={{ 
                                    fontSize: "2rem", 
                                    fontWeight: "800", 
                                    color: stat.color,
                                    margin: 0
                                }}>{stat.value}</p>
                            </div>
                            <p style={{ 
                                fontSize: "0.9rem", 
                                color: "var(--text-muted)", 
                                marginBottom: "0.25rem" 
                            }}>{stat.label}</p>
                            <p style={{ 
                                fontSize: "0.75rem", 
                                color: stat.color,
                                opacity: 0.8
                            }}>{stat.subtitle}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Section de progression personnelle */}
            {!loading && myProgress.length > 0 && (
                <div className="glass-card" style={{ marginBottom: "3rem", padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.3rem" }}>📈 Ma Progression Globale</h2>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                            {averageProgress}% complété
                        </span>
                    </div>
                    
                    {/* Barre de progression globale */}
                    <div style={{ 
                        height: "12px", 
                        background: "rgba(0,0,0,0.3)", 
                        borderRadius: "6px", 
                        overflow: "hidden",
                        marginBottom: "1rem"
                    }}>
                        <div style={{
                            width: `${averageProgress}%`,
                            height: "100%",
                            background: averageProgress >= 75 ? "#10b981" : averageProgress >= 50 ? "#8b5cf6" : "#f59e0b",
                            borderRadius: "6px",
                            transition: "width 1s ease",
                            boxShadow: `0 0 20px ${averageProgress >= 75 ? "#10b981" : averageProgress >= 50 ? "#8b5cf6" : "#f59e0b"}60`
                        }} />
                    </div>
                    
                    <div style={{ display: "flex", gap: "2rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        <span>✓ {completedCourses} cours terminés</span>
                        <span>🚀 {inProgressCourses} en cours</span>
                        <span>📊 {myProgress.length} cours au total</span>
                    </div>
                </div>
            )}

            {/* Layout deux colonnes */}
            <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 2fr" : "1fr", gap: "2rem" }}>
                {/* Sidebar - visible seulement pour admin */}
                {isAdmin && (
                    <aside>
                        <div className="glass-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ 
                                marginBottom: "1.5rem", 
                                borderBottom: "1px solid var(--glass-border)", 
                                paddingBottom: "0.5rem",
                                fontSize: "1.1rem"
                            }}>
                                👥 Annuaire Utilisateurs
                            </h3>
                            
                            {loading ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} style={{ 
                                            height: "50px", 
                                            background: "rgba(255,255,255,0.05)", 
                                            borderRadius: "8px" 
                                        }} />
                                    ))}
                                </div>
                            ) : users.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {users.slice(0, 5).map((user: any) => (
                                        <div key={user.id} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            padding: "0.75rem",
                                            background: "rgba(255,255,255,0.02)",
                                            borderRadius: "8px",
                                            border: "1px solid var(--glass-border)"
                                        }}>
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
                                                {user.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ 
                                                    fontWeight: "600", 
                                                    fontSize: "0.9rem",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>{user.username}</p>
                                                <p style={{ 
                                                    fontSize: "0.75rem", 
                                                    color: "var(--text-muted)",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>{user.email}</p>
                                            </div>
                                            <span style={{
                                                fontSize: "0.65rem",
                                                padding: "0.2rem 0.4rem",
                                                borderRadius: "4px",
                                                background: (user.role || 'student') === 'admin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                                color: (user.role || 'student') === 'admin' ? 'var(--secondary)' : 'var(--primary)',
                                                textTransform: "uppercase",
                                                fontWeight: "bold"
                                            }}>
                                                {user.role || 'student'}
                                            </span>
                                        </div>
                                    ))}
                                    {users.length > 5 && (
                                        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                            +{users.length - 5} autres utilisateurs
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem" }}>
                                    Aucun utilisateur trouvé
                                </p>
                            )}
                        </div>
                    </aside>
                )}

                {/* Section Cours Récents */}
                <main>
                    <div className="glass-card" style={{ padding: "2rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                            <h2 style={{ fontSize: "1.3rem" }}>📚 Cours Récents</h2>
                            <a href="/courses" style={{ fontSize: "0.9rem", color: "var(--primary)" }}>Voir tous →</a>
                        </div>

                        {loading ? (
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ 
                                        height: "80px", 
                                        background: "rgba(255,255,255,0.05)", 
                                        borderRadius: "12px" 
                                    }} />
                                ))}
                            </div>
                        ) : courses.length > 0 ? (
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {courses.slice(0, 3).map((course: any, index: number) => {
                                    const courseProgress = myProgress.find((p: any) => p.courseId === course.id);
                                    const progressPercent = courseProgress?.percentage || 0;
                                    
                                    return (
                                        <div key={course.id} style={{
                                            display: "flex",
                                            gap: "1rem",
                                            padding: "1rem",
                                            background: "rgba(255,255,255,0.02)",
                                            borderRadius: "12px",
                                            border: "1px solid var(--glass-border)",
                                            transition: "all 0.3s ease",
                                            cursor: "pointer"
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                            e.currentTarget.style.transform = "translateX(4px)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                            e.currentTarget.style.transform = "translateX(0)";
                                        }}>
                                            {/* Thumbnail */}
                                            <div style={{
                                                width: "60px",
                                                height: "60px",
                                                borderRadius: "10px",
                                                background: index % 2 === 0 ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "linear-gradient(135deg, #3b82f6, #10b981)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "1.5rem",
                                                flexShrink: 0
                                            }}>
                                                {index % 2 === 0 ? "🚀" : "📖"}
                                            </div>
                                            
                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{ 
                                                    fontSize: "1rem", 
                                                    fontWeight: "600",
                                                    marginBottom: "0.25rem",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>{course.title}</h3>
                                                <p style={{ 
                                                    fontSize: "0.8rem", 
                                                    color: "var(--text-muted)",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    marginBottom: "0.5rem"
                                                }}>{course.description || "Aucune description"}</p>
                                                
                                                {/* Mini barre de progression */}
                                                {progressPercent > 0 && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <div style={{ 
                                                            flex: 1, 
                                                            height: "4px", 
                                                            background: "rgba(0,0,0,0.3)", 
                                                            borderRadius: "2px",
                                                            maxWidth: "100px"
                                                        }}>
                                                            <div style={{
                                                                width: `${progressPercent}%`,
                                                                height: "100%",
                                                                background: progressPercent === 100 ? "#10b981" : "#8b5cf6",
                                                                borderRadius: "2px"
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: "0.7rem", color: progressPercent === 100 ? "#10b981" : "var(--text-muted)" }}>
                                                            {progressPercent}%
                                                        </span>
                                                    </div>
                                                )}
                                                {!courseProgress && (
                                                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                        🆕 Pas encore commencé
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "3rem" }}>
                                <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                                    Aucun cours disponible pour le moment.
                                </p>
                                <a href="/courses"><button>Découvrir les cours</button></a>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
