/**
 * src/App.jsx - Root Application Component & Router
 * 
 * Defines all application routes using React Router v6.
 * 
 * Key concepts:
 * - <AuthProvider>: Wraps everything so auth state is globally accessible
 * - <ProtectedRoute>: Guards pages that require login
 * - <RoleRoute>: Further restricts pages to a specific role (student/teacher)
 * - Nested routes share the same layout (sidebar + topbar)
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages (public)
import Login from './pages/Login';
import Register from './pages/Register';

// Student pages
import StudentLayout from './pages/student/StudentLayout';
import StudentHome from './pages/student/StudentHome';
import MyLearning from './pages/student/MyLearning';
import StudentQuizzes from './pages/student/StudentQuizzes';
import TakeQuiz from './pages/student/TakeQuiz';
import CourseDetail from './pages/student/CourseDetail';

// Teacher pages
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ManageStudents from './pages/teacher/ManageStudents';
import ManageGroups from './pages/teacher/ManageGroups';
import ManageCourses from './pages/teacher/ManageCourses';
import ManageQuizzes from './pages/teacher/ManageQuizzes';
import CourseEditor from './pages/teacher/CourseEditor';

// ─── Route Guards ─────────────────────────────────────────────────────────────

/**
 * ProtectedRoute - Redirects to /login if user is not authenticated.
 * If the user is logged in, renders the child component normally.
 */
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
};

/**
 * RoleRoute - Only allows users with the specified role.
 * If the user has the wrong role, redirects to /login.
 * Used INSIDE ProtectedRoute to add role-level access control.
 */
const RoleRoute = ({ role, children }) => {
    const { user } = useAuth();
    return user?.role === role ? children : <Navigate to="/login" replace />;
};

// ─── App Component ────────────────────────────────────────────────────────────

/**
 * PublicRoute - Redirects already logged-in users to their dashboard.
 * Used for Login and Register pages.
 */
const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) return children;
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
};

function App() {
    const { user } = useAuth();

    // Determine default dashboard based on role
    const defaultDashboard = user?.role === 'teacher' ? '/teacher' : '/student';
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />
                <Route path="/register" element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } />

                {/* Redirect root to appropriate dashboard if logged in, else login */}
                <Route path="/" element={<Navigate to={user ? defaultDashboard : "/login"} replace />} />

                {/* ── Student Routes (protected + role=student) ── */}
                <Route
                    path="/student"
                    element={
                        <ProtectedRoute>
                            <RoleRoute role="student">
                                <StudentLayout />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<StudentHome />} />
                    <Route path="learning" element={<MyLearning />} />
                    <Route path="quizzes" element={<StudentQuizzes />} />
                    <Route path="quizzes/:id" element={<TakeQuiz />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                </Route>

                {/* ── Teacher Routes (protected + role=teacher) ── */}
                <Route
                    path="/teacher"
                    element={
                        <ProtectedRoute>
                            <RoleRoute role="teacher">
                                <TeacherLayout />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<TeacherDashboard />} />
                    <Route path="students" element={<ManageStudents />} />
                    <Route path="groups" element={<ManageGroups />} />
                    <Route path="courses" element={<ManageCourses />} />
                    <Route path="courses/:id/edit" element={<CourseEditor />} />
                    <Route path="quizzes" element={<ManageQuizzes />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
