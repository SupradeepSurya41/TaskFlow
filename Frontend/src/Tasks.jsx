import React, { useState } from 'react';
import { createTask, updateTaskStatus, deleteTask } from './api';

const STATUS_NEXT  = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function Tasks({ user, users, projects, tasks, setTasks }) {
  const isAdmin = user?.role === 'admin';

  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [showForm,      setShowForm]      = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [dbError,       setDbError]       = useState('');
  const [form, setForm] = useState({
    title: '', description: '', project_id: '', assignee_id: '', due_date: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const visible = tasks.filter(t => {
    if (!isAdmin && t.assignee_id !== user?.id) return false;
    if (projectFilter !== 'all' && t.project_id !== Number(projectFilter)) return false;
    if (statusFilter  !== 'all' && t.status     !== statusFilter)          return false;
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setDbError('');
    if (!form.project_id) { setDbError('Please select a project.'); return; }
    setSubmitting(true);
    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      project_id:  Number(form.project_id),
      assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    };
    const created = await createTask(payload);
    setSubmitting(false);
    if (!created) {
      setDbError('Failed to save task. Check your backend is running.');
      return;
    }
    setTasks(prev => [created, ...prev]);
    setForm({ title: '', description: '', project_id: '', assignee_id: '', due_date: '' });
    setShowForm(false);
    // Poll for AI insights
    setTimeout(async () => {
      const { fetchTasks } = await import('./api');
      const fresh = await fetchTasks();
      if (Array.isArray(fresh) && fresh.length > 0) setTasks(fresh);
    }, 4000);
  };

  const handleStatusChange = async (task) => {
    const next = STATUS_NEXT[task.status];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    await updateTaskStatus(task.id, next);
  };

  const handleDelete = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await deleteTask(taskId);
  };

  const getUserName    = (id) => users.find(u => u.id === id)?.name ?? `User #${id}`;
  const getProjectName = (id) => projects.find(p => p.id === id)?.name ?? `Project #${id}`;
  const isOverdue      = (t)  => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick}
      style={{ padding: '5px 14px', border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`, borderRadius: 20,
        background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#475569',
        fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'inherit' }}>
      {children}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Project filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>Project</span>
            <Pill active={projectFilter === 'all'} onClick={() => setProjectFilter('all')}>All</Pill>
            {projects.map(p => (
              <Pill key={p.id} active={projectFilter === String(p.id)} onClick={() => setProjectFilter(String(p.id))}>
                {p.name}
              </Pill>
            ))}
          </div>
          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>Status</span>
            {['all', 'todo', 'in_progress', 'done'].map(s => (
              <Pill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : STATUS_LABEL[s]}
              </Pill>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{visible.length} task{visible.length !== 1 ? 's' : ''}</span>
          {isAdmin && (
            <button className="tf-btn-primary" onClick={() => { setShowForm(v => !v); setDbError(''); }}>
              {showForm ? 'Cancel' : '+ New Task'}
            </button>
          )}
        </div>
      </div>

      {/* Create task form */}
      {showForm && isAdmin && (
        <div className="tf-card" style={{ padding: 20, marginBottom: 18, borderColor: '#bfdbfe' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 14px' }}>New Task</h3>
          {dbError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#991b1b', fontSize: 13 }}>
              {dbError}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="tf-label">Title *</label>
                <input className="tf-field" placeholder="Task title" value={form.title}
                  onChange={e => set('title', e.target.value)} required />
              </div>
              <div>
                <label className="tf-label">Project *</label>
                {/* Native select — controlled properly */}
                <select
                  className="tf-field"
                  value={form.project_id}
                  onChange={e => set('project_id', e.target.value)}
                  required
                >
                  <option value="">-- Select project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="tf-label">
                  Description&nbsp;
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>(10+ chars triggers AI analysis)</span>
                </label>
                <textarea className="tf-field" rows={2} placeholder="Describe the task..."
                  value={form.description} onChange={e => set('description', e.target.value)}
                  style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="tf-label">Assign To</label>
                {/* Uses live users list — includes newly signed up members */}
                <select
                  className="tf-field"
                  value={form.assignee_id}
                  onChange={e => set('assignee_id', e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {users.map(u => (
                    <option key={u.id} value={String(u.id)}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="tf-label">Due Date</label>
                <input className="tf-field" type="date" value={form.due_date}
                  onChange={e => set('due_date', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="tf-btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Task'}
              </button>
              <button className="tf-btn-secondary" type="button" onClick={() => { setShowForm(false); setDbError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="tf-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 10px', display: 'block' }}>
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b', margin: 0 }}>No tasks found</p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {isAdmin ? 'Create a task to get started.' : 'No tasks assigned to you in this view.'}
          </p>
        </div>
      )}

      {/* Task rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(task => {
          const overdue = isOverdue(task);
          return (
            <div key={task.id} className="tf-card" style={{ padding: '14px 18px', borderLeft: `3px solid ${overdue ? '#dc2626' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{task.title}</h4>
                    {overdue && <span className="badge badge-overdue">Overdue</span>}
                  </div>
                  {task.description && (
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{task.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                    <span>📁 {getProjectName(task.project_id)}</span>
                    {task.assignee_id && <span>👤 {getUserName(task.assignee_id)}</span>}
                    {task.due_date && (
                      <span style={{ color: overdue ? '#dc2626' : '#94a3b8' }}>
                        📅 {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className={`badge badge-${task.status}`}>{STATUS_LABEL[task.status]}</span>
                  <button onClick={() => handleStatusChange(task)}
                    style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 5, background: '#fff', color: '#374151', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Move →
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(task.id)}
                      style={{ width: 26, height: 26, border: '1px solid #fecaca', borderRadius: 5, background: '#fff', color: '#dc2626', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {task.ai_insights && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#0369a1', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Analysis</p>
                  <pre style={{ fontSize: 12, color: '#0c4a6e', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{task.ai_insights}</pre>
                </div>
              )}
              {!task.ai_insights && (task.description?.length ?? 0) > 10 && (
                <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 8, fontStyle: 'italic' }}>AI analysis pending...</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
