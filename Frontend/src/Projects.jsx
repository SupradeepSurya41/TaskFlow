import React, { useState, useEffect, useRef } from 'react';
import { createProject, fetchProjectComments, createProjectComment } from './api';

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function Projects({ user, users, projects, setProjects, tasks }) {
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('projects');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name: '', description: '' });
  const [saving, setSaving]       = useState(false);
  const [dbError, setDbError]     = useState('');

  // --- NEW: State for the Project Detail View & Chat ---
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const chatEndRef = useRef(null);

  // Poll for comments when a project is opened
  useEffect(() => {
    if (!selectedProjectId) return;
    const loadData = () => fetchProjectComments(selectedProjectId).then(setComments);
    loadData(); // Initial load
    const interval = setInterval(loadData, 3000); // Check for new messages every 3 seconds
    return () => clearInterval(interval);
  }, [selectedProjectId]);

  // Auto-scroll chat to the bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setDbError('');
    setSaving(true);
    const p = await createProject(form.name.trim(), form.description.trim());
    setSaving(false);
    if (!p) { setDbError('Failed to save project. Check your backend is running.'); return; }
    setProjects(prev => [...prev, p]);
    setForm({ name: '', description: '' });
    setShowForm(false);
  };

  // --- NEW: Handle sending a project chat message ---
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText(''); // Clear input instantly for better UX
    await createProjectComment(selectedProjectId, user.id, text);
    const updated = await fetchProjectComments(selectedProjectId);
    setComments(updated);
  };

  const taskCount = (pid) => tasks.filter(t => t.project_id === pid).length;
  const doneCount = (pid) => tasks.filter(t => t.project_id === pid && t.status === 'done').length;
  const memberTasks = (uid) => tasks.filter(t => t.assignee_id === uid);
  const getProjectName = (pid) => projects.find(p => p.id === pid)?.name ?? `#${pid}`;
  const getUserName = (uid) => users.find(u => u.id === uid)?.name ?? 'Unknown';

  // --- NEW: Render the Detailed Project View if a project is selected ---
  if (selectedProjectId) {
    const p = projects.find(x => x.id === selectedProjectId);
    const projectTasks = tasks.filter(t => t.project_id === p.id);
    
    // Check if user is an Admin OR assigned to at least one task in this project
    const isAssigned = isAdmin || projectTasks.some(t => t.assignee_id === user.id);

    return (
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 120px)' }}>
        {/* Left Side: Project Details & Tasks */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => setSelectedProjectId(null)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textAlign: 'left', marginBottom: 10, fontWeight: 600, padding: 0 }}>
            ← Back to Projects List
          </button>
          <div className="tf-card" style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 5px', color: '#0f172a' }}>{p.name}</h2>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>{p.description || "No description provided."}</p>
            
            <h3 style={{ fontSize: 14, margin: '0 0 10px', color: '#0f172a' }}>Tasks in this project:</h3>
            {projectTasks.length === 0 ? <p style={{ fontSize: 13, color: '#94a3b8' }}>No tasks yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projectTasks.map(t => (
                  <div key={t.id} style={{ padding: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{t.title}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Assigned to: {t.assignee_id ? getUserName(t.assignee_id) : 'Unassigned'}</span>
                    </div>
                    <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="tf-card" style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: 14, color: '#0f172a' }}>Project Updates & Chat</h3>
          </div>
          
          {isAssigned ? (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {comments.length === 0 && <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No updates yet. Say hello!</p>}
                {comments.map(c => {
                  const isMe = c.user_id === user.id;
                  return (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
                        {isMe ? 'You' : getUserName(c.user_id)} • {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={{ background: isMe ? '#2563eb' : '#e2e8f0', color: isMe ? '#fff' : '#0f172a', padding: '6px 12px', borderRadius: 12, fontSize: 12, maxWidth: '85%' }}>
                        {c.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendComment} style={{ display: 'flex', padding: 10, borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                <input className="tf-field" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Type an update..." style={{ flex: 1, borderRadius: '4px 0 0 4px', borderRight: 'none' }} />
                <button type="submit" className="tf-btn-primary" style={{ borderRadius: '0 4px 4px 0' }}>Send</button>
              </form>
            </>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 10 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <p style={{ margin: 0 }}>You are not assigned to any tasks in this project.<br/>Chat is restricted to project members.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const Tab = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)}
      style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
        fontWeight: activeTab === id ? 600 : 400,
        color: activeTab === id ? '#2563eb' : '#64748b',
        borderBottom: activeTab === id ? '2px solid #2563eb' : '2px solid transparent',
        marginBottom: -1, transition: 'all 0.15s', fontFamily: 'inherit' }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
        <Tab id="projects" label="Projects" />
        <Tab id="team"     label={`Team (${users.length})`} />
      </div>

      {/* ── PROJECTS ── */}
      {activeTab === 'projects' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            {isAdmin && (
              <button className="tf-btn-primary" onClick={() => { setShowForm(v => !v); setDbError(''); }}>
                {showForm ? 'Cancel' : '+ New Project'}
              </button>
            )}
          </div>

          {showForm && isAdmin && (
            <div className="tf-card" style={{ padding: 18, marginBottom: 16, borderColor: '#bfdbfe' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 12px' }}>New Project</h3>
              {dbError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 10, color: '#991b1b', fontSize: 13 }}>
                  {dbError}
                </div>
              )}
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label className="tf-label">Project Name *</label>
                    <input className="tf-field" placeholder="e.g. Fullstack Portal" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="tf-label">Description</label>
                    <input className="tf-field" placeholder="Short description" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="tf-btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Create Project'}
                  </button>
                  <button className="tf-btn-secondary" type="button" onClick={() => { setShowForm(false); setDbError(''); }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="tf-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>No projects yet. {isAdmin ? 'Create one to get started.' : 'Ask an Admin to create a project.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {projects.map(p => {
                const total = taskCount(p.id);
                const done  = doneCount(p.id);
                const pct   = total > 0 ? Math.round((done/total)*100) : 0;
                const assigneeIds = [...new Set(tasks.filter(t => t.project_id === p.id && t.assignee_id).map(t => t.assignee_id))];

                return (
                  <div key={p.id} className="tf-card" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>{p.name}</h3>
                      {p.description && <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px' }}>{p.description}</p>}

                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 5 }}>
                          <span>Progress</span>
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#2563eb', borderRadius: 3 }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                        <span>{total} tasks · {done} done</span>
                        <div style={{ display: 'flex' }}>
                          {assigneeIds.slice(0,4).map((uid, i) => {
                            const u = users.find(x => x.id === uid);
                            return u ? (
                              <div key={uid} title={u.name}
                                style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700, border: '2px solid #fff', marginLeft: i === 0 ? 0 : -5 }}>
                                {u.name.slice(0,2).toUpperCase()}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* --- NEW: Open Project Button --- */}
                    <button 
                      onClick={() => setSelectedProjectId(p.id)} 
                      style={{ width: '100%', padding: '8px 0', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', color: '#374151', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
                      onMouseOut={(e) => e.target.style.background = '#f8fafc'}
                    >
                      Open Project
                    </button>
                    
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TEAM ── */}
      {activeTab === 'team' && (
        <div>
          {users.length === 0 ? (
            <div className="tf-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                No team members yet. Members appear here after signing up.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.map(u => {
                const mt     = memberTasks(u.id);
                const todo   = mt.filter(t => t.status === 'todo').length;
                const inProg = mt.filter(t => t.status === 'in_progress').length;
                const done   = mt.filter(t => t.status === 'done').length;
                const initials = u.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

                return (
                  <div key={u.id} className="tf-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.role === 'admin' ? '#2563eb' : '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{u.name}</span>
                          <span className={`badge badge-${u.role}`}>{u.role}</span>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: mt.length > 0 ? 10 : 0, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, padding: '2px 10px', background: '#fef9c3', color: '#854d0e', borderRadius: 4 }}>{todo} To Do</span>
                          <span style={{ fontSize: 12, padding: '2px 10px', background: '#dbeafe', color: '#1e40af', borderRadius: 4 }}>{inProg} In Progress</span>
                          <span style={{ fontSize: 12, padding: '2px 10px', background: '#dcfce7', color: '#166534', borderRadius: 4 }}>{done} Done</span>
                          {mt.length === 0 && <span style={{ fontSize: 12, color: '#94a3b8' }}>No tasks assigned</span>}
                        </div>
                        {mt.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {mt.map(t => (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: '#f8fafc', borderRadius: 5 }}>
                                <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                <div style={{ display: 'flex', gap: 6, marginLeft: 8, flexShrink: 0, alignItems: 'center' }}>
                                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{getProjectName(t.project_id)}</span>
                                  <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}