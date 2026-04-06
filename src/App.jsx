import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/dashboard';
import Documents from './pages/documents';
import Upload from './pages/upload';
import Users from './pages/users';
import Navbar from './components/navbar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login"     element={!user ? <Login />    : <Navigate to="/dashboard" />} />
        <Route path="/register"  element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/upload"    element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/users"     element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}