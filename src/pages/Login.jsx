import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiShield, FiUsers } from 'react-icons/fi';
import './Auth.css';

function Login() {
    return (
        <div className="auth-page">
            <div className="auth-card auth-portal-card">
                <div className="auth-header">
                    <div className="auth-logo">SafetySphere</div>
                    <h1>Disaster Awareness Platform</h1>
                    <p>Select your portal to continue</p>
                </div>

                <div className="portal-grid">
                    <Link to="/login/student" className="portal-tile">
                        <span className="portal-icon">
                            <FiBookOpen />
                        </span>
                        <h3>Student Login</h3>
                        <p>Continue your learning path, courses, and quizzes.</p>
                    </Link>

                    <Link to="/login/teacher" className="portal-tile">
                        <span className="portal-icon">
                            <FiUsers />
                        </span>
                        <h3>Teacher Login</h3>
                        <p>Manage students, groups, courses, and assessments.</p>
                    </Link>
                </div>

                <div className="auth-pill-note">
                    <FiShield />
                    Role-based authentication is enabled for portal safety.
                </div>

                <p className="auth-link">
                    New student? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
