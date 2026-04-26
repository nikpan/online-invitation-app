const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Require a valid access token (httpOnly cookie).
 * Attaches req.user = { id, email, display_name } on success.
 */
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'email', 'display_name', 'avatar_url'],
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireAuth };
