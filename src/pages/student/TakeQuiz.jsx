/**
 * src/pages/student/TakeQuiz.jsx - Active Quiz Session
 * 
 * Renders the quiz questions with radio options.
 * Collects answers and submits to the backend.
 * Shows immediate results upon submission.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById, submitQuiz, getMyResult } from '../../services/api';
import { useToast } from '../../components/Toast';

function TakeQuiz() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({}); // Changed to object
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // { score, total }

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                // First check if already submitted
                try {
                    const res = await getMyResult(id);
                    if (res.data) {
                        setResult({ score: res.data.submission.score, total: res.data.total });
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    // 404 means not submitted yet, which is fine
                }

                const { data } = await getQuizById(id);
                setQuiz(data);
                // Initialize answers object (no need to pre-fill with nulls for object)
            } catch (err) {
                console.error('Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const handleOptionSelect = (qIndex, optionIndex) => {
        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [qIndex]: optionIndex
        }));
    };

    const handleSubmit = async () => {
        // Check if all questions are answered
        const answeredCount = Object.keys(answers).length;
        if (quiz && answeredCount < quiz.questions.length) {
            toast.error('Please answer all questions before submitting');
            return;
        }

        setSubmitting(true);
        try {
            // Convert answers object to an ordered array of indices for the backend
            const answersArray = quiz.questions.map((q, i) => answers[i] ?? null);
            
            const { data } = await submitQuiz(id, { answers: answersArray });
            setResult({ score: data.score, total: data.total }); // Keep original behavior of showing results
            toast.success('Quiz submitted successfully!');
            // navigate('/student/quizzes'); // Removed navigation to keep original behavior
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="spinner" />;

    // Display results if already submitted or just finished
    if (result) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '3rem' }}>
                <div className="card">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h2>Quiz Completed!</h2>
                    <p style={{ margin: '1rem 0' }}>Your final score is:</p>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: 'rgb(var(--success))', marginBottom: '2rem' }}>
                        {result.score} / {result.total}
                    </div>
                    <button className="btn btn-outline" onClick={() => navigate('/student/quizzes')} style={{ width: '100%', justifyContent: 'center' }}>
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    // Display quiz form
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{quiz?.title}</h1>
                    <p className="subtitle">{quiz?.description}</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/student/quizzes')}>
                    Cancel
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {quiz?.questions.map((q, qIndex) => (
                    <div key={qIndex} className="card">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                            <span style={{ color: 'rgb(var(--primary))' }}>{qIndex + 1}.</span> {q.questionText}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {q.options.map((option, optIndex) => (
                                <label
                                    key={optIndex}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.8rem 1rem',
                                        background: answers[qIndex] === optIndex ? 'rgb(var(--primary-light))' : 'rgb(var(--bg))',
                                        border: `1px solid ${answers[qIndex] === optIndex ? 'rgb(var(--primary))' : 'rgb(var(--border))'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${qIndex}`}
                                        checked={answers[qIndex] === optIndex}
                                        onChange={() => handleOptionSelect(qIndex, optIndex)}
                                        style={{ width: '18px', height: '18px', accentColor: 'rgb(var(--primary))' }}
                                    />
                                    <span style={{ fontSize: '0.95rem' }}>{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: 'rgb(var(--text-muted))' }}>
                        Answered: {Object.keys(answers).length} / {quiz?.questions.length}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={submitting || (quiz && Object.keys(answers).length < quiz.questions.length)}
                    >
                        {submitting ? 'Submitting...' : 'Submit Final Answers'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TakeQuiz;
