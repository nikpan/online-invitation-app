/**
 * Joi validation middleware factory.
 * Usage: validate(schema) — validates req.body against the schema.
 */
function validate(schema) {
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
      return res.status(422).json({ error: 'Validation failed', details });
    }

    req.body = value;
    next();
  };
}

module.exports = { validate };
