import React, { useEffect, useState } from 'react';
import { fetchDashboard } from './api';

const STATS = [
  { key: 'total',       label: 'Total Tasks', color: '#2563eb' },
  { key: 'todo',        label: 'To Do',       color: '#d97706' },
  { key: 'in_progress', label: 'In Progress', color: '#0891b2' },
  { key: 'done',        label: 'Completed',   color: '#16a34a' },
  { key: 'overdue',     label: 'Overdue',     color: '#dc2626' },
];

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function Dashboard({ tasks, user, users, projects }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  // Members only see their own tasks
  const myTasks = isAdmin
    ? tasks
    : tasks.filter(t => t.assignee_id === user?.id);

  const now = new Date();
  const isOverdue = (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done';

  useEffect(() => {
    // Stats are always computed from myTasks so members see their own numbers
    fetchDashboard(myTasks).then(s => { setStats(s); setLoading(false); });
  }, [tasks]);

  const getUserName    = (id) => users.find(u => u.id === id)?.name ?? '—';
  const getProjectName = (id) => projects.find(p => p.id === id)?.name ?? '—';

  const recent = [...myTasks].sort((a, b) => b.id - a.id).slice(0, 6);

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>
          Welcome, {user?.name || user?.email?.split('@')[0]}
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          {isAdmin
            ? 'Overview of all tasks across projects.'
            : 'Showing tasks assigned to you.'}
        </p>
      </div>

      {/* Stat cards — computed from myTasks so member sees own numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 22 }}>
        {STATS.map(({ key, label, color }) => (
          <div key={key} className="tf-card" style={{ padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 2 }}>
              {loading ? '—' : (stats?.[key] ?? 0)}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Bottom section — different for admin vs member */}
      {isAdmin ? (
        // Admin: recent tasks + project progress side by side
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* Recent tasks */}
          <div className="tf-card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 14px' }}>Recent Tasks</h3>
            {recent.length === 0
              ? <p style={{ fontSize: 13, color: '#94a3b8' }}>No tasks yet.</p>
              : recent.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {getProjectName(t.project_id)}
                      {t.assignee_id ? ` · ${getUserName(t.assignee_id)}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginLeft: 10, flexShrink: 0 }}>
                    {isOverdue(t) && <span className="badge badge-overdue">Overdue</span>}
                    <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Project progress */}
          <div className="tf-card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 14px' }}>Project Progress</h3>
            {projects.length === 0
              ? <p style={{ fontSize: 13, color: '#94a3b8' }}>No projects yet.</p>
              : projects.map(p => {
                const total = tasks.filter(t => t.project_id === p.id).length;
                const done  = tasks.filter(t => t.project_id === p.id && t.status === 'done').length;
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={p.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ fontWeight: 500, color: '#374151' }}>{p.name}</span>
                      <span style={{ color: '#64748b' }}>{done}/{total} done</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#2563eb', borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      ) : (
        // Member: just their task list, no duplicate progress section
        <div className="tf-card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 14px' }}>My Assigned Tasks</h3>
          {recent.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8' }}>No tasks assigned to you yet.</p>
          ) : (
            recent.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {getProjectName(t.project_id)}
                    {t.due_date && (
                      <span style={{ color: isOverdue(t) ? '#dc2626' : '#94a3b8', marginLeft: 6 }}>
                        · Due {new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, marginLeft: 10, flexShrink: 0 }}>
                  {isOverdue(t) && <span className="badge badge-overdue">Overdue</span>}
                  <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
