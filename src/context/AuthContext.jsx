/**
 * src/context/AuthContext.jsx - Authentication Context
 * 
 * This provides global authentication state to the entire application.
 * Using React Context means ANY component can access the current user
 * without passing props through many layers (prop drilling).
 * 
 * State stored here:
 *   - user: the logged-in user object (or null if not logged in)
 *   - token: the JWT string stored in localStorage
 * 
 * Functions provided:
 *   - login(userData): saves user + token, redirects by role
 *   - logout(): clears everything, redirects to login
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context (think of it as a global "store")
const AuthContext = createContext(null);

/**
 * AuthProvider - Wraps the app and provides auth state to all children.
 * Place this at the top of the component tree (done in App.jsx).
 */
export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage so the user stays logged in after page refresh
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || null;
    });

    /**
     * login - Called after successful API login/register.
     * Saves the user object and token to both state and localStorage.
     * @param {object} userData - { _id, name, email, role, token }
     */
    const login = (userData) => {
        const { token: newToken, ...userInfo } = userData;
        setUser(userInfo);
        setToken(newToken);
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('token', newToken);
    };

    /**
     * logout - Clears all auth state and storage.
     * The router in App.jsx will redirect to /login when user becomes null.
     */
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth - Custom hook to consume the auth context.
 * Components can call: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
