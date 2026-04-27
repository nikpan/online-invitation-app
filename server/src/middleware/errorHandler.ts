import type { ErrorRequestHandler } from 'express';
import { ValidationError, UniqueConstraintError } from 'sequelize';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Global error-handling middleware.
 * Must be registered last with app.use(errorHandler).
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof Error) {
    console.error(err.stack || err.message);
  } else {
    console.error(err);
  }

  if (err instanceof UniqueConstraintError) {
    const field = err.errors?.[0]?.path || 'field';
    res.status(409).json({ error: `${field} is already taken` });
    return;
  }

  if (err instanceof ValidationError) {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    res.status(422).json({ error: 'Validation failed', details });
    return;
  }

  const httpErr = err as HttpError;
  const status = httpErr.status || httpErr.statusCode || 500;
  const message = httpErr.message || 'Internal server error';

  res.status(status).json({ error: message });
};
