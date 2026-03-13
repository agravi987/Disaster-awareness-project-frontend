/**
 * src/pages/teacher/CourseEditor.jsx
 * 
 * Teacher can edit course details (title, description, category, thumbnail)
 * and manage lessons (add/edit/delete lessons, materials, videos).
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, updateCourse, addLesson, deleteLesson } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/Toast';

function CourseEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Lesson form state
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', material: '' });
    const [lessonSaving, setLessonSaving] = useState(false);

    const fetchCourse = async () => {
        try {
            const { data } = await getCourseById(id);
            setCourse(data);
        } catch (err) {
            toast.error('Failed to load course');
            navigate('/teacher/courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const handleCourseUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateCourse(id, {
                title: course.title,
                description: course.description,
                category: course.category,
                enrollmentType: course.enrollmentType,
                thumbnail: course.thumbnail
            });
            toast.success('Course details saved!');
        } catch (err) {
            toast.error('Failed to save course');
        } finally {
            setSaving(false);
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        setLessonSaving(true);
        try {
            await addLesson(id, lessonForm);
            setLessonForm({ title: '', videoUrl: '', material: '' });
            setShowLessonForm(false);
            toast.success('Lesson added!');
            fetchCourse(); // refresh
        } catch (err) {
            toast.error('Failed to add lesson');
        } finally {
            setLessonSaving(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Delete this lesson?')) return;
        try {
            await deleteLesson(id, lessonId);
            toast.success('Lesson deleted');
            fetchCourse(); // refresh
        } catch (err) {
            toast.error('Failed to delete lesson');
        }
    };

    if (loading) return <div className="spinner" />;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">Edit Course</h1>
                <button className="btn btn-outline" onClick={() => navigate('/teacher/courses')}>
                    Back to Courses
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>

                {/* Left Column: Course Details */}
                <div className="card">
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.5rem' }}>Course Info</h2>
                    <form onSubmit={handleCourseUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Course Title</label>
                            <input type="text" value={course.title} onChange={e => setCourse({ ...course, title: e.target.value })} required />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Category</label>
                            <select value={course.category} onChange={e => setCourse({ ...course, category: e.target.value })}>
                                <option value="General">General</option>
                                <option value="Earthquake Safety">Earthquake Safety</option>
                                <option value="Fire Safety">Fire Safety</option>
                                <option value="Flood Safety">Flood Safety</option>
                                <option value="Hurricane Prep">Hurricane Prep</option>
                                <option value="First Aid">First Aid</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Enrollment Type</label>
                            <select value={course.enrollmentType || 'optional'} onChange={e => setCourse({ ...course, enrollmentType: e.target.value })}>
                                <option value="optional">Optional (Students can unenroll)</option>
                                <option value="mandatory">Mandatory (Assigned by you)</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Description</label>
                            <textarea rows={4} value={course.description} onChange={e => setCourse({ ...course, description: e.target.value })} />
                        </div>

                        {/* Cloudinary Image Upload */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <ImageUpload
                                label="Thumbnail Image"
                                value={course.thumbnail || ''}
                                onChange={(url) => setCourse({ ...course, thumbnail: url })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {saving ? 'Saving...' : 'Save Course Info'}
                        </button>
                    </form>
                </div>

                {/* Right Column: Lessons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.2rem' }}>Lessons ({course.lessons?.length || 0})</h2>
                        <button className="btn btn-success btn-sm" onClick={() => setShowLessonForm(!showLessonForm)}>
                            {showLessonForm ? 'Cancel' : '➕ Add Lesson'}
                        </button>
                    </div>

                    {showLessonForm && (
                        <div className="card bg-slate-50 dark:bg-slate-800/60" style={{ border: '1px dashed rgb(var(--border))' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>New Lesson</h3>
                            <form onSubmit={handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Lesson Title</label>
                                    <input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>YouTube Video URL (Optional)</label>
                                    <input type="url" placeholder="https://youtube.com/watch?v=..." value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Reading Material (Optional)</label>
                                    <textarea rows={5} placeholder="Text content, instructions..." value={lessonForm.material} onChange={e => setLessonForm({ ...lessonForm, material: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-success" disabled={lessonSaving}>
                                    {lessonSaving ? 'Saving...' : 'Save Lesson'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {course.lessons?.map((lesson, idx) => (
                            <div key={lesson._id} className="card" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span className="badge badge-primary">{idx + 1}</span>
                                        <h3 style={{ fontSize: '1.05rem' }}>{lesson.title}</h3>
                                    </div>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLesson(lesson._id)}>Delete</button>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'rgb(var(--text-muted))' }}>
                                    {lesson.videoUrl && <span>📹 Video Attached</span>}
                                    {lesson.material && <span>📄 Material Attached</span>}
                                    {lesson.quiz && <span>📝 Quiz Attached</span>}
                                </div>
                            </div>
                        ))}
                        {course.lessons?.length === 0 && !showLessonForm && (
                            <p style={{ color: 'rgb(var(--text-muted))', textAlign: 'center', padding: '1rem' }}>No lessons added yet.</p>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}

export default CourseEditor;
