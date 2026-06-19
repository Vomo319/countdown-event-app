#!/usr/bin/env node

/**
 * Migration: Add isJoined and sharedFromUserId fields to track joined countdowns
 */

const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Running migration: Add joined event fields...');

    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'countdown_events' 
      AND column_name IN ('isJoined', 'sharedFromUserId')
    `);

    if (checkColumns.rowCount === 0) {
      console.log('  Adding isJoined column...');
      await client.query(`
        ALTER TABLE countdown_events
        ADD COLUMN "isJoined" boolean DEFAULT false
      `);

      console.log('  Adding sharedFromUserId column...');
      await client.query(`
        ALTER TABLE countdown_events
        ADD COLUMN "sharedFromUserId" text
      `);

      console.log('✅ Migration completed successfully');
    } else {
      console.log('✅ Columns already exist, skipping migration');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
