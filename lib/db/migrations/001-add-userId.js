/**
 * Migration: Add userId column to countdown_events table
 * This replaces the session_id column with a persistent user identity column.
 * 
 * For existing events: We'll migrate them to use the first event's session_id pattern
 * (since users can't have multiple session_ids at once) or generate a recovery UUID.
 * 
 * This script is optional — you can apply the schema change in your DB directly,
 * or use this as a guide.
 */

async function migrateCountdownEventsToUserId() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('Starting migration: session_id → userId...');

    await pool.query('BEGIN');

    // Step 1: Add userId column (nullable for now)
    console.log('Adding userId column...');
    await pool.query(`
      ALTER TABLE countdown_events
      ADD COLUMN IF NOT EXISTS "userId" TEXT
    `);

    // Step 2: Generate UUIDs for existing events based on their session_id
    // (This preserves event groupings)
    console.log('Populating userId from session_id...');
    await pool.query(`
      UPDATE countdown_events
      SET "userId" = session_id
      WHERE "userId" IS NULL
    `);

    // Step 3: Make userId NOT NULL
    console.log('Making userId NOT NULL...');
    await pool.query(`
      ALTER TABLE countdown_events
      ALTER COLUMN "userId" SET NOT NULL
    `);

    // Step 4: Drop session_id column (optional — keep if you want backward compatibility)
    console.log('Dropping session_id column...');
    await pool.query(`
      ALTER TABLE countdown_events
      DROP COLUMN IF EXISTS session_id
    `);

    await pool.query('COMMIT');
    console.log('✅ Migration complete!');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrateCountdownEventsToUserId().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrateCountdownEventsToUserId };
