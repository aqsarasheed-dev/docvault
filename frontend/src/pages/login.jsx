import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Login() {
  const { login } = useAuth();
  const [loginAs, setLoginAs] = useState('viewer');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { ...form, loginAs });
      login(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
            <div className="auth-grid-feature">Secure file storage with Cloudinary</div>
            <div className="auth-grid-feature">Role-based access — Admin & Viewer</div>
            <div className="auth-grid-feature">Search, filter and download instantly</div>
            <div className="auth-grid-feature">Real-time activity tracking</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="subtitle">Sign in to continue</p>
          <div className="auth-divider"></div>

          <div className="role-tabs">
            <button className={`role-tab ${loginAs === 'viewer' ? 'active viewer' : ''}`}
              onClick={() => { setLoginAs('viewer'); setError(''); }}>
              Viewer
            </button>
            <button className={`role-tab ${loginAs === 'admin' ? 'active admin' : ''}`}
              onClick={() => { setLoginAs('admin'); setError(''); }}>
              Admin
            </button>
          </div>
          <p className="role-hint">
            {loginAs === 'admin'
              ? 'Admin portal — upload, delete and manage all documents.'
              : 'Viewer portal — browse and download documents only.'}
          </p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="Enter your password"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : `Sign in as ${loginAs.charAt(0).toUpperCase() + loginAs.slice(1)}`}
            </button>
          </form>
          <p className="auth-link" style={{textAlign:'center',marginTop:'20px'}}>
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}