import React, { useState } from 'react';
import { loginUser, registerUser, getStoredUsers } from './api';

export default function Login({ onLogin, users, setUsers }) {
  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ name: '',email: '', password: '', role: 'member' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const allUsers = users?.length ? users : getStoredUsers();
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const found = await loginUser(form.email, form.password, allUsers);
    setLoading(false);
    if (!found) { setError('Invalid email or password.'); return; }
    onLogin(found);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.email.includes('@'))  { setError('Enter a valid email address.'); return; }
    if (form.password.length < 4)   { setError('Password must be at least 4 characters.'); return; }
    if (allUsers.find(u => u.email === form.email)) { setError('This email is already registered.'); return; }
    setLoading(true);
    await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      allUsers,
      onUsersUpdate: (updated) => { if (setUsers) setUsers(updated); },
    });
    setLoading(false);
    setSuccess('Account created. Please sign in.');
    setMode('login');
    setForm(f => ({ ...f, password: '' }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>TaskFlow</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Team Task & Project Management</p>
        </div>

        <div className="tf-card" style={{ padding: 28 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 22 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{ flex: 1, padding: '9px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  color: mode === m ? '#2563eb' : '#64748b',
                  borderBottom: mode === m ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.15s' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 12px', marginBottom: 14, color: '#166534', fontSize: 13 }}>{success}</div>}
          {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 12px', marginBottom: 14, color: '#991b1b', fontSize: 13 }}>{error}</div>}

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            
            {/* The Full Name field is inserted right here */}
            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <label className="tf-label">Full Name</label>
                <input className="tf-field" type="text"
                  value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="tf-label">Email address</label>
              <input className="tf-field" type="email" placeholder="you@company.com"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div style={{ marginBottom: mode === 'signup' ? 14 : 20 }}>
              <label className="tf-label">Password</label>
              <input className="tf-field" type="password" placeholder="Enter password"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            {mode === 'signup' && (
              <div style={{ marginBottom: 20 }}>
                <label className="tf-label">Role</label>
                <select className="tf-field" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <button className="tf-btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}