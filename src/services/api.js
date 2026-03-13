/**
 * src/services/api.js - Axios API Service Layer
 * 
 * Centralizes all HTTP requests to the backend.
 * 
 * Benefits of this approach:
 *   1. The base URL is set once here (not scattered across components)
 *   2. The Authorization header is automatically added to every request
 *      using Axios request interceptors
 *   3. If the API URL changes (e.g., when deploying to production),
 *      you only change it in ONE place
 * 
 * Usage in a component:
 *   import api from '../services/api';
 *   const data = await api.get('/courses');
 */

import axios from 'axios';

/**
 * Create an Axios instance with the backend base URL.
 * When using Vite's proxy (vite.config.js), /api requests go to localhost:5000.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

/**
 * Request Interceptor
 * 
 * Runs before EVERY request this instance makes.
 * Reads the JWT from localStorage and adds it to the Authorization header.
 * This way, every protected API call is automatically authenticated.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// ─── Students (Teacher Only) ───────────────────────────────────────────────────
export const getStudents = () => api.get('/users/students');
export const getStudentById = (id) => api.get(`/users/students/${id}`);
export const createStudent = (data) => api.post('/users/students', data);
export const updateStudent = (id, data) => api.put(`/users/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/users/students/${id}`);

// ─── Groups ───────────────────────────────────────────────────────────────────
export const getGroups = () => api.get('/groups');
export const createGroup = (data) => api.post('/groups', data);
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);

// ─── Courses ──────────────────────────────────────────────────────────────────
export const getCourses = () => api.get('/courses');
export const getCourseById = (id) => api.get(`/courses/${id}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
export const addLesson = (courseId, data) => api.post(`/courses/${courseId}/lessons`, data);
export const updateLesson = (courseId, lessonId, data) => api.put(`/courses/${courseId}/lessons/${lessonId}`, data);
export const deleteLesson = (courseId, lessonId) => api.delete(`/courses/${courseId}/lessons/${lessonId}`);
export const enrollCourse = (id) => api.post(`/courses/${id}/enroll`);
export const unenrollCourse = (id) => api.post(`/courses/${id}/unenroll`);
export const getEnrolledCourses = () => api.get('/courses/enrolled');
export const assignCourse = (id, data) => api.post(`/courses/${id}/assign`, data);

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const getQuizzes     = ()         => api.get('/quizzes');
export const getQuizById    = (id)        => api.get(`/quizzes/${id}`);
export const createQuiz     = (data)      => api.post('/quizzes', data);
export const updateQuiz     = (id, data)  => api.put(`/quizzes/${id}`, data);
export const deleteQuiz     = (id)        => api.delete(`/quizzes/${id}`);
export const assignQuiz     = (id, data)  => api.post(`/quizzes/${id}/assign`, data);
export const generateQuizAI = (data)      => api.post('/quizzes/generate', data);
export const submitQuiz     = (id, data)  => api.post(`/quizzes/${id}/submit`, data);
export const getMyResult    = (id)        => api.get(`/quizzes/${id}/result`);
export const getQuizAttempts = (id)       => api.get(`/quizzes/${id}/attempts`);

// ─── Upload ────────────────────────────────────────────────────────────────────
export const uploadImage = (formData) =>
    api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ─── News ──────────────────────────────────────────────────────────────────────
export const getDisasterNews = () => api.get('/news');

export default api;
