import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/dashboard">DocVault</Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/documents" className={isActive('/documents')}>Documents</Link>
        {user?.role === 'admin' && (
          <Link to="/upload" className={isActive('/upload')}>Upload</Link>
        )}
      </div>
      <div className="nav-user">
        <span className="nav-name">{user?.name}</span>
        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}