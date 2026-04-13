import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: string;
    read: boolean;
    icon: string;
    color: string;
}

// ─── Type metadata ────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { title: string; icon: string; color: string }> = {
    achievement: { title: "Course Completed!",      icon: "🎓", color: "#10b981" },
    upload:      { title: "New PDF Available",      icon: "📄", color: "#6366f1" },
    new_course:  { title: "New Course Added",       icon: "🆕", color: "#8b5cf6" },
    progress:    { title: "Progress Milestone",     icon: "📈", color: "#f59e0b" },
    feedback:    { title: "New Feedback",           icon: "⭐", color: "#eab308" },
    reminder:    { title: "Learning Reminder",      icon: "⏰", color: "#ef4444" },
    info:        { title: "Information",            icon: "ℹ️",  color: "#64748b" },
};

/** Guess type from the message text for legacy notifications stored without a type */
function inferType(type: string | null | undefined, message: string): string {
    if (type && TYPE_META[type]) return type;
    const m = message.toLowerCase();
    if (m.includes("completed") || m.includes("congratulations")) return "achievement";
    if (m.includes("pdf"))       return "upload";
    if (m.includes("new course") || m.includes("enroll")) return "new_course";
    if (m.includes("%") || m.includes("progress") || m.includes("milestone")) return "progress";
    if (m.includes("feedback") || m.includes("rating") || m.includes("⭐")) return "feedback";
    if (m.includes("reminder") || m.includes("resume")) return "reminder";
    return "info";
}

const getMeta = (type: string) => TYPE_META[type] ?? TYPE_META["info"];

// ─────────────────────────────────────────────────────────────────────────────

const Notifications = () => {
    const { keycloak } = useKeycloak();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>("all");

    const fetchNotifications = async () => {
        if (!keycloak.authenticated) return;
        const userId = keycloak.tokenParsed?.sub;
        try {
            // Fetch notifications + courses in parallel so we can resolve names
            const [notifRes, coursesRes] = await Promise.all([
                axios.get(`/api/notifications?userId=${userId}`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }),
                axios.get("/api/courses", {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: [] })), // non-blocking if course-service is down
            ]);

            // Build a quick lookup map: courseId → real title
            const courseMap: Record<number, string> = {};
            for (const c of coursesRes.data ?? []) {
                if (c.id && c.title) courseMap[c.id] = c.title;
            }

            /** Replace "Course #N" fallback text with the real course name */
            const resolveCourseName = (message: string): string => {
                if (!message) return message;
                const fallbackPattern = /Course #(\d+)/gi;
                return message.replace(fallbackPattern, (_match, idStr) => {
                    const id = parseInt(idStr, 10);
                    return courseMap[id] ?? _match; // use real name or keep fallback
                });
            };

            const userSub = keycloak.tokenParsed?.sub;
            const mapped: Notification[] = notifRes.data
                .filter((n: any) => n.userId === userSub)
                .map((n: any) => {
                    const resolvedType = inferType(n.type, n.message ?? "");
                    const meta = getMeta(resolvedType);
                    const cleanMessage = resolveCourseName(n.message ?? "");
                    return {
                        id: String(n.id),
                        title: meta.title,
                        message: cleanMessage,
                        time: n.createdAt
                            ? new Date(n.createdAt).toLocaleString("en-GB", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                              })
                            : "",
                        type: resolvedType,
                        read: n.read,
                        icon: meta.icon,
                        color: meta.color,
                    };
                });
            setNotifications(mapped.sort((a, b) => parseInt(b.id) - parseInt(a.id)));
            setLoading(false);
        } catch (err) {
            console.error("Error fetching notifications", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (keycloak.authenticated) fetchNotifications();
    }, [keycloak.authenticated, keycloak.token]);

    const handleClearAll = async () => {
        if (!window.confirm("Clear all notifications?")) return;
        try {
            await axios.delete("/api/notifications/all", {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            setNotifications([]);
        } catch (err) {
            console.error("Error clearing notifications", err);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error("Error marking as read", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => handleMarkAsRead(n.id)));
    };

    // Filter pills — built from actual data
    const typeSet = Array.from(new Set(notifications.map(n => n.type)));
    const filters = ["all", ...typeSet];

    const visible = activeFilter === "all"
        ? notifications
        : notifications.filter(n => n.type === activeFilter);

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = [
        { label: "Total",             value: notifications.length,                                           color: "#6366f1", icon: "🔔" },
        { label: "Unread",            value: unreadCount,                                                    color: "#ef4444", icon: "🔴" },
        { label: "Completed",         value: notifications.filter(n => n.type === "achievement").length,     color: "#10b981", icon: "🎓" },
        { label: "New PDFs",          value: notifications.filter(n => n.type === "upload").length,          color: "#6366f1", icon: "📄" },
        { label: "Milestones",        value: notifications.filter(n => n.type === "progress").length,        color: "#f59e0b", icon: "📈" },
        { label: "Feedbacks",         value: notifications.filter(n => n.type === "feedback").length,        color: "#eab308", icon: "⭐" },
    ];

    return (
        <div className="container animate-fade-in">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                        Communications <span className="text-gradient">Hub</span>
                    </h1>
                    <p style={{ color: "var(--text-muted)" }}>
                        Stay informed about all your learning activities.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#6366f1", fontSize: "0.9rem" }}>
                            Mark All as Read
                        </button>
                    )}
                    <button onClick={handleClearAll} style={{ background: "var(--surface)", fontSize: "0.9rem" }}>
                        Clear All
                    </button>
                    <button onClick={() => navigate('/settings')} style={{ fontSize: "0.9rem" }}>
                        Settings
                    </button>
                </div>
            </header>

            {/* ── Stats ───────────────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card" style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{stat.icon}</div>
                        <p style={{ fontSize: "1.6rem", fontWeight: "800", color: stat.color, margin: 0 }}>{stat.value}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Filter pills ─────────────────────────────────────────────────── */}
            {filters.length > 1 && (
                <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    {filters.map(f => {
                        const meta = getMeta(f);
                        const active = activeFilter === f;
                        const label = f === "all" ? "📬 All" : `${meta.icon} ${f.replace("_", " ")}`;
                        return (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                style={{
                                    padding: "0.4rem 1rem",
                                    fontSize: "0.82rem",
                                    borderRadius: "100px",
                                    textTransform: "capitalize",
                                    border: `1px solid ${active ? meta.color : "var(--glass-border)"}`,
                                    background: active ? `${meta.color}22` : "var(--surface)",
                                    color: active ? meta.color : "var(--text-muted)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}>
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Notification list ───────────────────────────────────────────── */}
            <div style={{ maxWidth: "860px", margin: "0 auto" }}>
                <div className="glass-card" style={{ padding: 0 }}>
                    <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between" }}>
                        <h2 style={{ fontSize: "1.25rem" }}>
                            {activeFilter === "all" ? "All Notifications" : getMeta(activeFilter).title}
                        </h2>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{unreadCount} unread</span>
                    </div>

                    <div style={{ maxHeight: "680px", overflowY: "auto" }}>
                        {loading ? (
                            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading notifications…</p>
                        ) : visible.length > 0 ? (
                            visible.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                                    style={{
                                        padding: "1.4rem 1.5rem",
                                        borderBottom: "1px solid var(--glass-border)",
                                        background: n.read ? "transparent" : `${n.color}08`,
                                        display: "flex",
                                        gap: "1rem",
                                        alignItems: "flex-start",
                                        transition: "background 0.3s",
                                        cursor: n.read ? "default" : "pointer",
                                    }}
                                    onMouseOver={e => { if (!n.read) (e.currentTarget as HTMLDivElement).style.background = `${n.color}15`; }}
                                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? "transparent" : `${n.color}08`; }}
                                >
                                    {/* Icon bubble */}
                                    <div style={{
                                        width: "42px", height: "42px", borderRadius: "50%",
                                        background: `${n.color}20`, border: `1px solid ${n.color}40`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.2rem", flexShrink: 0,
                                        boxShadow: n.read ? "none" : `0 0 12px ${n.color}40`,
                                    }}>
                                        {n.icon}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", gap: "1rem" }}>
                                            <h3 style={{
                                                fontSize: "1rem",
                                                color: n.read ? "var(--text-muted)" : "white",
                                                fontWeight: n.read ? 500 : 700,
                                            }}>
                                                {n.title}
                                            </h3>
                                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                                {n.time}
                                            </span>
                                        </div>
                                        <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: "1.5", margin: 0 }}>
                                            {n.message}
                                        </p>
                                    </div>

                                    {/* Unread dot */}
                                    {!n.read && (
                                        <div style={{
                                            width: "8px", height: "8px", borderRadius: "50%",
                                            background: n.color, flexShrink: 0, marginTop: "6px",
                                            boxShadow: `0 0 8px ${n.color}`,
                                        }} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
                                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔔</div>
                                <h3 style={{ marginBottom: "0.5rem" }}>No notifications</h3>
                                <p style={{ color: "var(--text-muted)" }}>
                                    You're all caught up! New activity will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
