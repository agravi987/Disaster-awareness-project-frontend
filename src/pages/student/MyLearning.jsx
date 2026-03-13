/**
 * src/pages/student/MyLearning.jsx - My Learning Page
 * 
 * Shows all courses the student has enrolled in.
 * Each course shows its lessons with video and material links.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEnrolledCourses, unenrollCourse } from '../../services/api';
import { FiBookOpen, FiUser, FiPlayCircle, FiFileText } from 'react-icons/fi';

function MyLearning() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrolled = async () => {
            try {
                const { data } = await getEnrolledCourses();
                setCourses(data);
            } catch (err) {
                console.error('Failed to fetch enrolled courses:', err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEnrolled();
    }, []);

    const handleUnenroll = async (courseId) => {
        if (!window.confirm("Are you sure you want to unenroll from this course?")) return;
        try {
            await unenrollCourse(courseId);
            setCourses(courses.filter(c => c._id !== courseId));
            alert('Successfully unenrolled.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unenroll');
        }
    };

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📚 My Learning</h1>
            </div>

            {courses.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="flex justify-center mb-4">
                        <FiBookOpen className="text-6xl text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">No Enrolled Courses Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        Go to <Link to="/student" className="text-primary hover:underline font-medium">Home</Link> and enroll in a course to get started!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {courses.map((course) => (
                        <div key={course._id} className="card">
                            {/* Course Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div className="flex gap-2 mb-3">
                                        <span className="badge badge-info">{course.category}</span>
                                        {course.enrollmentType === 'mandatory' ? (
                                            <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Mandatory</span>
                                        ) : (
                                            <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Optional</span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold dark:text-white mb-2">{course.title}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{course.description}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <FiUser /> Teacher: {course.teacher?.name}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 items-end shrink-0">
                                    <Link to={`/student/courses/${course._id}`} className="btn btn-primary btn-sm">
                                        View Full Course
                                    </Link>
                                    {course.enrollmentType !== 'mandatory' && (
                                        <button onClick={() => handleUnenroll(course._id)} className="btn btn-outline btn-sm" style={{ borderColor: 'rgb(var(--danger))', color: 'rgb(var(--danger))' }}>
                                            Unenroll
                                        </button>
                                    )}
                                </div>
                            </div>

                            {course.lessons && course.lessons.length > 0 ? (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                                        Lessons ({course.lessons.length})
                                    </h4>
                                    <div className="flex flex-col gap-3">
                                        {course.lessons.map((lesson, idx) => (
                                            <div key={lesson._id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 transition hover:border-slate-300 dark:hover:border-slate-600">
                                                <span className="w-8 h-8 flex-shrink-0 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm dark:text-slate-200 truncate">{lesson.title}</div>
                                                    <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                        {lesson.videoUrl && (
                                                            <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                                                                <FiPlayCircle className="text-sm cursor-pointer" /> Watch Video
                                                            </a>
                                                        )}
                                                        {lesson.material && (
                                                            <span className="flex items-center gap-1.5 cursor-pointer">
                                                                <FiFileText className="text-sm" /> Material Available
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {lesson.quiz && (
                                                    <Link to={`/student/quizzes/${lesson.quiz}`} className="btn btn-primary btn-sm shrink-0">
                                                        Take Quiz
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem' }}>No lessons added yet.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyLearning;
