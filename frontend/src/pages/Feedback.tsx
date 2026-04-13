import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

const Feedback = () => {
    const { keycloak } = useKeycloak();
    const [feedbacks, setFeedbacks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newFeedback, setNewFeedback] = useState({ content: '', rating: 5, courseId: null as number | null });
    const [editingFeedback, setEditingFeedback] = useState<any>(null);

    const fetchFeedbacks = async () => {
        if (!keycloak.authenticated) {
            setLoading(false);
            return;
        }
        try {
            // Récupérer les feedbacks
            const feedbacksResponse = await axios.get("/api/feedbacks", {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                },
            });
            
            // Récupérer les utilisateurs
            const usersResponse = await axios.get("/api/users", {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                },
            });
            
            setUsers(usersResponse.data);
            console.log('Users reçus:', usersResponse.data);
            console.log('Premier user:', usersResponse.data[0]);
            
            // Admins see all feedbacks, regular users see only their own
            const filteredFeedbacks = isAdmin 
                ? feedbacksResponse.data 
                : feedbacksResponse.data.filter((f: any) => f.userId === keycloak.tokenParsed?.sub);
            console.log('Feedbacks reçus:', filteredFeedbacks);
            console.log('Premier feedback userId:', filteredFeedbacks[0]?.userId);
            setFeedbacks(filteredFeedbacks);
        } catch (err) {
            console.error("Error fetching feedbacks", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, [keycloak.authenticated, keycloak.token]);

    const getUserName = (userId: string) => {
        if (!userId) return "Utilisateur inconnu";
        
        // Chercher l'utilisateur par keycloakId (UUID)
        let user = users.find((u: any) => u.keycloakId === userId);
        
        // Si pas trouvé, chercher par id (ID numérique interne H2)
        if (!user) {
            user = users.find((u: any) => u.id?.toString() === userId);
        }
        
        // Si toujours pas trouvé et que userId est numérique, chercher par id numérique
        if (!user && /^\d+$/.test(userId)) {
            const numericId = parseInt(userId, 10);
            user = users.find((u: any) => u.id === numericId);
        }
        
        // Si toujours pas trouvé, chercher par username exact
        if (!user) {
            user = users.find((u: any) => u.username === userId);
        }
        
        if (user) {
            const username = user.username || '';
            if (username.includes('@')) {
                return username.split('@')[0];
            }
            return username || `User ${user.id}`;
        }
        
        // Si pas trouvé dans H2, essayer d'utiliser le userId (souvent un email dans Keycloak)
        if (userId.includes('@')) {
            return userId.split('@')[0];
        }
        
        // Si c'est un UUID long (Keycloak ID), afficher un nom plus court
        if (userId.length > 20 && userId.includes('-')) {
            return `User ${userId.substring(0, 8)}...`;
        }
        
        // Si c'est un ID numérique
        if (/^\d+$/.test(userId)) {
            return `User ${userId}`;
        }
        
        return userId || "Utilisateur inconnu";
    };

    const getUserPhoto = (userId: string) => {
        if (!userId) return null;
        let user = users.find((u: any) => u.keycloakId === userId);
        if (!user) {
            user = users.find((u: any) => u.id?.toString() === userId);
        }
        if (!user) {
            user = users.find((u: any) => u.username === userId);
        }
        return user?.profilePicture || null;
    };

    const getUserInitials = (userId: string) => {
        const name = getUserName(userId);
        return name.charAt(0).toUpperCase();
    };

    const sendNotification = async (type: string, courseId?: number | null, extra?: Record<string, any>) => {
        try {
            const userId = keycloak.tokenParsed?.sub;
            if (!userId) return;
            await axios.post('/api/notifications', {
                type, userId, courseId, ...extra,
            }, { headers: { Authorization: `Bearer ${keycloak.token}` } });
        } catch { /* silent */ }
    };

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const feedbackData = {
                userId: keycloak.tokenParsed?.sub,
                rating: newFeedback.rating,
                comment: newFeedback.content,
                courseId: newFeedback.courseId,
                type: 'MANUAL',
            };
            console.log('Sending feedback data:', feedbackData);
            console.log('User ID:', keycloak.tokenParsed?.sub);
            console.log('New feedback:', newFeedback);
            
            await axios.post('/api/feedbacks', feedbackData, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            setNewFeedback({ content: '', rating: 5, courseId: null });
            await fetchFeedbacks();
            // Notify: feedback submitted
            await sendNotification('feedback', newFeedback.courseId, { rating: newFeedback.rating });
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    const handleDeleteFeedback = async (id: number) => {
        if (!window.confirm('Delete this testimonial?')) return;
        try {
            await axios.delete(`/api/feedbacks/${id}`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            fetchFeedbacks();
        } catch (error) {
            console.error('Error deleting feedback:', error);
        }
    };

    const handleUpdateFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Mapper les champs pour le backend (content -> comment)
            const feedbackData = {
                ...editingFeedback,
                comment: editingFeedback.content || editingFeedback.comment,
            };
            await axios.put(`/api/feedbacks/${editingFeedback.id}`, feedbackData, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            setEditingFeedback(null);
            fetchFeedbacks();
        } catch (error) {
            console.error('Error updating feedback:', error);
        }
    };

    const isAdmin = keycloak.tokenParsed?.realm_access?.roles.includes('admin');

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                    Platform <span className="text-gradient">Voices</span>
                </h1>
                <p style={{ color: "var(--text-muted)" }}>Help us shape the future of learning by sharing your thoughts.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "3rem", alignItems: "start" }}>
                <div className="glass-card" style={{ position: "sticky", top: "100px" }}>
                    {editingFeedback ? (
                        <>
                            <h2 style={{ marginBottom: "1.5rem" }}>Edit Testimonial</h2>
                            <form onSubmit={handleUpdateFeedback} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.9rem", fontWeight: "600" }}>Rating</label>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setEditingFeedback({ ...editingFeedback, rating: star })}
                                                style={{
                                                    background: star <= editingFeedback.rating ? "var(--gradient)" : "var(--surface)",
                                                    padding: "0.5rem 0.8rem",
                                                    borderRadius: "8px",
                                                    fontSize: "1.2rem"
                                                }}
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    value={editingFeedback.content}
                                    onChange={(e) => setEditingFeedback({ ...editingFeedback, content: e.target.value })}
                                    style={{
                                        width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius)", padding: "1rem", color: "white", minHeight: "150px"
                                    }}
                                    required
                                ></textarea>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <button type="submit">Update</button>
                                    <button type="button" onClick={() => setEditingFeedback(null)} style={{ background: "var(--surface)" }}>Cancel</button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 style={{ marginBottom: "1.5rem" }}>Share Your Experience</h2>
                            <form onSubmit={handleSubmitFeedback} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.9rem", fontWeight: "600" }}>Rating</label>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                                                style={{
                                                    background: star <= newFeedback.rating ? "var(--gradient)" : "var(--surface)",
                                                    padding: "0.5rem 0.8rem",
                                                    borderRadius: "8px",
                                                    fontSize: "1.2rem",
                                                    boxShadow: star <= newFeedback.rating ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none"
                                                }}
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.9rem", fontWeight: "600" }}>Testimonial</label>
                                    <textarea
                                        value={newFeedback.content}
                                        onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                                        style={{
                                            width: "100%",
                                            background: "rgba(0,0,0,0.3)",
                                            border: "1px solid var(--glass-border)",
                                            borderRadius: "var(--radius)",
                                            padding: "1rem",
                                            color: "white",
                                            minHeight: "150px",
                                            outline: "none",
                                            transition: "border-color 0.3s"
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                                        onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
                                        placeholder="What did you love about the platform? Any areas for improvement?"
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" style={{ padding: "1.2rem" }}>Submit Feedback</button>
                            </form>
                        </>
                    )}
                </div>

                <div>
                    <h2 style={{ marginBottom: "2rem" }}>User Testimonials</h2>
                    {loading ? (
                        <p style={{ color: "var(--text-muted)" }}>Loading thoughts...</p>
                    ) : feedbacks.length > 0 ? (
                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            {feedbacks.map((f: any) => (
                                <div key={f.id} className="glass-card" style={{ padding: "1.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                            <div style={{ 
                                                width: "45px", 
                                                height: "45px", 
                                                borderRadius: "50%", 
                                                background: getUserPhoto(f.userId) ? "transparent" : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "1.2rem",
                                                color: "white",
                                                fontWeight: "bold",
                                                overflow: "hidden",
                                                border: "2px solid rgba(255,255,255,0.1)"
                                            }}>
                                                {getUserPhoto(f.userId) ? (
                                                    <img 
                                                        src={getUserPhoto(f.userId)} 
                                                        alt="Profile" 
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                ) : (
                                                    <span>{getUserInitials(f.userId)}</span>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                                                    {f.userId === keycloak.tokenParsed?.sub ? "You" : getUserName(f.userId)}
                                                </span>
                                                {f.userId === keycloak.tokenParsed?.sub && (
                                                    <span style={{ fontSize: "0.6rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "0.1rem 0.4rem", borderRadius: "4px", width: "fit-content", fontWeight: "800", marginTop: "2px" }}>
                                                        YOUR FEEDBACK
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                                            <div style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.8rem" }}>
                                                {"⭐".repeat(f.rating)}
                                            </div>
                                            {(isAdmin || f.userId === keycloak.tokenParsed?.sub) && (
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button onClick={() => { setEditingFeedback({ ...f, content: f.comment }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem", background: "rgba(255,255,255,0.1)" }}>🔧</button>
                                                    <button onClick={() => handleDeleteFeedback(f.id)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid #ef4444" }}>🗑️</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontStyle: "italic", lineHeight: "1.6", color: "var(--text)" }}>{f.comment}</p>
                                    <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date inconnue'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card" style={{ textAlign: "center", padding: "4rem", opacity: 0.6 }}>
                            <p>Be the first to share your experience with the community.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feedback;
