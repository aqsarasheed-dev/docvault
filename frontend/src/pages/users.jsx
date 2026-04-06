import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Users() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // fetchData ko useEffect ke andar ya useCallback ke sath hona chahiye
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        axios.get(`${API}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/auth/activity`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data.users);
      setLogs(logsRes.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // 1. Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    // 2. Sirf tab fetch karein jab token maujood ho
    if (token && user?.role === 'admin') {
      fetchData();
    }
  }, [user, token, navigate, fetchData]); // <--- In dependencies ka hona lazmi hai

  const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—';

  const actionColor = (action) => {
    if (action === 'LOGGED_IN')  return 'log-in';
    if (action === 'LOGGED_OUT') return 'log-out';
    if (action === 'REGISTERED') return 'log-reg';
    return '';
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn-sm" onClick={fetchData}>Refresh</button>
      </div>

      {/* Tab Switch */}
      <div className="category-tabs" style={{ marginBottom: '24px' }}>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          All Users ({users.length})
        </button>
        <button className={`tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>
          Activity Log ({logs.length})
        </button>
      </div>

      {loading ? <div className="loading">Loading data...</div> : (

        tab === 'users' ? (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Last Logout</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="u-name">{u.name}</td>
                    <td className="u-email">{u.email}</td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td>
                      <span className={`status-dot ${u.is_online ? 'online' : 'offline'}`}>
                        {u.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="u-date">{fmt(u.last_login)}</td>
                    <td className="u-date">{fmt(u.last_logout)}</td>
                    <td className="u-date">{fmt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td className="u-name">{log.user_name}</td>
                    <td><span className={`role-badge ${log.role}`}>{log.role}</span></td>
                    <td><span className={`action-badge ${actionColor(log.action)}`}>{log.action}</span></td>
                    <td className="u-email">{log.ip_address}</td>
                    <td className="u-date">{fmt(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}