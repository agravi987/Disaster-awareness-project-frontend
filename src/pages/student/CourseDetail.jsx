/**
 * src/pages/student/CourseDetail.jsx - Full Course View
 * 
 * Shows all lessons in a course with a video player and materials.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseById } from '../../services/api';

function CourseDetail() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await getCourseById(id);
                setCourse(data);
                if (data.lessons && data.lessons.length > 0) {
                    setActiveLesson(data.lessons[0]);
                }
            } catch (err) {
                console.error('Failed to load course details');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    if (loading) return <div className="spinner" />;
    if (!course) return <div className="alert alert-error">Course not found.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <div>
                    <span className="badge badge-info">{course.category}</span>
                    <h1 className="page-title" style={{ marginTop: '0.5rem' }}>{course.title}</h1>
                    <p className="subtitle">{course.description}</p>
                </div>
                <Link to="/student/learning" className="btn btn-outline">Back to My Learning</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>

                {/* Main Content Area (Video & Material) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {activeLesson ? (
                        <>
                            {activeLesson.videoUrl ? (
                                <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                                    <iframe
                                        src={activeLesson.videoUrl.replace('watch?v=', 'embed/')}
                                        title={activeLesson.title}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="card" style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f5' }}>
                                    <p style={{ color: 'rgb(var(--text-muted))' }}>No video available for this lesson.</p>
                                </div>
                            )}

                            <div className="card">
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{activeLesson.title}</h2>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'rgb(var(--text))' }}>
                                    {activeLesson.material || 'No reading material provided.'}
                                </div>

                                {activeLesson.quiz && (
                                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgb(var(--border))' }}>
                                        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Lesson Quiz</h3>
                                        <p style={{ color: 'rgb(var(--text-muted))', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                            Test your knowledge on this lesson.
                                        </p>
                                        <Link to={`/student/quizzes/${activeLesson.quiz}`} className="btn btn-primary">
                                            Take Quiz Now
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'rgb(var(--text-muted))' }}>This course has no lessons yet.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar (Lesson List) */}
                <div className="card" style={{ position: 'sticky', top: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgb(var(--border))' }}>
                        Course Content
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {course.lessons?.map((lesson, idx) => (
                            <button
                                key={lesson._id}
                                onClick={() => setActiveLesson(lesson)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    background: activeLesson?._id === lesson._id ? 'rgb(var(--primary-light))' : 'transparent',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: activeLesson?._id === lesson._id ? 'rgb(var(--primary-dark))' : 'rgb(var(--text))',
                                    textAlign: 'left',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: activeLesson?._id === lesson._id ? 'rgb(var(--primary))' : 'rgb(var(--border))',
                                    color: activeLesson?._id === lesson._id ? '#fff' : 'rgb(var(--text))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    flexShrink: 0
                                }}>
                                    {idx + 1}
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: activeLesson?._id === lesson._id ? '600' : '400' }}>
                                    {lesson.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CourseDetail;
