/**
 * src/pages/student/StudentLayout.jsx - Student Dashboard Shell
 * 
 * This is the outer wrapper for all student pages.
 * It renders the Sidebar on the left and <Outlet /> on the right.
 * React Router uses <Outlet /> to render whichever child route is active.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

import { FiHome, FiBookOpen, FiEdit3 } from 'react-icons/fi';

// Navigation links for the student sidebar
const STUDENT_LINKS = [
    { label: 'Home', to: '/student', icon: <FiHome />, exact: true },
    { label: 'My Learning', to: '/student/learning', icon: <FiBookOpen /> },
    { label: 'Assigned Quizzes', to: '/student/quizzes', icon: <FiEdit3 /> },
];

function StudentLayout() {
    return (
        <div className="dashboard-layout">
            <Sidebar links={STUDENT_LINKS} role="student" />
            <main className="main-content">
                {/* The active child route renders here */}
                <Outlet />
            </main>
        </div>
    );
}

export default StudentLayout;
