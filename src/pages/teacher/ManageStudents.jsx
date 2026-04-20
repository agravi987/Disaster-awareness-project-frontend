/**
 * src/pages/teacher/ManageStudents.jsx
 *
 * Teacher can view, add, edit, and delete student accounts.
 */

import React, { useEffect, useState } from 'react';
import PasswordInput from '../../components/PasswordInput';
import { createStudent, deleteStudent, getStudentProgress, getStudents } from '../../services/api';

function ManageStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [progressLoading, setProgressLoading] = useState(false);

    const fetchStudents = async () => {
        try {
            const { data } = await getStudents();
            setStudents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleAddSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            await createStudent(form);
            setForm({ name: '', email: '', password: '' });
            setShowAddForm(false);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add student');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;

        try {
            await deleteStudent(id);
            setStudents((prev) => prev.filter((student) => student._id !== id));
        } catch (err) {
            alert('Failed to delete student');
        }
    };

    const handleViewProgress = async (student) => {
        setSelectedStudent(student);
        setProgressData(null);
        setProgressLoading(true);

        try {
            const { data } = await getStudentProgress(student._id);
            setProgressData(data);
        } catch (err) {
            alert('Failed to load progress');
        } finally {
            setProgressLoading(false);
        }
    };

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Manage Students</h1>
                <button className="btn btn-primary" onClick={() => setShowAddForm((prev) => !prev)}>
                    {showAddForm ? 'Cancel' : '+ Add New Student'}
                </button>
            </div>

            {showAddForm ? (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Add Student</h2>
                    {error ? <div className="alert alert-error">{error}</div> : null}

                    <form
                        onSubmit={handleAddSubmit}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                            alignItems: 'end',
                        }}
                    >
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) => setForm({ ...form, email: event.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Password</label>
                            <PasswordInput
                                value={form.password}
                                onChange={(event) => setForm({ ...form, password: event.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <button type="submit" className="btn btn-success">
                            Save
                        </button>
                    </form>
                </div>
            ) : null}

            <div className="card table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Joined Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No students found.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student._id}>
                                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                                    <td>{student.email}</td>
                                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleViewProgress(student)}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            View Progress
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(student._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedStudent ? (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(2, 6, 23, 0.52)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 50,
                        padding: '1rem',
                        backdropFilter: 'blur(6px)',
                    }}
                >
                    <div
                        className="card"
                        style={{
                            width: '100%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                gap: '1rem',
                            }}
                        >
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                Progress Log: {selectedStudent.name}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setSelectedStudent(null)}
                                aria-label="Close progress dialog"
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '10px',
                                    border: '1px solid rgb(var(--border))',
                                    background: 'rgb(var(--surface-soft))',
                                    color: 'rgb(var(--text))',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                }}
                            >
                                x
                            </button>
                        </div>

                        {progressLoading ? (
                            <div className="spinner" />
                        ) : progressData ? (
                            <div>
                                <h3
                                    style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '0.5rem',
                                        color: 'rgb(var(--primary))',
                                    }}
                                >
                                    Completed Courses
                                </h3>
                                {progressData.completedCourses?.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                                        {progressData.completedCourses.map((course) => (
                                            <li
                                                key={course._id}
                                                style={{
                                                    padding: '0.65rem 0.5rem',
                                                    borderBottom: '1px solid rgb(var(--border))',
                                                }}
                                            >
                                                Completed: {course.title}
                                                <span
                                                    className="badge badge-info"
                                                    style={{ marginLeft: '0.5rem' }}
                                                >
                                                    {course.category}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ color: 'rgb(var(--text-muted))', marginBottom: '1.5rem' }}>
                                        No completed courses yet.
                                    </p>
                                )}

                                <h3
                                    style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '0.5rem',
                                        color: 'rgb(var(--primary))',
                                    }}
                                >
                                    Completed Quizzes
                                </h3>
                                {progressData.completedQuizzes?.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {progressData.completedQuizzes.map((quiz) => (
                                            <li
                                                key={quiz._id}
                                                style={{
                                                    padding: '0.65rem 0.5rem',
                                                    borderBottom: '1px solid rgb(var(--border))',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    gap: '1rem',
                                                }}
                                            >
                                                <span>Completed: {quiz.title}</span>
                                                <span
                                                    style={{
                                                        fontWeight: 'bold',
                                                        color: 'rgb(var(--success))',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {quiz.score} / {quiz.total}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ color: 'rgb(var(--text-muted))' }}>No completed quizzes yet.</p>
                                )}
                            </div>
                        ) : null}

                        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                            <button className="btn btn-outline" onClick={() => setSelectedStudent(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default ManageStudents;
