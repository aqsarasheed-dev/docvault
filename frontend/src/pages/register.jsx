import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Register() {
  const { login } = useAuth();
  const [role, setRole] = useState('viewer');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, { ...form, role });
      login(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-grid">
        <div className="auth-grid-content">
          <div className="auth-grid-title">DocVault</div>
          <div className="auth-grid-sub">Document Management</div>
          <div className="auth-grid-line"></div>
          <div className="auth-grid-features">
            <div className="auth-grid-feature">Admins upload and manage all documents</div>
            <div className="auth-grid-feature">Viewers browse and download securely</div>
            <div className="auth-grid-feature">All activity logged and tracked</div>
            <div className="auth-grid-feature">Built with Node.js, React & Supabase</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <h1>Create account</h1>
          <p className="subtitle">Join DocVault today</p>
          <div className="auth-divider"></div>

          <div className="role-tabs">
            <button className={`role-tab ${role === 'viewer' ? 'active viewer' : ''}`}
              onClick={() => { setRole('viewer'); setError(''); }}>
              Register as Viewer
            </button>
            <button className={`role-tab ${role === 'admin' ? 'active admin' : ''}`}
              onClick={() => { setRole('admin'); setError(''); }}>
              Register as Admin
            </button>
          </div>
          <p className="role-hint">
            {role === 'admin'
              ? 'Admin — can upload, delete and manage documents.'
              : 'Viewer — can only browse and download documents.'}
          </p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full Name</label>
              <input type="text" placeholder="Your full name"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="Minimum 6 characters"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>
          <p className="auth-link" style={{textAlign:'center',marginTop:'20px'}}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}