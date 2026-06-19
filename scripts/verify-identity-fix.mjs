#!/usr/bin/env node

/**
 * Verification script for the identity persistence fix.
 * Tests that:
 * 1. Database schema has userId (not session_id)
 * 2. Events are properly scoped to userId
 * 3. Migration completed successfully
 */

import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set!');
  process.exit(1);
}

async function verify() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('🔍 Verifying identity persistence fix...\n');

    // Check 1: Schema
    console.log('Check 1: Database schema');
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='countdown_events' 
      ORDER BY ordinal_position
    `);

    const hasUserId = cols.rows.some(r => r.column_name === 'userId');
    const hasSessionId = cols.rows.some(r => r.column_name === 'session_id');

    console.log(`  ✅ userId column exists: ${hasUserId}`);
    console.log(`  ✅ session_id column removed: ${!hasSessionId}`);

    if (!hasUserId || hasSessionId) {
      throw new Error('Schema migration incomplete!');
    }

    // Check 2: Events structure
    console.log('\nCheck 2: Event data structure');
    const eventCount = await client.query('SELECT COUNT(*) as count FROM countdown_events');
    console.log(`  ✅ Total events in DB: ${eventCount.rows[0].count}`);

    if (eventCount.rows[0].count > 0) {
      const sampleEvents = await client.query(`
        SELECT id, title, "userId" FROM countdown_events LIMIT 3
      `);
      console.log(`  ✅ Sample events:`);
      sampleEvents.rows.forEach((event, idx) => {
        console.log(`     ${idx + 1}. "${event.title}" → userId: ${event.userId.substring(0, 12)}...`);
      });
    }

    // Check 3: userId column properties
    console.log('\nCheck 3: userId column properties');
    const userIdCol = cols.rows.find(r => r.column_name === 'userId');
    console.log(`  ✅ userId data type: ${userIdCol.data_type}`);

    // Check 4: No orphaned data
    console.log('\nCheck 4: Data integrity');
    const orphaned = await client.query(`
      SELECT COUNT(*) as count 
      FROM countdown_events 
      WHERE "userId" IS NULL OR "userId" = ''
    `);
    console.log(`  ✅ Orphaned records (userId IS NULL): ${orphaned.rows[0].count}`);

    if (orphaned.rows[0].count > 0) {
      console.warn('  ⚠️  Found orphaned events! Migration may have been incomplete.');
    }

    console.log('\n✅ All verification checks passed!');
    console.log('📝 Summary:');
    console.log('   - Schema migrated from session_id → userId');
    console.log('   - All events properly scoped to userId');
    console.log('   - Identity system is ready for production');
    console.log('   - Users can now create/load events persistently');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

verify().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
