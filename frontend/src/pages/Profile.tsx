import { useState, useEffect, useRef } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

const Profile = () => {
    const { keycloak } = useKeycloak();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        role: "",
        profilePicture: ""
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = keycloak.hasRealmRole("admin");

    useEffect(() => {
        fetchUserProfile();
    }, [keycloak.authenticated]);

    const fetchUserProfile = async () => {
        if (!keycloak.authenticated) return;
        
        try {
            setLoading(true);
            const keycloakId = keycloak.subject;
            
            // Get user from backend by keycloakId
            const response = await axios.get(`/api/users`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            
            const currentUser = response.data.find((u: any) => u.keycloakId === keycloakId);
            if (currentUser) {
                setUser(currentUser);
                setFormData({
                    username: currentUser.username || "",
                    email: currentUser.email || "",
                    role: currentUser.role || "user",
                    profilePicture: currentUser.profilePicture || ""
                });
                if (currentUser.profilePicture) {
                    setPreviewImage(currentUser.profilePicture);
                }
            }
        } catch (err) {
            console.error("Error fetching profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vérifier la taille (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage("✗ L'image ne doit pas dépasser 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setPreviewImage(base64);
            setFormData({ ...formData, profilePicture: base64 });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // DEBUG: Vérifier l'ID
        console.log("DEBUG Profile - user:", user);
        console.log("DEBUG Profile - user.id:", user.id);

        if (!user.id || user.id === undefined || user.id === null) {
            setMessage("✗ Erreur: ID utilisateur manquant");
            console.error("ERROR: User ID is missing in Profile!", user);
            return;
        }

        try {
            setSaving(true);
            const url = `/api/users/${user.id}`;
            console.log("DEBUG Profile - PUT URL:", url);
            
            await axios.put(url, {
                id: user.id,
                username: formData.username,
                email: formData.email,
                role: formData.role,
                profilePicture: formData.profilePicture
            }, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            
            setMessage("✓ Profil mis à jour avec succès!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error("Error updating profile", err);
            setMessage("✗ Erreur lors de la mise à jour");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ?")) return;

        try {
            await axios.delete(`/api/users/${user.id}`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            
            alert("Compte supprimé. Déconnexion...");
            keycloak.logout();
        } catch (err) {
            console.error("Error deleting account", err);
            setMessage("✗ Erreur lors de la suppression");
        }
    };

    const getInitials = () => {
        return formData.username?.charAt(0).toUpperCase() || "?";
    };

    const getRoleColor = () => {
        switch (formData.role) {
            case "admin": return "#ef4444";
            case "instructor": return "#3b82f6";
            default: return "#10b981";
        }
    };

    if (loading) {
        return (
            <div className="container animate-fade-in">
                <div className="glass-card" style={{ textAlign: "center", padding: "4rem" }}>
                    <p>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in">
            {/* Header */}
            <div style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)",
                borderRadius: "var(--radius)",
                padding: "2.5rem 2rem",
                marginBottom: "2rem",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)"
            }}>
                <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Mon Profil</h1>
                <p style={{ color: "var(--text-muted)" }}>Gérez vos informations personnelles</p>
            </div>

            {/* Message */}
            {message && (
                <div className="glass-card" style={{ 
                    marginBottom: "1.5rem", 
                    padding: "1rem",
                    background: message.includes("✓") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    borderColor: message.includes("✓") ? "#10b981" : "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                }}>
                    <span>{message.includes("✓") ? "✅" : "❌"}</span>
                    {message}
                </div>
            )}

            {/* Layout principal */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", maxWidth: "800px", margin: "0 auto" }}>
                
                {/* Section Photo de profil */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                        {/* Photo */}
                        <div style={{ position: "relative" }}>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: "120px",
                                    height: "120px",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    overflow: "hidden",
                                    border: `3px solid ${getRoleColor()}`,
                                    background: previewImage ? "transparent" : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "3rem",
                                    color: "white",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
                                }}
                            >
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span>{getInitials()}</span>
                                )}
                            </div>
                            
                            {/* Badge rôle */}
                            <div style={{
                                position: "absolute",
                                bottom: "-5px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                background: getRoleColor(),
                                color: "white",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "20px",
                                fontSize: "0.65rem",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                border: "2px solid var(--surface)",
                                whiteSpace: "nowrap"
                            }}>
                                {formData.role}
                            </div>
                            
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: "none" }}
                            />
                        </div>

                        {/* Info utilisateur */}
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <h2 style={{ fontSize: "1.3rem", marginBottom: "0.25rem", wordBreak: "break-word" }}>
                                {formData.username}
                            </h2>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem", wordBreak: "break-word" }}>
                                {formData.email}
                            </p>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    padding: "0.5rem 1rem",
                                    background: "rgba(99, 102, 241, 0.1)",
                                    border: "1px solid #6366f1",
                                    color: "#6366f1",
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                    cursor: "pointer"
                                }}
                            >
                                📷 Changer la photo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Formulaire */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>⚙️</span> Informations du compte
                    </h3>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            {/* Username - non modifiable */}
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                    Nom d'utilisateur (non modifiable)
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    disabled
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem 1rem",
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-muted)",
                                        fontSize: "0.95rem",
                                        cursor: "not-allowed"
                                    }}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem 1rem",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "8px",
                                        color: "white",
                                        fontSize: "0.95rem"
                                    }}
                                />
                            </div>

                            {/* Rôle */}
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                    Rôle
                                </label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    disabled
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem 1rem",
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-muted)",
                                        fontSize: "0.95rem",
                                        cursor: "not-allowed"
                                    }}
                                />
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                    Le rôle ne peut être modifié que par un administrateur
                                </p>
                            </div>
                        </div>

                        {/* Boutons */}
                        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                            <button 
                                type="submit" 
                                disabled={saving}
                                style={{ 
                                    flex: 1,
                                    padding: "0.75rem 1.5rem",
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? "💾 Enregistrement..." : "💾 Enregistrer les modifications"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Zone dangereuse */}
                <div className="glass-card" style={{ padding: "2rem", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#ef4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>⚠️</span> Zone dangereuse
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                        Ces actions sont irréversibles. Soyez prudent.
                    </p>
                    <button 
                        onClick={handleDelete}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.9rem"
                        }}
                    >
                        🗑️ Supprimer mon compte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
