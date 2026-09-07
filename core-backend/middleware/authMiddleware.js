const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_3tier_architecture_2026';

/**
 * Middleware to authenticate requests to the Core Backend
 * Validates the JWT issued by the Authentication Backend
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No Authorization header provided.',
      tier: 'Core Backend (Port 5002)'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Malformed Authorization header. Expected "Bearer <token>".',
      tier: 'Core Backend (Port 5002)'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach authenticated user information to request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token verification failed: Invalid or expired token.',
      error: error.message,
      tier: 'Core Backend (Port 5002)'
    });
  }
}

module.exports = { authenticateToken };
