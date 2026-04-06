import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';
const CATEGORIES = ['HR', 'Finance', 'Legal', 'IT', 'Operations', 'Other'];

export default function Upload() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'HR' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Viewers cannot access this page
  if (user?.role !== 'admin') {
    return <div className="page"><div className="error-msg">Access denied. Admins only.</div></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!file) return setError('Please select a file.');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('category', form.category);

    try {
      await axios.post(`${API}/documents/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Document uploaded successfully!');
      setForm({ title: '', description: '', category: 'HR' });
      setFile(null);
      setTimeout(() => navigate('/documents'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Upload Document</h1>
      </div>
      <div className="form-card">
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Document Title *</label>
            <input type="text" placeholder="e.g. Employee Handbook 2026"
              value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <textarea placeholder="Brief description of this document..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
          </div>
          <div className="field">
            <label>Category *</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Select File * (PDF, Word, JPG, PNG — max 10MB)</label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files[0])} required />
            {file && <span className="file-chosen">{file.name} ({(file.size/1024).toFixed(0)} KB)</span>}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/documents')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}