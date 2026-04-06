import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const CATEGORIES = ['all', 'HR', 'Finance', 'Legal', 'IT', 'Operations', 'Other'];

export default function Documents() {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { search, category }
        });
        setDocuments(res.data.documents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [search, category, token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>All Documents</h1>
        <span className="doc-count">{documents.length} documents</span>
      </div>

      {/* Search + Filter */}
      <div className="filters">
        <input className="search-input" type="text" placeholder="Search by title..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="loading">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="empty">No documents found.</div>
      ) : (
        <div className="docs-grid">
          {documents.map(doc => (
            <div className="doc-card" key={doc.id}>
              <div className="doc-card-top">
                <span className="category-badge">{doc.category}</span>
                <span className="file-size">{doc.file_size}</span>
              </div>
              <h3 className="doc-card-title">{doc.title}</h3>
              {doc.description && <p className="doc-card-desc">{doc.description}</p>}
              <div className="doc-card-meta">
                Uploaded by {doc.users?.name || 'Unknown'} · {new Date(doc.created_at).toLocaleDateString()}
              </div>
              <div className="doc-card-actions">
                <a href={doc.file_url} target="_blank" rel="noreferrer" className="btn-sm">Download</a>
                {user?.role === 'admin' && (
                  <button className="btn-sm danger" onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}>
                    {deleting === doc.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}