const bcrypt = require('bcrypt');
const { User } = require('../models');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  COOKIE_OPTIONS,
} = require('../utils/jwt');

const BCRYPT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────

async function register(req, res, next) {
  try {
    const { email, password, display_name } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ email, password_hash, display_name });

    const payload = { id: user.id, email: user.email };
    const access_token = signAccessToken(payload);
    const refresh_token = signRefreshToken(payload);

    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return same message regardless to avoid user enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = { id: user.id, email: user.email };
    const access_token = signAccessToken(payload);
    const refresh_token = signRefreshToken(payload);

    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout(req, res) {
  // Clear both cookies
  res.clearCookie('access_token', { ...COOKIE_OPTIONS });
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });
  return res.status(200).json({ message: 'Logged out' });
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'email'],
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newPayload = { id: user.id, email: user.email };
    const access_token = signAccessToken(newPayload);

    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTIONS);
    return res.status(200).json({ message: 'Token refreshed' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired', code: 'REFRESH_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// ─── Me ───────────────────────────────────────────────────────────────────────

async function me(req, res) {
  // req.user is set by requireAuth middleware
  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      display_name: req.user.display_name,
      avatar_url: req.user.avatar_url,
    },
  });
}

module.exports = { register, login, logout, refresh, me };
