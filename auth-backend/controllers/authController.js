const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_3tier_architecture_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // 1. Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: username, email, password, and full_name.'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    // 2. Check existing user
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim().toLowerCase(), email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      const match = existingUsers[0];
      const conflictField = match.username.toLowerCase() === username.trim().toLowerCase() ? 'Username' : 'Email';
      return res.status(409).json({
        success: false,
        message: `${conflictField} is already registered. Please use another or log in.`
      });
    }

    // 3. Hash password & insert
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [insertResult] = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [username.trim().toLowerCase(), email.trim().toLowerCase(), passwordHash, full_name.trim()]
    );

    const newUserId = insertResult.insertId;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      userId: newUserId,
      user: {
        id: newUserId,
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        full_name: full_name.trim()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
      error: error.message
    });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password.'
      });
    }

    // 1. Locate user
    const identifier = usernameOrEmail.trim().toLowerCase();
    const [users] = await pool.query(
      'SELECT id, username, email, password_hash, full_name, created_at, last_login FROM users WHERE username = ? OR email = ? LIMIT 1',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const user = users[0];

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    // 3. Update last login timestamp
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // 4. Generate JWT
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      issuer: '3tier-auth-backend'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 5. Store session in auth database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
        last_login: new Date()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
      error: error.message
    });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (token) {
      // Mark session as revoked in auth db
      await pool.query('UPDATE sessions SET is_revoked = TRUE WHERE token = ?', [token]);
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session revoked.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout.',
      error: error.message
    });
  }
};

// GET /api/auth/verify
exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        message: 'No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Check if token revoked in sessions
    const [sessions] = await pool.query(
      'SELECT id, is_revoked FROM sessions WHERE token = ? LIMIT 1',
      [token]
    );

    if (sessions.length > 0 && sessions[0].is_revoked) {
      return res.status(401).json({
        valid: false,
        message: 'Session has been revoked/logged out.'
      });
    }

    // Verify signature
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.status(200).json({
      valid: true,
      user: decoded
    });
  } catch (error) {
    return res.status(401).json({
      valid: false,
      message: 'Token is invalid or expired.',
      error: error.message
    });
  }
};

// GET /health
exports.health = async (req, res) => {
  try {
    const [dbResult] = await pool.query('SELECT 1 as is_alive');
    return res.status(200).json({
      status: 'UP',
      tier: 'Tier-1: Authentication Backend',
      port: process.env.PORT || 5001,
      database: {
        name: process.env.DB_NAME || 'arch_auth_db',
        connected: dbResult.length > 0
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'DEGRADED',
      tier: 'Tier-1: Authentication Backend',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
