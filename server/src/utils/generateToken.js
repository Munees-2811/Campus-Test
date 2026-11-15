const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'campustest_default_jwt_secret',
    {
      expiresIn: '7d'
    }
  );
};

module.exports = generateToken;
