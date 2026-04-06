const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const router = express.Router();

const logActivity = async (userId, userName, action, role, ip) => {
  await supabase.from('activity_logs').insert([{
    user_id: userId,
    user_name: userName,
    action,
    role,
    ip_address: ip || 'unknown',
    created_at: new Date().toISOString()
  }]);
};

// REGISTER — POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields.' });
  }
  const allowedRoles = ['admin', 'viewer'];
  const userRole = allowedRoles.includes(role) ? role : 'viewer';

  try {
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) {
      return res.status(400).json({ message: 'This email is already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role: userRole }])
      .select().single();
    if (error) throw error;

    const token = jwt.sign(
      { id: data.id, name: data.name, email: data.email, role: data.role },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    await logActivity(data.id, data.name, 'REGISTERED', data.role,
      req.headers['x-forwarded-for'] || req.socket.remoteAddress);

    res.status(201).json({
      message: 'Registration successful!', token,
      user: { id: data.id, name: data.name, email: data.email, role: data.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// LOGIN — POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, loginAs } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password.' });
  }
  try {
    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email).single();
    if (error || !user) {
      return res.status(400).json({ message: 'Email not found. Please register first.' });
    }

    // Role separation check
    if (loginAs && user.role !== loginAs) {
      if (loginAs === 'admin' && user.role === 'viewer') {
        return res.status(403).json({
          message: 'Access denied. You are a Viewer — cannot login as Admin.'
        });
      }
      if (loginAs === 'viewer' && user.role === 'admin') {
        return res.status(403).json({
          message: 'Access denied. You are an Admin — cannot login as Viewer.'
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );

    await supabase.from('users')
      .update({ last_login: new Date().toISOString(), is_online: true })
      .eq('id', user.id);

    await logActivity(user.id, user.name, 'LOGGED_IN', user.role,
      req.headers['x-forwarded-for'] || req.socket.remoteAddress);

    res.json({
      message: `Welcome back, ${user.name}!`, token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// LOGOUT — POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json({ message: 'Logged out.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await supabase.from('users')
      .update({ is_online: false, last_logout: new Date().toISOString() })
      .eq('id', decoded.id);
    await logActivity(decoded.id, decoded.name, 'LOGGED_OUT', decoded.role,
      req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    res.json({ message: 'Logged out successfully.' });
  } catch {
    res.json({ message: 'Logged out.' });
  }
});

// GET ALL USERS — GET /api/auth/users (admin only)
router.get('/users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_online, last_login, last_logout, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET ACTIVITY LOGS — GET /api/auth/activity (admin only)
router.get('/activity', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
    const { data, error } = await supabase
      .from('activity_logs').select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;