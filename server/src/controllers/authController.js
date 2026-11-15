const bcrypt = require('bcryptjs');
const supabase = require('../config/supabaseClient');
const generateToken = require('../utils/generateToken');

// Map Supabase user row to frontend-compatible object (_id instead of id)
const formatUser = (u) => ({
  _id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.created_at,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
    }

    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either admin or student.' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert({ name, email, password_hash, role })
      .select('id, name, email, role, created_at')
      .single();

    if (insertError || !newUser) {
      console.error('[Register Error]', insertError?.message);
      return res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
    }

    const token = generateToken(newUser.id, newUser.role);

    return res.status(201).json({
      success: true,
      token,
      user: formatUser(newUser),
    });
  } catch (err) {
    console.error('[Register Error]', err.message);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // Find user by email (include password_hash for comparison)
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, password_hash, created_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user.id, user.role);

    return res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware (no password_hash)
    return res.status(200).json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (err) {
    console.error('[GetMe Error]', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { registerUser, loginUser, getMe };
