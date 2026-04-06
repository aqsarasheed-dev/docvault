import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CATEGORIES = ['all', 'HR', 'Finance', 'Legal', 'IT', 'Operations', 'Other'];

export default function Documents() {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchDocs = useCallback(async () => {
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
  }, [token, search, category]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Open document — handle PDF, images, Word docs
  const openDocument = (doc) => {
    const url = doc.file_url;
    const name = doc.file_name?.toLowerCase() || '';
    // PDFs and images open directly
    if (name.endsWith('.pdf') || name.endsWith('.png') ||
        name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      window.open(url, '_blank');
    } else {
      // Word docs — use Google Docs viewer
      window.open(`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`, '_blank');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
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

  const openEdit = (doc) => {
    setEditDoc(doc);
    setEditForm({ title: doc.title, description: doc.description || '' });
    setEditError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const res = await axios.put(`${API}/documents/${editDoc.id}`,
        { title: editForm.title, description: editForm.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments(prev => prev.map(d => d.id === editDoc.id ? { ...d, ...res.data.document } : d));
      setEditDoc(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Documents</h1>
        <span className="doc-count">{documents.length} documents</span>
      </div>

      {/* Search + Filter */}
      <div className="filters">
        <input className="search-input" type="text"
          placeholder="Search by document title..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="category-tabs">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}>
              {cat === 'all' ? 'All' : cat}
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
              {/* File type icon */}
              <div className="doc-card-top">
                <span className="category-badge">{doc.category}</span>
                <span className="file-size">{doc.file_size}</span>
              </div>

              <div className="doc-file-type">
                {getFileIcon(doc.file_name)}
              </div>

              <h3 className="doc-card-title">{doc.title}</h3>
              {doc.description && <p className="doc-card-desc">{doc.description}</p>}
              <div className="doc-card-meta">
                {doc.users?.name || 'Unknown'} &nbsp;·&nbsp;
                {new Date(doc.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Hover Action Bar */}
              <div className="doc-card-actions">
                <button className="btn-sm" onClick={() => openDocument(doc)}
                  title="View document">
                  View
                </button>
                <a href={doc.file_url} download={doc.file_name}
                  className="btn-sm" target="_blank" rel="noreferrer"
                  title="Download document">
                  Download
                </a>
                {user?.role === 'admin' && (
                  <>
                    <button className="btn-sm edit" onClick={() => openEdit(doc)}
                      title="Edit title and description">
                      Edit
                    </button>
                    <button className="btn-sm danger" onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      title="Delete document">
                      {deleting === doc.id ? '...' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editDoc && (
        <div className="modal-overlay" onClick={() => setEditDoc(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Document</h2>
              <button className="modal-close" onClick={() => setEditDoc(null)}>×</button>
            </div>
            {editError && <div className="error-msg">{editError}</div>}
            <form onSubmit={handleEdit}>
              <div className="field">
                <label>Document Title</label>
                <input type="text" value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})} required />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Update description..." rows="3" />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={editLoading}
                  style={{width:'auto'}}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary"
                  onClick={() => setEditDoc(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// File type icon helper
function getFileIcon(filename) {
  if (!filename) return <span className="file-icon pdf">FILE</span>;
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    pdf: { label: 'PDF', cls: 'pdf' },
    doc: { label: 'DOC', cls: 'word' },
    docx: { label: 'DOCX', cls: 'word' },
    jpg: { label: 'IMG', cls: 'img' },
    jpeg: { label: 'IMG', cls: 'img' },
    png: { label: 'PNG', cls: 'img' },
    xls: { label: 'XLS', cls: 'excel' },
    xlsx: { label: 'XLSX', cls: 'excel' },
  };
  const f = map[ext] || { label: ext.toUpperCase(), cls: 'other' };
  return <span className={`file-icon ${f.cls}`}>{f.label}</span>;
}