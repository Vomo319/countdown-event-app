'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function generateYearReview(year: number) {
  const userId = await getUserId()
  
  const startDate = new Date(year, 0, 1).toISOString()
  const endDate = new Date(year, 11, 31).toISOString()
  
  // Get all events for the year
  const eventsResult = await db.query(
    `SELECT category, COUNT(*) as count FROM events
     WHERE user_id = $1 AND event_date >= $2 AND event_date <= $3
     GROUP BY category`,
    [userId, startDate, endDate]
  )
  
  // Get all feelings for the year
  const feelingsResult = await db.query(
    `SELECT feeling, COUNT(*) as count FROM event_feelings
     WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY feeling
     ORDER BY count DESC
     LIMIT 1`,
    [userId, startDate, endDate]
  )
  
  const topFeeling = feelingsResult.rows.length > 0 ? feelingsResult.rows[0].feeling : 'hopeful'
  
  // Build summary
  const totalEvents = eventsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
  const categoriesCounts = Object.fromEntries(
    eventsResult.rows.map(row => [row.category, row.count])
  )
  
  const summaryText = `In ${year}, you looked forward to ${totalEvents} amazing things. ${
    totalEvents > 10 ? 'What a year full of anticipation!' :
    totalEvents > 5 ? 'Each moment was special.' :
    'Every countdown was meaningful.'
  } Your top feeling was ${topFeeling}, and you\'re ready for even more amazing moments ahead.`
  
  const reviewId = uuidv4()
  
  await db.query(
    `INSERT INTO year_summaries 
     (id, user_id, year, total_events, categories_count, top_feeling, summary_text, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      reviewId,
      userId,
      year,
      totalEvents,
      JSON.stringify(categoriesCounts),
      topFeeling,
      summaryText
    ]
  )
  
  return {
    success: true,
    review: {
      year,
      totalEvents,
      categories: categoriesCounts,
      topFeeling,
      summary: summaryText
    }
  }
}

export async function getYearReview(year: number) {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT * FROM year_summaries WHERE user_id = $1 AND year = $2`,
    [userId, year]
  )
  
  if (result.rows.length === 0) return null
  
  const row = result.rows[0]
  return {
    year: row.year,
    totalEvents: row.total_events,
    categories: JSON.parse(row.categories_count),
    topFeeling: row.top_feeling,
    summary: row.summary_text,
    createdAt: row.created_at
  }
}

export async function getAllYearReviews() {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT year, total_events, top_feeling, summary_text, created_at 
     FROM year_summaries 
     WHERE user_id = $1
     ORDER BY year DESC`,
    [userId]
  )
  
  return result.rows.map(row => ({
    year: row.year,
    totalEvents: row.total_events,
    topFeeling: row.top_feeling,
    summary: row.summary_text,
    createdAt: row.created_at
  }))
}
