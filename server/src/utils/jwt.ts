import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { CookieOptions } from 'express';

export interface TokenPayload {
  id: string;
  email: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRES: SignOptions['expiresIn'] =
  (process.env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']) || '15m';
const REFRESH_EXPIRES: SignOptions['expiresIn'] =
  (process.env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']) || '7d';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

function isTokenPayload(value: unknown): value is TokenPayload & JwtPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).id === 'string' &&
    typeof (value as Record<string, unknown>).email === 'string'
  );
}

export function verifyAccessToken(token: string): TokenPayload & JwtPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET);
  if (!isTokenPayload(decoded)) {
    throw new Error('Invalid access token payload');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): TokenPayload & JwtPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET);
  if (!isTokenPayload(decoded)) {
    throw new Error('Invalid refresh token payload');
  }
  return decoded;
}

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
};

export const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes in ms
};

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth/refresh',
};
