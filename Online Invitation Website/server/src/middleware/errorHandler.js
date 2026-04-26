/**
 * Global error-handling middleware.
 * Must be registered last with app.use(errorHandler).
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message || err);

  // Sequelize unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return res.status(409).json({ error: `${field} is already taken` });
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ error: 'Validation failed', details });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
