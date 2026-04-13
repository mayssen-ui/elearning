import { useKeycloak } from "@react-keycloak/web";
import { Navigate, useNavigate } from "react-router-dom";

const Home = () => {
    const { keycloak, initialized } = useKeycloak();
    const navigate = useNavigate();

    const handleRegister = () => {
        keycloak.login({ 
            action: 'register',
            redirectUri: window.location.origin + '/dashboard'
        });
    };

    if (!initialized) {
        return (
            <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="loading-spinner"></div>
                    <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (keycloak.authenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="container">
            <section className="hero-section animate-fade-in">
                <h1 className="hero-title">
                    Master Your Future with<br />
                    <span className="text-gradient">E-Learning Platform</span>
                </h1>

                <p className="hero-subtitle">
                    Join thousands of students and start your journey today. Access world-class courses,
                    track your progress, and join a vibrant community of learners.
                </p>

                <div className="hero-cta">
                    <button className="btn-primary-gradient" onClick={handleRegister}>
                        Get Started Now
                    </button>
                    <button className="btn-glass" onClick={() => navigate('/courses')}>
                        Browse Courses
                    </button>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon-text">Expert Instructors</span>
                        <h3>Learn from the Best</h3>
                        <p>Learn from industry professionals with years of experience in their respective fields.</p>
                    </div>

                    <div className="feature-card">
                        <span className="feature-icon-text">Flexible Learning</span>
                        <h3>Study at Your Pace</h3>
                        <p>Study at your own pace, anytime, anywhere in the world. Adaptive learning for everyone.</p>
                    </div>

                    <div className="feature-card">
                        <span className="feature-icon-text">Certification</span>
                        <h3>Get Recognized</h3>
                        <p>Earn recognized certificates to boost your career prospects and showcase your skills.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
