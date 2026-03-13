/**
 * src/pages/teacher/ManageCourses.jsx
 * 
 * Lists courses created by the teacher. Links to CourseEditor.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses, createCourse, deleteCourse, assignCourse, getGroups, getStudents } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { FiPlusSquare } from 'react-icons/fi';

function ManageCourses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [courses, setCourses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Assignment states
    const [assigningCourseId, setAssigningCourseId] = useState(null);
    const [assignForm, setAssignForm] = useState({ studentIds: [], groupIds: [] });

    const fetchCourses = async () => {
        try {
            const [coursesRes, groupsRes, studentsRes] = await Promise.all([
                getCourses(),
                getGroups(),
                getStudents()
            ]);
            // filter for this teacher's courses
            setCourses(coursesRes.data.filter(c => c.teacher?._id === user._id || c.teacher === user._id));
            setGroups(groupsRes.data);
            setStudents(studentsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [user._id]);

    const handleCreateDraft = async () => {
        try {
            const { data } = await createCourse({
                title: 'New Course Draft',
                category: 'General',
                description: 'Edit this description...'
            });
            navigate(`/teacher/courses/${data._id}/edit`);
        } catch (err) {
            toast.error('Failed to create course draft');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this course completely?')) return;
        try {
            await deleteCourse(id);
            setCourses(courses.filter(c => c._id !== id));
            toast.success('Course deleted');
        } catch (err) {
            toast.error('Failed to delete course');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await assignCourse(assigningCourseId, assignForm);
            toast.success('Course assigned successfully!');
            setAssigningCourseId(null);
            setAssignForm({ studentIds: [], groupIds: [] });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign course');
        }
    };

    const toggleAssignSelection = (type, id) => {
        const arr = [...assignForm[type]];
        if (arr.includes(id)) {
            setAssignForm({ ...assignForm, [type]: arr.filter(i => i !== id) });
        } else {
            setAssignForm({ ...assignForm, [type]: [...arr, id] });
        }
    };

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title dark:text-white">Manage Courses</h1>
                <button className="btn btn-primary flex items-center gap-2" onClick={handleCreateDraft}>
                    <FiPlusSquare /> Create New Course
                </button>
            </div>

            {/* Assignment Modal (Inline) */}
            {assigningCourseId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Assign Course</h2>
                        <form onSubmit={handleAssignSubmit}>
                            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>

                                <div>
                                    <h3 className="text-base font-bold mb-3 dark:text-white">Select Groups</h3>
                                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                        {groups.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No groups found</p>}
                                        {groups.map(g => (
                                            <label key={g._id} className="flex items-center gap-2 cursor-pointer text-sm dark:text-slate-300">
                                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary" checked={assignForm.groupIds.includes(g._id)} onChange={() => toggleAssignSelection('groupIds', g._id)} />
                                                {g.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-base font-bold mb-3 dark:text-white">Select Individual Students</h3>
                                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                        {students.map(s => (
                                            <label key={s._id} className="flex items-center gap-2 cursor-pointer text-sm dark:text-slate-300">
                                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary" checked={assignForm.studentIds.includes(s._id)} onChange={() => toggleAssignSelection('studentIds', s._id)} />
                                                {s.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" className="btn btn-outline" onClick={() => { setAssigningCourseId(null); setAssignForm({ groupIds: [], studentIds: [] }); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Confirm Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-wrapper card mt-6">
                <table>
                    <thead>
                        <tr>
                            <th>Course Title</th>
                            <th>Category</th>
                            <th>Lessons</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No courses yet. Click create to start building one.</td></tr>
                        ) : (
                            courses.map(course => (
                                <tr key={course._id}>
                                    <td style={{ fontWeight: 500 }}>{course.title}</td>
                                    <td><span className="badge badge-info">{course.category}</span></td>
                                    <td>{course.lessons?.length || 0}</td>
                                    <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-outline btn-sm" onClick={() => setAssigningCourseId(course._id)}>Assign</button>
                                            <Link to={`/teacher/courses/${course._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ManageCourses;
