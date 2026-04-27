import 'dotenv/config';

import app from './app';
import { sequelize } from './models';

const PORT: number = parseInt(process.env.PORT || '3001', 10);

async function start(): Promise<void> {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Schema is managed by SQL migrations in database/migrations/
    // sync() here only creates missing tables without altering existing ones
    await sequelize.sync();
    console.log('✅ Database models synced');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err: unknown) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
