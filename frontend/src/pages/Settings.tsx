import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

interface Preference {
    courseAnnouncements: boolean;
    performanceReports: boolean;
    communityActivity: boolean;
    paymentAlerts: boolean;
}

const Settings = () => {
    const { keycloak } = useKeycloak();
    const [preferences, setPreferences] = useState<Preference>({
        courseAnnouncements: true,
        performanceReports: true,
        communityActivity: false,
        paymentAlerts: true
    });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [loading, setLoading] = useState(true);

    const fetchPreferences = async () => {
        if (!keycloak.authenticated) return;
        try {
            const res = await axios.get("/notifications/preferences", {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            if (res.data) {
                setPreferences(res.data);
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching preferences", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreferences();
    }, [keycloak.authenticated, keycloak.token]);

    const handleTogglePreference = async (key: keyof Preference) => {
        const updated = { ...preferences, [key]: !preferences[key] };
        setPreferences(updated);
        setSaveStatus('saving');
        try {
            await axios.put("/notifications/preferences", updated, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error("Error updating preferences", err);
            setSaveStatus('idle');
        }
    };

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                    Account <span className="text-gradient">Settings</span>
                </h1>
                <p style={{ color: "var(--text-muted)" }}>Manage your profile, preferences, and security settings.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "3rem" }}>
                {/* Left Side: Profile Summary */}
                <aside>
                    <div className="glass-card" style={{ textAlign: "center", padding: "2.5rem" }}>
                        <div style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            background: "var(--gradient)",
                            margin: "0 auto 1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2.5rem",
                            fontWeight: "bold",
                            color: "white",
                            boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)"
                        }}>
                            {keycloak.tokenParsed?.preferred_username?.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{keycloak.tokenParsed?.preferred_username}</h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>{keycloak.tokenParsed?.email}</p>

                        <div style={{ textAlign: "left", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "1rem" }}>
                            <div style={{ marginBottom: "0.75rem" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>ACCOUNT TYPE</span>
                                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Premium Student</span>
                            </div>
                            <div>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>MEMBER SINCE</span>
                                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>February 2026</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Side: Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Notification Preferences */}
                    <div className="glass-card" style={{ padding: "2.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                            <div>
                                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Notification Preferences</h3>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Choose how you'd like to stay informed.</p>
                            </div>
                            <span style={{
                                fontSize: "0.8rem",
                                padding: "0.5rem 1rem",
                                borderRadius: "100px",
                                background: saveStatus === 'saved' ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.05)",
                                color: saveStatus === 'saved' ? "#10b981" : "var(--text-muted)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                transition: "all 0.3s"
                            }}>
                                {saveStatus === 'saving' ? "Saving..." : saveStatus === 'saved' ? "Changes Saved" : "Auto-sync active"}
                            </span>
                        </div>

                        {loading ? (
                            <p>Loading your preferences...</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                {[
                                    { label: "Course Announcements", key: "courseAnnouncements", desc: "Get notified when new lessons or materials are added to your courses." },
                                    { label: "Performance Reports", key: "performanceReports", desc: "Weekly summaries of your learning achievements and progress." },
                                    { label: "Community Activity", key: "communityActivity", desc: "Alerts for new forum posts, replies, and mentions in the community." },
                                    { label: "Payment Alerts", key: "paymentAlerts", desc: "Receipts, subscription renewals, and billing notifications." }
                                ].map((pref, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingBottom: "1.5rem",
                                        borderBottom: i === 3 ? "none" : "1px solid var(--glass-border)"
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: "1rem", display: "block", fontWeight: 500, marginBottom: "0.25rem" }}>{pref.label}</span>
                                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{pref.desc}</span>
                                        </div>
                                        <div
                                            onClick={() => handleTogglePreference(pref.key as keyof Preference)}
                                            style={{
                                                width: "48px",
                                                height: "26px",
                                                background: preferences[pref.key as keyof Preference] ? "var(--gradient)" : "#334155",
                                                borderRadius: "100px",
                                                position: "relative",
                                                cursor: "pointer",
                                                transition: "background 0.3s",
                                                marginLeft: "2rem"
                                            }}>
                                            <div style={{
                                                width: "20px",
                                                height: "20px",
                                                background: "white",
                                                borderRadius: "50%",
                                                position: "absolute",
                                                top: "3px",
                                                left: preferences[pref.key as keyof Preference] ? "25px" : "3px",
                                                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                                            }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dangerous Zone */}
                    <div className="glass-card" style={{ padding: "2.5rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "#ef4444" }}>Security & Privacy</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>Manage your account security and data privacy.</p>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button
                                onClick={() => keycloak.accountManagement()}
                                style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.9rem", border: "1px solid var(--glass-border)" }}>
                                Manage Account on Keycloak
                            </button>
                            <button style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
