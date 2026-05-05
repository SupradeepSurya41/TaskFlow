import React, { useState, useEffect } from 'react';
import Login     from './Login';
import Dashboard from './Dashboard';
import Tasks     from './Tasks';
import Projects  from './Projects';
import { fetchProjects, fetchTasks, fetchUsers } from './api';
import TeamChat from './TeamChat';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { id: 'tasks', label: 'Tasks', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )},
  { id: 'projects', label: 'Projects & Team', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )},
  { id: 'chat', label: 'Team Chat', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  )},
];

export default function App() {
  const [user, setUser]         = useState(null);
  const [tab, setTab]           = useState('dashboard');
  const [users, setUsers]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchUsers(), fetchProjects(), fetchTasks()]).then(([u, p, t]) => {
      setUsers(u); setProjects(p); setTasks(t); setLoading(false);
    });
  }, [user]);

  if (!user) return <Login onLogin={setUser} users={users} setUsers={setUsers} />;

  const isAdmin  = user.role === 'admin';
  const initials = (user.name || user.email).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* Sidebar */}
      <aside style={{ width: 215, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#2563eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>TaskFlow</span>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left', marginBottom: 2, transition: 'all 0.15s',
                  background: active ? '#eff6ff' : 'transparent',
                  color:      active ? '#2563eb' : '#475569' }}>
                {n.icon}{n.label}
              </button>
            );
          })}
        </nav>

        {/* User block — no footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isAdmin ? '#2563eb' : '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name || user.email.split('@')[0]}
              </div>
              <span className={`badge badge-${user.role}`}>{user.role}</span>
            </div>
          </div>
          <button onClick={() => { setUser(null); setUsers([]); setProjects([]); setTasks([]); }}
            style={{ width: '100%', padding: '6px 0', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 215, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 28px', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            {NAV.find(n => n.id === tab)?.label}
          </h1>
          {!isAdmin && (
            <span style={{ fontSize: 12, color: '#0891b2' }}>
              Member — view and update your assigned tasks only
            </span>
          )}
        </header>

        <main style={{ flex: 1, padding: '24px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
              Loading...
            </div>
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard tasks={tasks} user={user} users={users} projects={projects} />}
              {tab === 'tasks'     && <Tasks     user={user} users={users} projects={projects} tasks={tasks} setTasks={setTasks} />}
              {tab === 'projects'  && <Projects  user={user} users={users} setUsers={setUsers} projects={projects} setProjects={setProjects} tasks={tasks} />}
              {tab === 'chat'      && <TeamChat  user={user} users={users} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
