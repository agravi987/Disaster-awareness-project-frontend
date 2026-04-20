/**
 * src/pages/teacher/TeacherLayout.jsx - Teacher Dashboard Shell
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import DashboardTopbar from '../../components/DashboardTopbar';

import { FiPieChart, FiUsers, FiUserPlus, FiBook, FiClipboard, FiMap } from 'react-icons/fi';

// Navigation links for the teacher sidebar
const TEACHER_LINKS = [
    { label: 'Dashboard', to: '/teacher', icon: <FiPieChart />, exact: true },
    { label: 'Live Map', to: '/teacher/map', icon: <FiMap /> },
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
                <DashboardTopbar role="teacher" />
                <Outlet />
            </main>
        </div>
    );
}

export default TeacherLayout;
