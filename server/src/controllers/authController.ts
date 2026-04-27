import bcrypt from 'bcrypt';
import type { RequestHandler } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { User } from '../models';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  COOKIE_OPTIONS,
} from '../utils/jwt';

const BCRYPT_ROUNDS = 12;

interface RegisterBody {
  email: string;
  password: string;
  display_name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const register: RequestHandler<unknown, unknown, RegisterBody> = async (req, res, next) => {
  try {
    const { email, password, display_name } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email is already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ email, password_hash, display_name });

    const payload = { id: user.id, email: user.email };
    const access_token = signAccessToken(payload);
    const refresh_token = signRefreshToken(payload);

    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
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
};

export const login: RequestHandler<unknown, unknown, LoginBody> = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const payload = { id: user.id, email: user.email };
    const access_token = signAccessToken(payload);
    const refresh_token = signRefreshToken(payload);

    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refresh_token, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
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
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie('access_token', { ...COOKIE_OPTIONS });
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });
  res.status(200).json({ message: 'Logged out' });
};

export const refresh: RequestHandler = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'email'],
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newPayload = { id: user.id, email: user.email };
    const access_token = signAccessToken(newPayload);

    res.cookie('access_token', access_token, ACCESS_COOKIE_OPTIONS);
    res.status(200).json({ message: 'Token refreshed' });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Refresh token expired', code: 'REFRESH_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const me: RequestHandler = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      display_name: req.user.display_name,
      avatar_url: req.user.avatar_url,
    },
  });
};
