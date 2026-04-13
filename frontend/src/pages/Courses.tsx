import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";
import { API_BASE_URL } from "../config";

const Courses = () => {
    const { keycloak } = useKeycloak();
    const [courses, setCourses] = useState([]);
    const [progress, setProgress] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);
    const [editingProgress, setEditingProgress] = useState<{courseId: number, percentage: number} | null>(null);
    const [newCourse, setNewCourse] = useState({ title: '', description: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadingCourseId, setUploadingCourseId] = useState<number | null>(null);

    const fetchCourses = async () => {
        if (!keycloak.authenticated) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const timestamp = Date.now(); // Anti-cache
            const [coursesRes, progressRes] = await Promise.all([
                axios.get(`/api/courses?_t=${timestamp}`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` }
                }),
                axios.get(`/api/progress?_t=${timestamp}`, {
                    headers: { Authorization: `Bearer ${keycloak.token}` }
                })
            ]);
            console.log('Fetched courses:', coursesRes.data.length);
            setCourses(coursesRes.data);
            setProgress(progressRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [keycloak.authenticated, keycloak.token]); // Keep dependencies to re-fetch on auth/token change

    // Listen for progress updates from other components (Progress page)
    useEffect(() => {
        const handleProgressUpdate = (event: CustomEvent) => {
            console.log('Progress updated, refreshing courses:', event.detail);
            fetchCourses();
        };
        window.addEventListener('progressUpdated', handleProgressUpdate as EventListener);
        return () => {
            window.removeEventListener('progressUpdated', handleProgressUpdate as EventListener);
        };
    }, []);

    const sendNotification = async (type: string, courseId?: number, extra?: Record<string, any>) => {
        try {
            const userId = keycloak.tokenParsed?.sub;
            if (!userId) return;
            
            // Générer un message selon le type
            const messages: Record<string, string> = {
                'new_course': 'Un nouveau cours est disponible !',
                'achievement': 'Félicitations ! Vous avez terminé un cours.',
                'upload': 'Nouveau PDF disponible pour un cours.',
                'progress': 'Vous avez atteint un jalon de progression.',
                'feedback': 'Merci pour votre retour !',
                'reminder': 'N\'oubliez pas de continuer votre cours.',
            };
            
            await axios.post('/api/notifications', {
                type,
                userId,
                courseId,
                message: messages[type] || 'Nouvelle notification',
                ...extra,
            }, { headers: { Authorization: `Bearer ${keycloak.token}` } });
            console.log('Notification sent:', type);
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Creating course:', newCourse);
        try {
            const res = await axios.post('/api/courses', newCourse, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            console.log('Course created:', res.data);
            const createdId = res.data?.id;
            setNewCourse({ title: '', description: '' });
            setShowForm(false);
            alert('Success: Course has been created and listed.');
            
            // Force refresh with delay
            console.log('Refreshing courses...');
            await fetchCourses();
            console.log('Courses refreshed, count:', courses.length);
            
            // Double refresh to ensure UI updates
            setTimeout(() => {
                console.log('Double refresh...');
                fetchCourses();
            }, 500);
            
            // Notify all students: new course available (here we notify the creator as demo)
            if (createdId) await sendNotification('new_course', createdId);
        } catch (error: any) {
            console.error('Error creating course:', error);
            console.error('Error response:', error.response?.data);
            alert('Error: Could not create course. Please check if backend services are running.');
        }
    };

    const handleMarkAsComplete = async (courseId: number) => {
        try {
            const userId = keycloak.tokenParsed?.sub;
            await axios.post('/api/progress', {
                userId: userId,
                courseId: courseId,
                percentage: 100
            }, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            // Track activity in Analytics
            await axios.post(
                `${API_BASE_URL}/api/analytics/activities`,
                {
                    userId: userId,
                    activityType: "COURSE_COMPLETE",
                    courseId: courseId,
                    duration: 0,
                    metadata: "Completed course"
                },
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
            // Update badge progress for COURSE_COMPLETE
            await axios.post(
                `${API_BASE_URL}/api/badges/users/${userId}/progress?requirementType=COURSE_COMPLETE&increment=1`,
                {},
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
            // Award points to leaderboard
            await axios.post(
                `${API_BASE_URL}/api/leaderboard/points/award?userId=${userId}&actionType=COURSE_COMPLETE&description=Cours%20termin%C3%A9`,
                {},
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
            alert('🎉 Félicitations ! Cours terminé ! +100 points ! Badge "Diplômé" ou "Expert" en cours...');
            fetchCourses();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const handleUpdateProgress = async (courseId: number, percentage: number) => {
        if (!userId) {
            alert('Erreur: Utilisateur non authentifié');
            return;
        }
        
        try {
            // Backend automatically updates if exists (by userId+courseId) or creates new
            const progressData = {
                userId: userId,
                courseId: courseId,
                percentage: percentage
            };
            console.log('POST /api/progress', progressData);
            
            await axios.post('/api/progress', progressData, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            
            alert(`✅ Progression mise à jour : ${percentage}%`);
            fetchCourses();
            // Notify other components (like Progress page) that progress has changed
            window.dispatchEvent(new CustomEvent('progressUpdated', { detail: { courseId, percentage } }));
        } catch (error: any) {
            console.error('Error updating progress:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Erreur inconnue';
            alert(`❌ Erreur: ${errorMsg}`);
        }
    };

    const handleDeleteCourse = async (courseId: number) => {
        if (!window.confirm('Are you sure you want to delete this course? This action is irreversible.')) return;
        try {
            console.log('Deleting course:', courseId);
            const response = await axios.delete(`/api/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            console.log('Delete response:', response.status);
            alert('Course deleted successfully.');
            console.log('Refreshing courses...');
            await fetchCourses();
            console.log('Courses refreshed');
        } catch (error: any) {
            console.error('Error deleting course:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            alert('Error: Could not delete course. You might not have the required permissions.');
        }
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.put(`/api/courses/${editingCourse.id}`, editingCourse, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            setEditingCourse(null);
            alert('Success: Course updated.');
            fetchCourses();
        } catch (error) {
            console.error('Error updating course:', error);
            alert('Error: Could not update course.');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, courseId: number) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setUploadingCourseId(courseId);
        }
    };

    const handleUploadPdf = async (courseId: number) => {
        if (!selectedFile || uploadingCourseId !== courseId) {
            alert('Please select a PDF file first');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await axios.post(`/api/courses/${courseId}/pdf`, formData, {
                headers: { 
                    Authorization: `Bearer ${keycloak.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('PDF uploaded successfully!');
            setSelectedFile(null);
            setUploadingCourseId(null);
            await fetchCourses();
            // Notify uploader: PDF is available
            await sendNotification('upload', courseId);
        } catch (error) {
            console.error('Error uploading PDF:', error);
            alert('Error: Could not upload PDF.');
        }
    };

    const handleDeletePdf = async (courseId: number) => {
        if (!window.confirm('Are you sure you want to delete the PDF?')) return;
        try {
            await axios.delete(`/api/courses/${courseId}/pdf`, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            alert('PDF deleted successfully!');
            fetchCourses();
        } catch (error) {
            console.error('Error deleting PDF:', error);
            alert('Error: Could not delete PDF.');
        }
    };

    const handleStartCourse = async (courseId: number) => {
        try {
            const userId = keycloak.tokenParsed?.sub;
            // Track activity in Analytics
            await axios.post(
                `${API_BASE_URL}/api/analytics/activities`,
                {
                    userId: userId,
                    activityType: "COURSE_START",
                    courseId: courseId,
                    duration: 0,
                    metadata: "Started course"
                },
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
            // Update badge progress for COURSE_START
            await axios.post(
                `${API_BASE_URL}/api/badges/users/${userId}/progress?requirementType=COURSE_START&increment=1`,
                {},
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
            // Award points to leaderboard
            await axios.post(
                `${API_BASE_URL}/api/leaderboard/points/award?userId=${userId}&actionType=COURSE_START&description=Cours%20commenc%C3%A9`,
                {},
                { headers: { Authorization: `Bearer ${keycloak.token}` } }
            );
            alert('🎉 Cours commencé ! +10 points ! Badge "Apprenti" en cours...');
            // Also initialize progress for this course
            await axios.post('/api/progress', {
                userId: userId,
                courseId: courseId,
                percentage: 5
            }, {
                headers: { Authorization: `Bearer ${keycloak.token}` }
            });
            fetchCourses();
        } catch (error) {
            console.error('Error starting course:', error);
            alert('❌ Erreur lors du démarrage du cours');
        }
    };

    const isAdmin = keycloak.tokenParsed?.realm_access?.roles.includes('admin');
    const isInstructor = keycloak.tokenParsed?.realm_access?.roles.includes('instructor');
    const canManageCourses = isAdmin || isInstructor;
    const userId = keycloak.tokenParsed?.sub;

    // Fonction pour obtenir la progression d'un cours
    const getCourseProgress = (courseId: number) => {
        const courseProgress = progress.find((p: any) => p.courseId === courseId && p.userId === userId);
        return courseProgress?.percentage || 0;
    };

    const getExistingProgress = (courseId: number) => {
        return progress.find((p: any) => p.courseId === courseId && p.userId === userId);
    };

    // Fonction pour obtenir la couleur de la barre de progression
    const getProgressColor = (percentage: number) => {
        if (percentage === 100) return '#10b981';
        if (percentage >= 75) return '#8b5cf6';
        if (percentage >= 50) return '#3b82f6';
        if (percentage >= 25) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="container animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
                <div>
                    <h1 className="hero-title" style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>Explore Courses</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>Master new skills with our premium curriculum.</p>
                </div>
                {canManageCourses && (
                    <button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'Add New Course'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="glass-card" style={{ marginBottom: "3rem", maxWidth: "600px" }}>
                    <h2 style={{ marginBottom: "1.5rem" }}>Create New Course</h2>
                    <form onSubmit={handleCreateCourse}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Course Title</label>
                            <input
                                type="text"
                                value={newCourse.title}
                                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid var(--glass-border)", color: "white", padding: "0.8rem", borderRadius: "8px" }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Description</label>
                            <textarea
                                value={newCourse.description}
                                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid var(--glass-border)", color: "white", padding: "0.8rem", borderRadius: "8px", minHeight: "100px" }}
                                required
                            />
                        </div>
                        <button type="submit">Create Course</button>
                    </form>
                </div>
            )}

            {editingCourse && (
                <div className="glass-card" style={{ marginBottom: "3rem", maxWidth: "600px" }}>
                    <h2 style={{ marginBottom: "1.5rem" }}>Edit Course</h2>
                    <form onSubmit={handleUpdateCourse}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Course Title</label>
                            <input
                                type="text"
                                value={editingCourse.title}
                                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                                style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid var(--glass-border)", color: "white", padding: "0.8rem", borderRadius: "8px" }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Description</label>
                            <textarea
                                value={editingCourse.description}
                                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                                style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid var(--glass-border)", color: "white", padding: "0.8rem", borderRadius: "8px", minHeight: "100px" }}
                                required
                            />
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingCourse(null)} style={{ background: "var(--surface)" }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                        All <span className="text-gradient">Courses</span>
                    </h1>
                    <p style={{ color: "var(--text-muted)" }}>Discovery your next skill from 1,000+ top-rated courses.</p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: "var(--glass)", border: "1px solid var(--glass-border)", padding: "0.8rem 1.5rem", borderRadius: "var(--radius)", color: "white", outline: "none", width: "300px" }}
                    />
                </div>
            </header>

            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem" }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card" style={{ height: "350px", opacity: 0.5 }}>
                            <div style={{ height: "150px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "1rem" }}></div>
                            <div style={{ height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", width: "80%", marginBottom: "1rem" }}></div>
                            <div style={{ height: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", width: "60%" }}></div>
                        </div>
                    ))}
                </div>
            ) : courses.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem" }}>
                    {courses
                        .filter((course: any) => 
                            course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            course.description?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((course: any, i: number) => {
                            const progressPercent = getCourseProgress(course.id);
                            const progressColor = getProgressColor(progressPercent);
                            const hasProgress = progressPercent > 0;
                            
                            return (
                            <div key={course.id} style={{
                                borderRadius: "16px",
                                overflow: "hidden",
                                background: "rgba(255, 255, 255, 0.02)",
                                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                                position: "relative",
                                border: "1px solid var(--glass-border)",
                                backdropFilter: "blur(12px)",
                                boxShadow: "var(--shadow)"
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99, 102, 241, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                                }}>
                                {/* Badge de progression en haut */}
                                {hasProgress && (
                                    <div style={{
                                        position: "absolute",
                                        top: "1rem",
                                        right: "1rem",
                                        background: progressPercent === 100 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(99, 102, 241, 0.9)',
                                        padding: "0.4rem 0.8rem",
                                        borderRadius: "20px",
                                        fontSize: "0.75rem",
                                        fontWeight: "800",
                                        color: "white",
                                        zIndex: 10,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                    }}>
                                        {progressPercent === 100 ? '✓ Terminé' : `${progressPercent}%`}
                                    </div>
                                )}
                                
                                {/* Card Header/Thumbnail */}
                                <div style={{
                                    height: "180px",
                                    position: "relative",
                                    background: "var(--gradient)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        position: "absolute",
                                        width: "150%",
                                        height: "150%",
                                        background: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)",
                                        opacity: 0.5
                                    }}></div>
                                    <div style={{ fontSize: "5rem", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}>{i % 2 === 0 ? "🚀" : i % 3 === 0 ? "🎨" : "⚛️"}</div>

                                    <span className="text-surface" style={{
                                        position: "absolute",
                                        bottom: "1rem",
                                        right: "1rem",
                                        background: "rgba(0,0,0,0.5)",
                                        padding: "0.2rem 0.6rem",
                                        borderRadius: "4px",
                                        fontSize: "0.75rem",
                                        backdropFilter: "blur(4px)"
                                    }}>
                                        {course.duration || "12h 30m"}
                                    </span>

                                    {canManageCourses && !hasProgress && (
                                        <div style={{
                                            position: "absolute",
                                            top: "1rem",
                                            left: "1rem",
                                            background: "rgba(99, 102, 241, 0.9)",
                                            padding: "0.3rem 0.8rem",
                                            borderRadius: "4px",
                                            fontSize: "0.75rem",
                                            fontWeight: "800",
                                            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
                                        }}>
                                            👥 128
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem", alignItems: "center" }}>
                                        <span style={{
                                            fontSize: "0.6rem",
                                            color: "white",
                                            background: "var(--gradient)",
                                            padding: "0.1rem 0.6rem",
                                            borderRadius: "100px",
                                            fontWeight: "800",
                                            textTransform: "uppercase"
                                        }}>Hot</span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Level: Intermediate</span>
                                    </div>
                                    <h3 style={{ marginBottom: "0.6rem", fontSize: "1.4rem", lineHeight: "1.2", color: "white" }}>{course.title}</h3>
                                    
                                    {/* Barre de progression */}
                                    {hasProgress && (
                                        <div style={{ marginBottom: "1rem" }}>
                                            <div style={{ 
                                                display: "flex", 
                                                justifyContent: "space-between", 
                                                alignItems: "center",
                                                marginBottom: "0.4rem"
                                            }}>
                                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                    Progression
                                                </span>
                                                <span style={{ 
                                                    fontSize: "0.75rem", 
                                                    color: progressColor,
                                                    fontWeight: "600"
                                                }}>
                                                    {progressPercent === 100 ? '🏆 Complété' : `${progressPercent}%`}
                                                </span>
                                            </div>
                                            <div style={{ 
                                                height: "6px", 
                                                background: "rgba(0,0,0,0.3)", 
                                                borderRadius: "3px", 
                                                overflow: "hidden"
                                            }}>
                                                <div style={{
                                                    width: `${progressPercent}%`,
                                                    height: "100%",
                                                    background: progressColor,
                                                    borderRadius: "3px",
                                                    transition: "width 0.5s ease"
                                                }} />
                                            </div>
                                            {progressPercent < 100 && (
                                                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                                                    ⚡ Continuez votre apprentissage !
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    <p style={{
                                        fontSize: "0.9rem",
                                        color: "var(--text-muted)",
                                        marginBottom: "1.5rem",
                                        minHeight: "3rem",
                                        display: "-webkit-box",
                                        WebkitLineClamp: "2",
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        lineHeight: "1.5"
                                    }}>
                                        {course.description || "Master the art of coding with this comprehensive guide to modern development."}
                                    </p>
                                {/* Section PDF */}
                                {course.pdfUrl && (
                                    <div style={{ marginBottom: "1rem" }}>
                                        <a 
                                            href={course.pdfUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                                display: "inline-flex", 
                                                alignItems: "center", 
                                                gap: "0.5rem",
                                                padding: "0.5rem 1rem",
                                                background: "rgba(239, 68, 68, 0.1)",
                                                color: "#ef4444",
                                                borderRadius: "8px",
                                                fontSize: "0.85rem",
                                                textDecoration: "none",
                                                border: "1px solid rgba(239, 68, 68, 0.2)"
                                            }}
                                        >
                                            📄 Voir PDF
                                        </a>
                                    </div>
                                )}
                                <div style={{
                                    marginTop: "auto",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-end",
                                    borderTop: "1px solid rgba(255,255,255,0.1)",
                                    paddingTop: "1.2rem",
                                    flexWrap: "wrap",
                                    gap: "1rem"
                                }}>
                                    <div>
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "-0.1rem" }}>Enrollment</p>
                                        <span style={{ fontWeight: "800", fontSize: "1.3rem", color: "white" }}>${course.price || "49.99"}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                        {/* Input pour modifier la progression */}
                                        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                defaultValue={getCourseProgress(course.id)}
                                                onChange={(e) => setEditingProgress({ courseId: course.id, percentage: parseInt(e.target.value) || 0 })}
                                                style={{
                                                    width: "60px",
                                                    padding: "0.4rem 0.6rem",
                                                    background: "rgba(255,255,255,0.05)",
                                                    border: "1px solid var(--glass-border)",
                                                    borderRadius: "6px",
                                                    color: "white",
                                                    fontSize: "0.85rem",
                                                    textAlign: "center"
                                                }}
                                                placeholder="%"
                                            />
                                            <button 
                                                onClick={() => {
                                                    const percent = editingProgress?.courseId === course.id ? editingProgress.percentage : getCourseProgress(course.id);
                                                    handleUpdateProgress(course.id, percent);
                                                }}
                                                style={{ 
                                                    padding: "0.4rem 0.8rem", 
                                                    fontSize: "0.8rem", 
                                                    background: "rgba(99, 102, 241, 0.2)", 
                                                    color: "#8b5cf6", 
                                                    border: "1px solid rgba(99, 102, 241, 0.3)",
                                                    borderRadius: "6px"
                                                }}
                                            >
                                                Mettre à jour
                                            </button>
                                        </div>
                                        
                                        {!hasProgress && (
                                            <button 
                                                onClick={() => handleStartCourse(course.id)}
                                                style={{ 
                                                    padding: "0.5rem 1rem", 
                                                    fontSize: "0.85rem", 
                                                    background: "rgba(59, 130, 246, 0.2)", 
                                                    color: "#3b82f6", 
                                                    border: "1px solid rgba(59, 130, 246, 0.3)", 
                                                    minWidth: "75px" 
                                                }}
                                            >
                                                📚 Commencer
                                            </button>
                                        )}
                                        <button onClick={() => {
                                            if (course.pdfUrl) {
                                                window.open(course.pdfUrl, '_blank');
                                            } else {
                                                alert(`📚 ${course.title}\n\n⚠️ Le contenu PDF de ce cours est vide.\nVeuillez contacter l'instructeur.`);
                                            }
                                        }} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", minWidth: "75px" }}>View</button>
                                        <button onClick={() => handleMarkAsComplete(course.id)} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)", minWidth: "75px" }}>Done</button>

                                        {canManageCourses && (
                                            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                                {/* PDF Upload Section */}
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => handleFileChange(e, course.id)}
                                                        style={{ display: "none" }}
                                                        id={`pdf-upload-${course.id}`}
                                                    />
                                                    <label
                                                        htmlFor={`pdf-upload-${course.id}`}
                                                        style={{
                                                            padding: "0.4rem",
                                                            background: course.pdfUrl ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)",
                                                            color: course.pdfUrl ? "#10b981" : "white",
                                                            borderRadius: "8px",
                                                            border: "1px solid var(--glass-border)",
                                                            fontSize: "0.9rem",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center"
                                                        }}
                                                        title={course.pdfUrl ? "Change PDF" : "Upload PDF"}
                                                    >
                                                        {course.pdfUrl ? "📄✓" : "📄+"}
                                                    </label>
                                                    {uploadingCourseId === course.id && selectedFile && (
                                                        <button
                                                            onClick={() => handleUploadPdf(course.id)}
                                                            style={{
                                                                padding: "0.4rem",
                                                                background: "rgba(99, 102, 241, 0.2)",
                                                                color: "#6366f1",
                                                                borderRadius: "8px",
                                                                border: "1px solid rgba(99, 102, 241, 0.3)",
                                                                fontSize: "0.9rem"
                                                            }}
                                                            title="Confirm Upload"
                                                        >
                                                            ✓
                                                        </button>
                                                    )}
                                                    {course.pdfUrl && (
                                                        <button
                                                            onClick={() => handleDeletePdf(course.id)}
                                                            style={{
                                                                padding: "0.4rem",
                                                                background: "rgba(239, 68, 68, 0.1)",
                                                                color: "#ef4444",
                                                                borderRadius: "8px",
                                                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                                                fontSize: "0.9rem"
                                                            }}
                                                            title="Delete PDF"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => { setEditingCourse(course); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    style={{ padding: "0.4rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", border: "1px solid var(--glass-border)", fontSize: "0.9rem" }}
                                                    title="Edit"
                                                >🔧</button>
                                                <button
                                                    onClick={() => handleDeleteCourse(course.id)}
                                                    style={{ padding: "0.4rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.9rem" }}
                                                    title="Delete"
                                                >🗑️</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            ) : (
                <div className="glass-card" style={{ textAlign: "center", padding: "6rem 2rem" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "2rem" }}>🔍</div>
                    <h2 style={{ marginBottom: "1rem" }}>No courses available in this category</h2>
                    <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto 2rem" }}>
                        It seems like our library is currently empty or the backend service is taking a break.
                    </p>
                    <button style={{ background: "var(--surface)" }} onClick={() => window.location.reload()}>Retry Connection</button>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "1rem" }}>Check if "course-service" is running on port 3000</p>
                </div>
            )}
        </div>
    );
};

export default Courses;
