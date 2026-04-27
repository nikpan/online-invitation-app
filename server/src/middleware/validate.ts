import type { RequestHandler } from 'express';
import type { Schema } from 'joi';

/**
 * Joi validation middleware factory.
 * Usage: validate(schema) — validates req.body against the schema.
 */
export function validate(schema: Schema): RequestHandler {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      res.status(422).json({ error: 'Validation failed', details });
      return;
    }

    req.body = value;
    next();
  };
}
