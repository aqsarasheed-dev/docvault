const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const supabase = require('../config/supabase');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed. Use PDF, Word, Excel or image.'));
  }
});

const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'docvault', resource_type: 'auto',
        public_id: Date.now() + '_' + originalName.replace(/\s/g, '_') },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    stream.end(buffer);
  });
};

// UPLOAD — POST /api/documents/upload
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  const { title, description, category } = req.body;
  if (!req.file) return res.status(400).json({ message: 'Please select a file.' });
  if (!title || !category) return res.status(400).json({ message: 'Title and category are required.' });

  try {
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    const sizeKB = req.file.size / 1024;
    const fileSize = sizeKB > 1024 ? (sizeKB/1024).toFixed(1)+' MB' : sizeKB.toFixed(0)+' KB';

    const { data, error } = await supabase.from('documents')
      .insert([{
        title, description: description || '',
        category,
        file_url: result.secure_url,
        file_name: req.file.originalname,
        file_size: fileSize,
        public_id: result.public_id,
        uploaded_by: req.user.id
      }]).select().single();

    if (error) throw error;
    res.status(201).json({ message: 'Uploaded successfully!', document: data });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed.', error: err.message });
  }
});

// GET ALL — GET /api/documents
router.get('/', protect, async (req, res) => {
  const { search, category } = req.query;
  try {
    let query = supabase.from('documents')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    if (category && category !== 'all') query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ documents: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed.', error: err.message });
  }
});

// GET ONE — GET /api/documents/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase.from('documents')
      .select('*, users(name, email)')
      .eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Not found.' });
    res.json({ document: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// EDIT — PUT /api/documents/:id (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required.' });
  try {
    const { data, error } = await supabase.from('documents')
      .update({ title, description: description || '' })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ message: 'Updated successfully!', document: data });
  } catch (err) {
    res.status(500).json({ message: 'Update failed.', error: err.message });
  }
});

// DELETE — DELETE /api/documents/:id (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { data: doc, error: findErr } = await supabase.from('documents')
      .select('*').eq('id', req.params.id).single();
    if (findErr || !doc) return res.status(404).json({ message: 'Not found.' });

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(doc.public_id, { resource_type: 'raw' });
      await cloudinary.uploader.destroy(doc.public_id, { resource_type: 'image' });
    } catch {}

    const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed.', error: err.message });
  }
});

module.exports = router;