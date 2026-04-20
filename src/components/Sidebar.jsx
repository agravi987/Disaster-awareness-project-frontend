/**
 * src/components/Sidebar.jsx - Collapsible Sidebar Navigation
 * 
 * Renders role-specific navigation links.
 * Props:
 *   - links: array of { label, to, icon } objects
 *   - role: 'student' or 'teacher' (for color theming)
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiSun, FiMoon, FiGlobe } from 'react-icons/fi';
import './Sidebar.css';

function Sidebar({ links, role }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={`sidebar sidebar-${role}`}>
            {/* Brand */}
            <div className="sidebar-brand">
                <span className="brand-icon"><FiGlobe /></span>
                <div>
                    <div className="brand-name">DisasterLearn</div>
                    <div className="brand-role">{role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}</div>
                </div>
            </div>

            {/* User info */}
            <div className="sidebar-user">
                <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-email">{user?.email}</div>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="sidebar-nav">
                <p className="nav-section-label">Menu</p>
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.exact}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'nav-link-active' : ''}`
                        }
                    >
                        <span className="nav-icon">{link.icon}</span>
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="sidebar-footer">
                <button 
                    className="sidebar-action-btn" 
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <><FiMoon size={18} /> Dark Mode</> : <><FiSun size={18} /> Light Mode</>}
                </button>
                <button 
                    className="sidebar-action-btn sidebar-action-danger" 
                    onClick={handleLogout}
                >
                    <FiLogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
