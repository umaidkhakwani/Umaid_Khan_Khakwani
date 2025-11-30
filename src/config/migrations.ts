import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './database';

const migrationsDir = join(__dirname, '../../migrations');

export const runMigrations = async (): Promise<void> => {
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const appliedResult = await query('SELECT version FROM schema_migrations ORDER BY version');
    const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

    // Migration files in order
    const migrationFiles = [
      '001_create_users_table.sql',
      '002_create_chat_messages_table.sql',
      '003_create_subscription_bundles_table.sql',
      '004_create_monthly_usage_table.sql',
    ];

    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');
      if (appliedVersions.has(version)) {
        console.log(`Migration ${version} already applied, skipping...`);
        continue;
      }

      console.log(`Running migration ${version}...`);
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      await query(sql);
      await query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      console.log(`Migration ${version} completed successfully`);
    }

    console.log('All migrations completed');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

