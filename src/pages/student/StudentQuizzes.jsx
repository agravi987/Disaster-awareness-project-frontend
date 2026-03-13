/**
 * src/pages/student/StudentQuizzes.jsx - Quizzes List Page
 * 
 * Displays all quizzes assigned to the student (directly or via group).
 * Shows if the quiz has been attempted and the score.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiCheckCircle, FiEdit3 } from 'react-icons/fi';

function StudentQuizzes() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const { data } = await getQuizzes();
                setQuizzes(data);
            } catch (err) {
                console.error('Failed to fetch quizzes:', err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    if (loading) return <div className="spinner" />;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Assigned Quizzes</h1>
                <p className="subtitle">Quizzes assigned to you by your instructors.</p>
            </div>

            {quizzes.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="flex justify-center mb-4">
                        <FiCheckCircle className="text-6xl text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">You're all caught up!</h3>
                    <p className="text-slate-500 dark:text-slate-400">No quizzes assigned yet.</p>
                </div>
            ) : (
                <div className="grid-3">
                    {quizzes.map((quiz) => {
                        // Find if current student already submitted this quiz
                        const mySubmission = quiz.submissions?.find(
                            (s) => s.student.toString() === user._id
                        );
                        const totalQ = quiz.questions?.length || 0;

                        return (
                            <div key={quiz._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1 }}>
                                    {mySubmission ? (
                                        <span className="badge badge-success" style={{ marginBottom: '0.8rem' }}>✓ Completed</span>
                                    ) : (
                                        <span className="badge badge-warning" style={{ marginBottom: '0.8rem' }}>! Pending</span>
                                    )}

                                    <h3 className="text-lg font-bold dark:text-white mb-2 mr-2">{quiz.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        {quiz.description}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-4">
                                        {totalQ} questions
                                    </p>
                                </div>

                                {mySubmission ? (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Your Score</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                            {mySubmission.score} <span className="text-sm text-slate-400 dark:text-slate-500">/ {totalQ}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <Link to={`/student/quizzes/${quiz._id}`} className="btn btn-primary w-full justify-center">
                                        Take Quiz Now
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default StudentQuizzes;
