/**
 * src/pages/teacher/ManageQuizzes.jsx
 * 
 * Lists quizzes, allows creating new quizzes, assigning them,
 * and viewing student attempt results.
 */

import React, { useEffect, useState } from 'react';
import { getQuizzes, createQuiz, deleteQuiz, assignQuiz, getGroups, getStudents, generateQuizAI, getQuizAttempts } from '../../services/api';
import { useToast } from '../../components/Toast';
import { FiBarChart2, FiX } from 'react-icons/fi';

function ManageQuizzes() {
    const { toast } = useToast();
    const [quizzes, setQuizzes] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [quizForm, setQuizForm] = useState({ title: '', description: '', questions: [] });
    const [newQuestion, setNewQuestion] = useState({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
    const [creating, setCreating] = useState(false);

    // AI Generation states
    const [aiForm, setAiForm] = useState({ topic: '', count: 3 });
    const [isGenerating, setIsGenerating] = useState(false);

    // Assignment states
    const [assigningQuizId, setAssigningQuizId] = useState(null);
    const [assignForm, setAssignForm] = useState({ studentIds: [], groupIds: [] });
    const [assigning, setAssigning] = useState(false);

    // Attempts modal states
    const [attemptsQuiz, setAttemptsQuiz] = useState(null); // { id, title }
    const [attempts, setAttempts] = useState([]);
    const [attemptsLoading, setAttemptsLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [qzRes, grRes, stRes] = await Promise.all([getQuizzes(), getGroups(), getStudents()]);
            setQuizzes(qzRes.data);
            setGroups(grRes.data);
            setStudents(stRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOptionChange = (idx, val) => {
        const opts = [...newQuestion.options];
        opts[idx] = val;
        setNewQuestion({ ...newQuestion, options: opts });
    };

    const handleAddQuestion = () => {
        if (!newQuestion.questionText || newQuestion.options.some(o => o.trim() === '')) {
            toast.error('Fill all question fields and options');
            return;
        }
        setQuizForm({
            ...quizForm,
            questions: [...quizForm.questions, newQuestion]
        });
        // Reset question form
        setNewQuestion({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        if (quizForm.questions.length === 0) {
            toast.error('Add at least one question');
            return;
        }
        setCreating(true);
        try {
            await createQuiz(quizForm);
            setQuizForm({ title: '', description: '', questions: [] });
            setShowCreateForm(false);
            toast.success('Quiz created successfully!');
            fetchData();
        } catch (err) {
            toast.error('Failed to create quiz');
        } finally {
            setCreating(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!aiForm.topic) {
            toast.error('Please enter a topic for the AI');
            return;
        }
        setIsGenerating(true);
        try {
            const { data } = await generateQuizAI(aiForm);
            if (data && Array.isArray(data)) {
                setQuizForm({
                    ...quizForm,
                    questions: [...quizForm.questions, ...data]
                });
                toast.success(`Generated ${data.length} questions!`);
                setAiForm({ topic: '', count: 3 });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate questions. Check API key and quota.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (!window.confirm('Delete this quiz? This cannot be undone.')) return;
        try {
            await deleteQuiz(id);
            setQuizzes(quizzes.filter(q => q._id !== id));
            toast.success('Quiz deleted');
        } catch (err) {
            toast.error('Failed to delete quiz');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (assignForm.studentIds.length === 0 && assignForm.groupIds.length === 0) {
            toast.error('Select at least one student or group');
            return;
        }
        setAssigning(true);
        try {
            await assignQuiz(assigningQuizId, assignForm);
            toast.success('Quiz assigned successfully!');
            setAssigningQuizId(null);
            setAssignForm({ studentIds: [], groupIds: [] });
            fetchData();
        } catch (err) {
            toast.error('Failed to assign quiz');
        } finally {
            setAssigning(false);
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

    const handleViewAttempts = async (quiz) => {
        setAttemptsQuiz({ id: quiz._id, title: quiz.title });
        setAttemptsLoading(true);
        try {
            const { data } = await getQuizAttempts(quiz._id);
            setAttempts(data.attempts || []);
        } catch (err) {
            toast.error('Failed to load attempts');
            setAttemptsQuiz(null);
        } finally {
            setAttemptsLoading(false);
        }
    };

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Manage Quizzes</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? 'Cancel Creation' : '➕ Create Quiz'}
                </button>
            </div>

            {showCreateForm && (
                <div className="card" style={{ marginBottom: '2.5rem', borderTop: '4px solid rgb(var(--primary))' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Create New Quiz</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '2rem' }}>

                        {/* Quiz Info & Question Builder */}
                        <div>
                            <div className="form-group">
                                <label>Quiz Title</label>
                                <input type="text" value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} />
                            </div>

                            {/* AI Generator */}
                            <div className="bg-[rgb(var(--bg))] p-4 rounded-lg border border-[rgb(var(--border))] mt-6">
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🤖 AI Quiz Generator (powered by LLM)</h3>
                                <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Topic</label>
                                        <input type="text" placeholder="e.g. Earthquakes, Flood Safety" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Number of Questions</label>
                                        <input type="number" min="1" max="10" value={aiForm.count} onChange={e => setAiForm({ ...aiForm, count: parseInt(e.target.value) || 1 })} />
                                    </div>
                                </div>
                                <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerateAI} disabled={isGenerating}>
                                    {isGenerating ? 'Generating...' : '🪄 Generate Questions'}
                                </button>
                            </div>

                            {/* Manual question builder */}
                            <div className="bg-[rgb(var(--bg))] p-4 rounded-lg border border-[rgb(var(--border))] mt-4">
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Manually Add Question</h3>
                                <div className="form-group">
                                    <label>Question Text</label>
                                    <input type="text" value={newQuestion.questionText} onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })} />
                                </div>

                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Options & Correct Answer</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {[0, 1, 2, 3].map(idx => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={newQuestion.correctAnswerIndex === idx}
                                                onChange={() => setNewQuestion({ ...newQuestion, correctAnswerIndex: idx })}
                                                title="Mark as correct answer"
                                            />
                                            <input
                                                type="text"
                                                placeholder={`Option ${idx + 1}`}
                                                value={newQuestion.options[idx]}
                                                onChange={e => handleOptionChange(idx, e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAddQuestion}>
                                    + Add Question to Quiz
                                </button>
                            </div>
                        </div>

                        {/* Added Questions List & Final Submit */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Questions ({quizForm.questions.length})</h3>
                                {quizForm.questions.length === 0 ? (
                                    <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.9rem' }}>No questions added yet. Use the form to build your quiz.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {quizForm.questions.map((q, qIdx) => (
                                            <div key={qIdx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3" style={{ position: 'relative' }}>
                                                <button type="button" className="btn btn-sm btn-danger" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.2rem 0.6rem' }} onClick={() => setQuizForm({...quizForm, questions: quizForm.questions.filter((_, i) => i !== qIdx)})}>
                                                    ✕
                                                </button>
                                                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', paddingRight: '2rem' }}>{qIdx + 1}. {q.questionText}</p>
                                                <ul style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'rgb(var(--text-muted))' }}>
                                                    {q.options.map((opt, oIdx) => (
                                                        <li key={oIdx} style={{ color: q.correctAnswerIndex === oIdx ? 'rgb(var(--success))' : 'inherit', fontWeight: q.correctAnswerIndex === oIdx ? 600 : 400 }}>
                                                            {opt} {q.correctAnswerIndex === oIdx && '✓'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgb(var(--border))' }}>
                                <button
                                    className="btn btn-success"
                                    onClick={handleCreateQuiz}
                                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                                    disabled={quizForm.questions.length === 0 || !quizForm.title || creating}
                                >
                                    {creating ? 'Saving...' : 'Save Complete Quiz'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}


            {/* Assignment Modal */}
            {assigningQuizId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Assign Quiz</h2>
                            <button className="btn btn-sm btn-outline" onClick={() => { setAssigningQuizId(null); setAssignForm({ groupIds: [], studentIds: [] }); }}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleAssignSubmit}>
                            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Select Groups</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgb(var(--border))', padding: '0.75rem', borderRadius: '6px' }}>
                                        {groups.length === 0 && <p style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))' }}>No groups found</p>}
                                        {groups.map(g => (
                                            <label key={g._id} style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input type="checkbox" checked={assignForm.groupIds.includes(g._id)} onChange={() => toggleAssignSelection('groupIds', g._id)} />
                                                {g.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Select Individual Students</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgb(var(--border))', padding: '0.75rem', borderRadius: '6px' }}>
                                        {students.map(s => (
                                            <label key={s._id} style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input type="checkbox" checked={assignForm.studentIds.includes(s._id)} onChange={() => toggleAssignSelection('studentIds', s._id)} />
                                                {s.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => { setAssigningQuizId(null); setAssignForm({ groupIds: [], studentIds: [] }); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={assigning}>
                                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attempts Modal */}
            {attemptsQuiz && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ marginBottom: '0.2rem' }}>Student Attempts</h2>
                                <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-muted))' }}>{attemptsQuiz.title}</p>
                            </div>
                            <button className="btn btn-sm btn-outline" onClick={() => setAttemptsQuiz(null)}>
                                <FiX />
                            </button>
                        </div>

                        {attemptsLoading ? (
                            <div className="spinner" />
                        ) : attempts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgb(var(--text-muted))' }}>
                                <FiBarChart2 size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                                <p>No submissions yet for this quiz.</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary bar */}
                                <div className="grid-3" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center border border-[rgb(var(--border))]">
                                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'rgb(var(--primary))' }}>{attempts.length}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>Total Attempts</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center border border-[rgb(var(--border))]">
                                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'rgb(var(--success))' }}>
                                            {Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length)}%
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>Avg. Score</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center border border-[rgb(var(--border))]">
                                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'rgb(var(--info))' }}>
                                            {Math.max(...attempts.map(a => a.percentage))}%
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>Top Score</p>
                                    </div>
                                </div>

                                {/* Attempts table */}
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Email</th>
                                                <th>Score</th>
                                                <th>Result</th>
                                                <th>Submitted</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attempts.map((a, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: 500 }}>{a.studentName}</td>
                                                    <td style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem' }}>{a.studentEmail}</td>
                                                    <td><strong>{a.score}</strong> / {a.total}</td>
                                                    <td>
                                                        <span className={`badge ${a.percentage >= 70 ? 'badge-success' : a.percentage >= 40 ? 'badge-warning' : 'badge-primary'}`}>
                                                            {a.percentage}%
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>
                                                        {new Date(a.submittedAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Quiz List */}
            <div className="grid-3">
                {quizzes.map(q => (
                    <div key={q._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{q.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))', marginBottom: '1rem' }}>{q.description}</p>

                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'rgb(var(--text))', marginBottom: '1rem', alignItems: 'center' }}>
                                <span><strong>{q.questions.length}</strong> Qs</span>
                                <span>•</span>
                                <span><strong>{q.submissions?.length || 0}</strong> Submissions</span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', marginBottom: '1.5rem', background: 'rgb(var(--bg))', padding: '0.5rem', borderRadius: '6px' }}>
                                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Assigned To:</strong>
                                {q.assignedGroups?.length > 0 || q.assignedStudents?.length > 0 ? (
                                    <>
                                        {q.assignedGroups?.length > 0 && <div>{q.assignedGroups.length} Groups</div>}
                                        {q.assignedStudents?.length > 0 && <div>{q.assignedStudents.length} Students</div>}
                                    </>
                                ) : (
                                    <span>Unassigned</span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAssigningQuizId(q._id)}>Assign</button>
                            <button className="btn btn-info btn-sm" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => handleViewAttempts(q)}>
                                <FiBarChart2 size={13} /> Results
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(q._id)}>Delete</button>
                        </div>
                    </div>
                ))}
                {quizzes.length === 0 && <p className="col-span-3 text-center my-8 text-muted">No quizzes created yet.</p>}
            </div>
        </div>
    );
}

export default ManageQuizzes;
