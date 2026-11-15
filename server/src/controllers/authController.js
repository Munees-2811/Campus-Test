const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');
const generateToken = require('../utils/generateToken');

// Map Supabase user row to frontend-compatible object
const formatUser = (u) => ({
  _id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.created_at,
});

// Helper: Log action to activity_logs table
const logActivity = async (userId, action, entityType = 'user', entityId = null, metadata = {}) => {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    });
  } catch (err) {
    // Non-blocking telemetry error
    console.warn('[Activity Log Warning]', err.message);
  }
};

// @desc    Authenticate user (Admin or Student) & issue JWT
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find profile by email (include password_hash for bcrypt validation)
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, password_hash, created_at')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Strict role check: Only admin and student allowed
    if (!['admin', 'student'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Account role is not permitted.'
      });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Issue JWT
    const token = generateToken(user.id, user.role);

    // Log login activity
    await logActivity(user.id, 'user_login', 'auth', user.id, {
      role: user.role,
      ip: req.ip || req.headers['x-forwarded-for']
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: formatUser(user)
    });
  } catch (err) {
    console.error('[Login Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

// @desc    Get currently authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: formatUser(req.user)
    });
  } catch (err) {
    console.error('[GetMe Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
};

// @desc    Logout user (Session invalidation guidance)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    if (req.user) {
      await logActivity(req.user.id, 'user_logout', 'auth', req.user.id);
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error during logout.'
    });
  }
};

// @desc    Secure Admin Initialization
//          Admin accounts must be created through secure initialization, not public registration
// @route   POST /api/auth/init-admin
// @access  Protected by ADMIN_INIT_SECRET or when zero admins exist
const initAdmin = async (req, res) => {
  try {
    const { name, email, password, adminInitSecret } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    // Check if any admin already exists in profiles
    const { count: existingAdminCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    const hasAdmins = existingAdminCount && existingAdminCount > 0;
    const configuredSecret = process.env.ADMIN_INIT_SECRET || 'campustest_secure_admin_init_secret_2026';

    // If an admin already exists, the request MUST provide the valid server ADMIN_INIT_SECRET
    if (hasAdmins) {
      if (!adminInitSecret || adminInitSecret !== configuredSecret) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Admin Security Key. Please provide the authorized campus setup passcode.'
        });
      }
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const { data: newAdmin, error: insertError } = await supabase
      .from('profiles')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        role: 'admin'
      })
      .select('id, name, email, role, created_at')
      .single();

    if (insertError || !newAdmin) {
      throw insertError || new Error('Failed to create admin profile');
    }

    await logActivity(newAdmin.id, 'admin_account_initialized', 'profiles', newAdmin.id);

    return res.status(201).json({
      success: true,
      message: 'Admin account initialized successfully.',
      user: formatUser(newAdmin),
      token: generateToken(newAdmin.id, 'admin')
    });
  } catch (err) {
    console.error('[Admin Init Error]', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to initialize admin account.'
    });
  }
};

// @desc    Admin Creates a Student Account
//          Students must be created by admin
// @route   POST /api/auth/create-student
// @access  Private (Admin only)
const createStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student name, email, and initial password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if email already in use
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this campus email already exists.'
      });
    }

    // Hash student password
    const password_hash = await bcrypt.hash(password, 10);

    const { data: student, error } = await supabase
      .from('profiles')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        role: 'student'
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error || !student) {
      throw error || new Error('Failed to insert student profile.');
    }

    // Log admin creation of student
    await logActivity(req.user.id, 'student_enrolled_by_admin', 'profiles', student.id, {
      enrolledStudentEmail: student.email,
      enrolledBy: req.user.email
    });

    // Create welcome notification for the student
    await supabase.from('notifications').insert({
      user_id: student.id,
      title: 'Welcome to CampusTest',
      message: `Your student profile has been provisioned by ${req.user.name}. You may now access scheduled campus evaluations.`
    });

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      student: formatUser(student)
    });
  } catch (err) {
    console.error('[Create Student Error]', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create student profile.'
    });
  }
};

// @desc    Get List of all Students (Admin only)
// @route   GET /api/auth/students
// @access  Private (Admin only)
const getStudents = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      count: (students || []).length,
      students: (students || []).map(formatUser)
    });
  } catch (err) {
    console.error('[Get Students Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student directory.'
    });
  }
};

// @desc    Change Password (Authenticated user)
// @route   POST /api/auth/change-password
// @access  Private (Admin or Student)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.'
      });
    }

    // Verify current password with bcrypt
    const isMatch = await bcrypt.compare(currentPassword, req.user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password.'
      });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('profiles')
      .update({
        password_hash: new_password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (error) throw error;

    await logActivity(req.user.id, 'password_changed', 'auth', req.user.id);

    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: 'Security Alert: Password Updated',
      message: 'Your account password was successfully updated.'
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('[Change Password Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.'
    });
  }
};

// @desc    Forgot Password Request
//          Generates a cryptographically signed one-time reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your campus email address.'
      });
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, email, password_hash, role')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      // Safe response to prevent enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been issued.'
      });
    }

    // Generate secure token signed with JWT_SECRET + current password_hash
    // This guarantees one-time use: as soon as password changes, the token is automatically invalidated
    const secret = (process.env.JWT_SECRET || 'campustest_default_jwt_secret') + user.password_hash;
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'pwd_reset' },
      secret,
      { expiresIn: '15m' }
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    await logActivity(user.id, 'password_reset_requested', 'auth', user.id);

    console.log(`[Password Reset] Generated reset URL for ${user.email}: ${resetUrl}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetToken,
      resetUrl,
      expiresIn: '15 minutes'
    });
  } catch (err) {
    console.error('[Forgot Password Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request.'
    });
  }
};

// @desc    Reset Password with verified token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both reset token and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // Decode token without verification to get user ID
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id || decoded.purpose !== 'pwd_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset token format.'
      });
    }

    // Fetch user to get current password_hash
    const { data: user, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, name, email, password_hash')
      .eq('id', decoded.id)
      .single();

    if (fetchErr || !user) {
      return res.status(400).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Verify token using secret containing user.password_hash
    const secret = (process.env.JWT_SECRET || 'campustest_default_jwt_secret') + user.password_hash;
    try {
      jwt.verify(token, secret);
    } catch (tokenErr) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid, expired, or has already been used.'
      });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(newPassword, 10);

    // Update password_hash in database
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        password_hash: new_password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateErr) throw updateErr;

    await logActivity(user.id, 'password_reset_completed', 'auth', user.id);

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Password Successfully Reset',
      message: 'Your account password has been reset. You may now sign in with your new password.'
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.'
    });
  } catch (err) {
    console.error('[Reset Password Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.'
    });
  }
};

// @desc    Public Registration handler (Enforces security policy)
//          Delegates admin registration to initAdmin, while blocking public student registration
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { role, adminInitSecret } = req.body;
  if (role === 'admin' || adminInitSecret) {
    return initAdmin(req, res);
  }
  return res.status(403).json({
    success: false,
    message: 'Public student self-registration is disabled for campus compliance. Admin accounts must be created using the administrator setup key, and students must be enrolled by an institution administrator.'
  });
};

module.exports = {
  loginUser,
  logoutUser,
  getMe,
  initAdmin,
  createStudent,
  getStudents,
  changePassword,
  forgotPassword,
  resetPassword,
  registerUser
};
