/**
 * src/pages/Login.jsx - Login Page
 * 
 * Presents a form for users to enter email + password.
 * On success, calls the auth context login() function which stores
 * the JWT and redirects to the appropriate dashboard based on role.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    // Form state
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Update form state as user types
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await loginUser(form);

            // Store user data and token via context
            login(data);

            // Redirect based on role
            if (data.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/student');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Logo / Header */}
                <div className="auth-header">
                    <div className="auth-logo">🌍</div>
                    <h1>Disaster Awareness</h1>
                    <p>Learning Platform</p>
                </div>

                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Sign in to continue learning</p>

                {/* Error message */}
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-btn"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-link">
                    Don't have an account?{' '}
                    <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
