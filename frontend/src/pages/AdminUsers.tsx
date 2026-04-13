import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

const AdminUsers = () => {
    const { keycloak } = useKeycloak();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [message, setMessage] = useState("");

    const isAdmin = keycloak.hasRealmRole("admin");

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [keycloak.authenticated]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/users", {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            setUsers(response.data);
        } catch (err) {
            console.error("Error fetching users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        // DEBUG: Vérifier l'ID
        console.log("DEBUG - editingUser:", editingUser);
        console.log("DEBUG - editingUser.id:", editingUser.id);
        console.log("DEBUG - Type of id:", typeof editingUser.id);

        if (!editingUser.id || editingUser.id === undefined || editingUser.id === null) {
            setMessage("✗ Erreur: ID utilisateur manquant ou invalide");
            console.error("ERROR: User ID is missing!", editingUser);
            return;
        }

        try {
            const updateData: any = {
                id: editingUser.id,
                username: editingUser.username,
                email: editingUser.email,
                role: editingUser.role
            };
            
            // Ajouter le mot de passe seulement s'il est fourni
            if (editingUser.password && editingUser.password.trim() !== "") {
                updateData.password = editingUser.password;
            }

            const url = `/api/users/${editingUser.id}`;
            console.log("DEBUG - PUT URL:", url);
            console.log("DEBUG - Update data:", updateData);
            
            await axios.put(url, updateData, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            
            setMessage("✓ Utilisateur mis à jour dans H2 et Keycloak!");
            setEditingUser(null);
            fetchUsers();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error("Error updating user", err);
            setMessage("✗ Erreur lors de la mise à jour");
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

        try {
            await axios.delete(`/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            
            setMessage("✓ Utilisateur supprimé!");
            fetchUsers();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error("Error deleting user", err);
            setMessage("✗ Erreur lors de la suppression");
        }
    };

    if (!isAdmin) {
        return (
            <div className="container animate-fade-in">
                <div className="glass-card" style={{ textAlign: "center", padding: "4rem" }}>
                    <h2>Accès refusé</h2>
                    <p>Vous devez être administrateur pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container animate-fade-in">
                <div className="glass-card" style={{ textAlign: "center", padding: "4rem" }}>
                    <p>Chargement des utilisateurs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ marginBottom: "0.5rem" }}>Gestion des Utilisateurs</h1>
                <p style={{ color: "var(--text-muted)" }}>Administration des profils utilisateurs</p>
            </header>

            {message && (
                <div className="glass-card" style={{ 
                    marginBottom: "1.5rem", 
                    padding: "1rem",
                    background: message.includes("✓") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    borderColor: message.includes("✓") ? "#10b981" : "#ef4444"
                }}>
                    {message}
                </div>
            )}

            {editingUser && (
                <div className="glass-card" style={{ marginBottom: "2rem" }}>
                    <h3 style={{ marginBottom: "1.5rem" }}>Modifier l'utilisateur</h3>
                    <form onSubmit={handleUpdateUser}>
                        <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Nom d'utilisateur (non modifiable)</label>
                                <input
                                    type="text"
                                    value={editingUser.username}
                                    disabled
                                    style={{
                                        width: "100%",
                                        padding: "0.8rem",
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "var(--radius)",
                                        color: "var(--text-muted)",
                                        cursor: "not-allowed"
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                    style={{
                                        width: "100%",
                                        padding: "0.8rem",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "var(--radius)",
                                        color: "white"
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Mot de passe (laisser vide pour ne pas changer)</label>
                                <input
                                    type="password"
                                    value={editingUser.password || ""}
                                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                                    placeholder="Nouveau mot de passe..."
                                    style={{
                                        width: "100%",
                                        padding: "0.8rem",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "var(--radius)",
                                        color: "white"
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem" }}>Rôle</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                    style={{
                                        width: "100%",
                                        padding: "0.8rem",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "var(--radius)",
                                        color: "white"
                                    }}
                                >
                                    <option value="student">Student</option>
                                    <option value="instructor">Instructor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button type="submit">💾 Enregistrer</button>
                            <button type="button" onClick={() => setEditingUser(null)} style={{ background: "var(--surface)" }}>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card">
                <h3 style={{ marginBottom: "1.5rem" }}>Liste des utilisateurs ({users.length})</h3>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                <th style={{ textAlign: "left", padding: "1rem" }}>ID</th>
                                <th style={{ textAlign: "left", padding: "1rem" }}>Username</th>
                                <th style={{ textAlign: "left", padding: "1rem" }}>Email</th>
                                <th style={{ textAlign: "left", padding: "1rem" }}>Rôle</th>
                                <th style={{ textAlign: "left", padding: "1rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: any) => (
                                <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "1rem" }}>{user.id}</td>
                                    <td style={{ padding: "1rem" }}>{user.username}</td>
                                    <td style={{ padding: "1rem" }}>{user.email}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{
                                            padding: "0.2rem 0.6rem",
                                            borderRadius: "4px",
                                            fontSize: "0.8rem",
                                            background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 
                                                       user.role === 'instructor' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                            color: user.role === 'admin' ? '#ef4444' : 
                                                  user.role === 'instructor' ? '#3b82f6' : '#10b981'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button 
                                                onClick={() => setEditingUser(user)}
                                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                                            >
                                                🔧 Modifier
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                style={{ 
                                                    padding: "0.3rem 0.6rem", 
                                                    fontSize: "0.8rem",
                                                    background: "rgba(239, 68, 68, 0.2)",
                                                    color: "#ef4444",
                                                    borderColor: "#ef4444"
                                                }}
                                            >
                                                🗑️ Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
