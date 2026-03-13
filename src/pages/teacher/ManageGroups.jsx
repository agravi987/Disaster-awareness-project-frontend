/**
 * src/pages/teacher/ManageGroups.jsx
 * 
 * Teacher can create student groups for bulk assignments.
 */

import React, { useEffect, useState } from 'react';
import { getGroups, createGroup, deleteGroup, getStudents } from '../../services/api';

function ManageGroups() {
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', students: [] });

    const fetchData = async () => {
        try {
            const [grpRes, stuRes] = await Promise.all([getGroups(), getStudents()]);
            setGroups(grpRes.data);
            setStudents(stuRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStudentToggle = (studentId) => {
        setForm(prev => {
            const isSelected = prev.students.includes(studentId);
            return {
                ...prev,
                students: isSelected
                    ? prev.students.filter(id => id !== studentId)
                    : [...prev.students, studentId]
            };
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createGroup(form);
            setForm({ name: '', description: '', students: [] });
            setShowAddForm(false);
            fetchData();
        } catch (err) {
            alert('Failed to create group');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete group?')) return;
        try {
            await deleteGroup(id);
            setGroups(groups.filter(g => g._id !== id));
        } catch (err) {
            alert('Failed to delete group');
        }
    };

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Manage Groups</h1>
                <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Cancel' : '➕ Create Group'}
                </button>
            </div>

            {showAddForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2>New Group</h2>
                    <form onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Group Name</label>
                                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Students</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgb(var(--border))', padding: '1rem', borderRadius: '6px' }}>
                                {students.map(s => (
                                    <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.students.includes(s._id)}
                                            onChange={() => handleStudentToggle(s._id)}
                                        />
                                        {s.name}
                                    </label>
                                ))}
                                {students.length === 0 && <p style={{ color: 'rgb(var(--text-muted))' }}>No students available.</p>}
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-success">Save Group</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-3">
                {groups.map(g => (
                    <div key={g._id} className="card">
                        <h3>{g.name}</h3>
                        <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem', marginBottom: '1rem' }}>{g.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgb(var(--border))', paddingTop: '1rem' }}>
                            <span className="badge badge-primary">{g.students.length} Members</span>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}>Delete</button>
                        </div>
                    </div>
                ))}
                {groups.length === 0 && <p>No groups created yet.</p>}
            </div>
        </div>
    );
}

export default ManageGroups;
