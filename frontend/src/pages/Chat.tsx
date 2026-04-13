import { useState, useEffect, useRef } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";
import { API_BASE_URL } from "../config";

interface ChatMessage {
    id: number;
    senderId: string;
    senderName: string;
    receiverId?: string;
    courseId?: number;
    content: string;
    messageType: string;
    createdAt: string;
    isRead: boolean;
    conversationId: string;
}

interface Conversation {
    id: number;
    conversationId: string;
    participant1Id: string;
    participant2Id?: string;
    courseId?: number;
    isGroupChat: boolean;
    groupName?: string;
    lastMessageAt: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    keycloakId?: string;
}

const Chat = () => {
    const { keycloak } = useKeycloak();
    const userSub = keycloak.tokenParsed?.sub;
    const userName = keycloak.tokenParsed?.preferred_username;

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [showNewChat, setShowNewChat] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (keycloak.authenticated) {
            loadInitialData();
            const interval = setInterval(refreshData, 5000);
            return () => clearInterval(interval);
        }
    }, [keycloak.authenticated]);

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.conversationId);
            markConversationAsRead(selectedConversation.conversationId);
        }
    }, [selectedConversation]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [convsRes, usersRes, coursesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/chat/users/${userSub}/conversations`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }),
                axios.get(`${API_BASE_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/api/courses`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                }).catch(() => ({ data: [] })),
            ]);

            setConversations(convsRes.data);
            setUsers(usersRes.data.filter((u: User) => u.id?.toString() !== userSub && u.username));
            setCourses(coursesRes.data);
            
            const unreadRes = await axios.get(`${API_BASE_URL}/api/chat/users/${userSub}/unread/count`, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            setUnreadCount(unreadRes.data.count || 0);
        } catch (error) {
            console.error("Error loading chat data:", error);
        }
        setLoading(false);
    };

    const refreshData = async () => {
        if (!selectedConversation) return;
        try {
            await loadMessages(selectedConversation.conversationId);
            const unreadRes = await axios.get(`${API_BASE_URL}/api/chat/users/${userSub}/unread/count`, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            setUnreadCount(unreadRes.data.count || 0);
        } catch (error) {
            console.error("Error refreshing chat:", error);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            setMessages(res.data);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const markConversationAsRead = async (conversationId: string) => {
        try {
            await axios.post(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read?userId=${userSub}`, {}, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const message: Partial<ChatMessage> = {
            senderId: userSub,
            senderName: userName,
            content: newMessage.trim(),
            messageType: "TEXT",
            conversationId: selectedConversation.conversationId,
        };

        if (selectedConversation.isGroupChat && selectedConversation.courseId) {
            message.courseId = selectedConversation.courseId;
        } else if (selectedConversation.participant2Id) {
            message.receiverId = selectedConversation.participant1Id === userSub 
                ? selectedConversation.participant2Id 
                : selectedConversation.participant1Id;
        }

        try {
            await axios.post(`${API_BASE_URL}/api/chat/messages`, message, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            setNewMessage("");
            await loadMessages(selectedConversation.conversationId);
            await refreshConversations();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const refreshConversations = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/chat/users/${userSub}/conversations`, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            setConversations(res.data);
        } catch (error) {
            console.error("Error refreshing conversations:", error);
        }
    };

    const deleteConversation = async (conversationId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/chat/conversations/${conversationId}?userId=${userSub}`, {
                headers: { Authorization: `Bearer ${keycloak.token}` },
            });
            if (selectedConversation?.conversationId === conversationId) {
                setSelectedConversation(null);
                setMessages([]);
            }
            await refreshConversations();
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    };

    const startNewConversation = async () => {
        if (!selectedUser) return;
        
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/chat/conversations/direct?user1=${userSub}&user2=${selectedUser}&user1Name=${userName}`,
                {},
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
            
            setShowNewChat(false);
            setSelectedUser("");
            await refreshConversations();
            
            const newConv = conversations.find(c => c.conversationId === res.data.conversationId);
            if (newConv) {
                setSelectedConversation(newConv);
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const openCourseDiscussion = async (courseId: number, courseTitle: string) => {
        const conversationId = `course_${courseId}`;
        let conv = conversations.find(c => c.conversationId === conversationId);
        
        if (!conv) {
            const message: Partial<ChatMessage> = {
                senderId: userSub,
                senderName: userName,
                content: `Bienvenue dans la discussion du cours "${courseTitle}"! 🎓`,
                messageType: "TEXT",
                conversationId: conversationId,
                courseId: courseId,
            };
            
            try {
                await axios.post(`${API_BASE_URL}/api/chat/messages`, message, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                });
                // Fetch updated conversations directly
                const res = await axios.get(`${API_BASE_URL}/api/chat/users/${userSub}/conversations`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` },
                });
                const updatedConversations = res.data;
                setConversations(updatedConversations);
                conv = updatedConversations.find((c: Conversation) => c.conversationId === conversationId);
            } catch (error) {
                console.error("Error creating course discussion:", error);
            }
        }
        
        if (conv) {
            setSelectedConversation(conv);
        }
    };

    const getConversationName = (conv: Conversation) => {
        if (conv.isGroupChat) {
            const course = courses.find(c => c.id === conv.courseId);
            return course ? `📚 ${course.title}` : conv.groupName || "Discussion de cours";
        }
        
        const otherId = conv.participant1Id === userSub ? conv.participant2Id : conv.participant1Id;
        const otherUser = users.find(u => u.id?.toString() === otherId || u.keycloakId === otherId);
        return otherUser?.username || "Utilisateur";
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: "2rem", textAlign: "center" }}>
                <h1 className="text-gradient">💬 Chat & Discussions</h1>
                <p style={{ color: "var(--text-muted)" }}>
                    Communiquez avec vos instructeurs et camarades
                </p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem", height: "calc(100vh - 250px)" }}>
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "1rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0 }}>Conversations</h3>
                        {unreadCount > 0 && (
                            <span style={{ 
                                background: "#ef4444", 
                                color: "white", 
                                borderRadius: "50%", 
                                width: "24px", 
                                height: "24px", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: "bold"
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowNewChat(true)}
                        style={{ margin: "1rem", padding: "0.75rem", fontSize: "0.9rem" }}
                    >
                        ✏️ Nouveau message
                    </button>

                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {loading ? (
                            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                                Chargement...
                            </div>
                        ) : conversations.length === 0 ? (
                            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                                Aucune conversation
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    style={{
                                        padding: "1rem",
                                        borderBottom: "1px solid var(--glass-border)",
                                        background: selectedConversation?.id === conv.id ? "rgba(99, 102, 241, 0.2)" : "transparent",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                    onMouseOver={(e) => {
                                        if (selectedConversation?.id !== conv.id) {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (selectedConversation?.id !== conv.id) {
                                            e.currentTarget.style.background = "transparent";
                                        }
                                    }}
                                >
                                    <div
                                        onClick={() => setSelectedConversation(conv)}
                                        style={{ flex: 1, cursor: "pointer" }}
                                    >
                                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                                            {getConversationName(conv)}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                            {conv.isGroupChat ? "Discussion de groupe" : "Message privé"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConversation(conv.conversationId);
                                        }}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--text-muted)",
                                            cursor: "pointer",
                                            padding: "0.25rem 0.5rem",
                                            fontSize: "1rem",
                                            borderRadius: "4px",
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.color = "#ef4444"}
                                        onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                                        title="Supprimer la conversation"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ padding: "1rem", borderTop: "1px solid var(--glass-border)" }}>
                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Discussions de cours:
                        </p>
                        {courses.map(course => (
                            <div
                                key={course.id}
                                onClick={() => openCourseDiscussion(course.id, course.title)}
                                style={{
                                    padding: "0.5rem",
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    borderRadius: "6px",
                                    marginBottom: "0.25rem",
                                }}
                                className="hover-highlight"
                            >
                                📚 {course.title}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {selectedConversation ? (
                        <>
                            <div style={{ 
                                padding: "1rem", 
                                borderBottom: "1px solid var(--glass-border)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <h3 style={{ margin: 0 }}>{getConversationName(selectedConversation)}</h3>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    {messages.length} messages
                                </span>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                                {messages.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                                        Commencez la conversation! 👋
                                    </div>
                                ) : (
                                    messages.map(msg => {
                                        const isMine = msg.senderId === userSub;
                                        return (
                                            <div
                                                key={msg.id}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: isMine ? "flex-end" : "flex-start",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        maxWidth: "70%",
                                                        padding: "0.75rem 1rem",
                                                        borderRadius: "12px",
                                                        background: isMine 
                                                            ? "linear-gradient(135deg, #6366f1, #8b5cf6)" 
                                                            : "rgba(255,255,255,0.1)",
                                                        color: isMine ? "white" : "var(--text)",
                                                        border: isMine ? "none" : "1px solid var(--glass-border)",
                                                    }}
                                                >
                                                    {!isMine && (
                                                        <div style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.25rem" }}>
                                                            {msg.senderName || "Utilisateur"}
                                                        </div>
                                                    )}
                                                    <div>{msg.content}</div>
                                                    <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem", textAlign: "right" }}>
                                                        {formatTime(msg.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ 
                                padding: "1rem", 
                                borderTop: "1px solid var(--glass-border)",
                                display: "flex",
                                gap: "0.75rem"
                            }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Écrivez votre message..."
                                    style={{ flex: 1 }}
                                />
                                <button onClick={sendMessage} disabled={!newMessage.trim()}>
                                    📤 Envoyer
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ 
                            flex: 1, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            color: "var(--text-muted)"
                        }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
                                <p>Sélectionnez une conversation pour commencer</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showNewChat && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                }}>
                    <div className="glass-card" style={{ width: "400px", padding: "2rem" }}>
                        <h3 style={{ marginBottom: "1.5rem" }}>Nouvelle conversation</h3>
                        
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            style={{ width: "100%", marginBottom: "1rem" }}
                        >
                            <option value="">Choisir un utilisateur...</option>
                            {users.map(user => (
                                <option key={user.keycloakId || user.id} value={user.keycloakId || user.id}>
                                    {user.username} ({user.email})
                                </option>
                            ))}
                        </select>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button 
                                onClick={startNewConversation}
                                disabled={!selectedUser}
                                style={{ flex: 1 }}
                            >
                                Commencer
                            </button>
                            <button 
                                onClick={() => setShowNewChat(false)}
                                style={{ flex: 1, background: "var(--surface)" }}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
