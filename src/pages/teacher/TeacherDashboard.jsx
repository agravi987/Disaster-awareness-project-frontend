/**
 * src/pages/teacher/TeacherDashboard.jsx - Teacher Overview Page
 * 
 * Shows high-level stats (counts of students, courses, etc.)
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, getCourses, getQuizzes, getGroups } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiPlusSquare, FiEdit, FiUsers, FiMap } from 'react-icons/fi';

function TeacherDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        students: 0,
        groups: 0,
        courses: 0,
        quizzes: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all counts concurrently using Promise.all
        const fetchStats = async () => {
            try {
                const [stRes, grRes, crRes, qzRes] = await Promise.all([
                    getStudents(),
                    getGroups(),
                    getCourses(),
                    getQuizzes(),
                ]);

                // Filter courses to only show ones created by this teacher
                const myCourses = crRes.data.filter(c => c.teacher?._id === user._id || c.teacher === user._id);

                setStats({
                    students: stRes.data.length,
                    groups: grRes.data.length,
                    courses: myCourses.length,
                    quizzes: qzRes.data.length, // backend already filters by teacher
                });
            } catch (err) {
                console.error('Failed to load stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user._id]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome to Educator Portal</h1>
                    <p className="subtitle">Manage your students, courses, and assessments</p>
                </div>
            </div>

            {loading ? (
                <div className="spinner" />
            ) : (
                <>
                    <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
                        <div className="card" style={{ borderTop: '4px solid rgb(var(--info))' }}>
                            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Students</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.students}</p>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid rgb(var(--warning))' }}>
                            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Groups</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.groups}</p>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid rgb(var(--success))' }}>
                            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>My Courses</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.courses}</p>
                        </div>

                        <div className="card" style={{ borderTop: '4px solid rgb(var(--primary))' }}>
                            <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Quizzes</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.quizzes}</p>
                        </div>
                    </div>

                    <div className="card mt-10">
                        <h2 className="text-xl font-bold dark:text-white mb-6">Quick Actions</h2>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/teacher/courses" className="btn btn-primary"><FiPlusSquare /> Create New Course</Link>
                            <Link to="/teacher/quizzes" className="btn btn-primary"><FiEdit /> Create Quiz</Link>
                            <Link to="/teacher/groups" className="btn btn-outline"><FiUsers /> Form a Group</Link>
                            <Link to="/teacher/map" className="btn btn-outline"><FiMap /> Review Live Disaster Map</Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default TeacherDashboard;
