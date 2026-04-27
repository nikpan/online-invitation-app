import type { RequestHandler } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models';

/**
 * Require a valid access token (httpOnly cookie).
 * Attaches req.user = { id, email, display_name, avatar_url } on success.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'email', 'display_name', 'avatar_url'],
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};
