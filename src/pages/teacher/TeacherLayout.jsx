/**
 * src/pages/teacher/TeacherLayout.jsx - Teacher Dashboard Shell
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

import { FiPieChart, FiUsers, FiUserPlus, FiBook, FiClipboard } from 'react-icons/fi';

// Navigation links for the teacher sidebar
const TEACHER_LINKS = [
    { label: 'Dashboard', to: '/teacher', icon: <FiPieChart />, exact: true },
    { label: 'Students', to: '/teacher/students', icon: <FiUserPlus /> },
    { label: 'Groups', to: '/teacher/groups', icon: <FiUsers /> },
    { label: 'Courses', to: '/teacher/courses', icon: <FiBook /> },
    { label: 'Quizzes', to: '/teacher/quizzes', icon: <FiClipboard /> },
];

function TeacherLayout() {
    return (
        <div className="dashboard-layout">
            {/* role="teacher" gives the sidebar a blue accent color */}
            <Sidebar links={TEACHER_LINKS} role="teacher" />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default TeacherLayout;
