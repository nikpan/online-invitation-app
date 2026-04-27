import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { register, login, logout, refresh, me } from '../controllers/authController';

const router: Router = Router();

// ─── Rate limits ──────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Validation schemas ───────────────────────────────────────────────────────

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  display_name: Joi.string().min(2).max(80).trim().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/refresh  — refresh access token using httpOnly refresh cookie
router.post('/refresh', authLimiter, refresh);

// GET /api/auth/me  — return current user (requires access token)
router.get('/me', requireAuth, me);

export default router;
