const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'campustest_default_jwt_secret'
      );

      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, password_hash, created_at')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'User session invalid or account no longer exists.'
        });
      }

      // Check role constraint: only admin and student are allowed
      if (!['admin', 'student'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Invalid user role.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware Error]', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Invalid or expired session token.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No token provided.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${roles.join(', ')} only.`
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
