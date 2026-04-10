import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

function TeacherLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await loginUser({ ...form, expectedRole: 'teacher' });
            login(data);
            navigate('/teacher');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Teacher login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link className="auth-back" to="/login">
                    <FiArrowLeft /> Back to Portal Select
                </Link>

                <div className="auth-header">
                    <div className="auth-logo">Teacher</div>
                    <h1>Teacher Login</h1>
                    <p>Access educator tools to manage courses and student safety learning.</p>
                </div>

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
                            placeholder="teacher@example.com"
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
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Login as Teacher'}
                    </button>
                </form>

                <p className="auth-link">
                    Teacher account signup is restricted. Contact an administrator if you need access.
                </p>
            </div>
        </div>
    );
}

export default TeacherLogin;
