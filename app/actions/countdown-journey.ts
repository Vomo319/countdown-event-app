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

// Generate journey milestones based on days remaining
export async function generateCountdownJourney(eventId: string, eventDate: string) {
  const userId = await getUserId()
  
  const event = new Date(eventDate)
  const now = new Date()
  const totalDays = Math.ceil((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const milestones = [
    { days: totalDays, type: 'start', message: 'Your journey begins! This is what you\'re looking forward to.' },
    { days: Math.ceil(totalDays * 0.75), type: '75percent', message: 'You\'re 25% of the way there. The anticipation builds...' },
    { days: Math.ceil(totalDays / 2), type: 'halfway', message: 'Halfway there! Can you feel the excitement?' },
    { days: Math.ceil(totalDays * 0.25), type: '25percent', message: 'Just 25% left. The countdown is getting real!' },
    { days: 7, type: 'one_week', message: 'One week away. This is it!' },
    { days: 1, type: 'tomorrow', message: 'Tomorrow\'s the day! Tonight, rest and imagine.' },
    { days: 0, type: 'today', message: 'It\'s here! Today is the day.' },
  ]
  
  // Insert milestones
  for (const milestone of milestones) {
    const journeyId = uuidv4()
    const milestoneDate = new Date(event.getTime() - milestone.days * 24 * 60 * 60 * 1000)
    
    await db.query(
      `INSERT INTO countdown_journey (id, event_id, user_id, milestone_type, milestone_date, days_remaining, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [journeyId, eventId, userId, milestone.type, milestoneDate.toISOString(), milestone.days, milestone.message]
    )
  }
  
  return { success: true, milestonesCreated: milestones.length }
}

export async function getCountdownJourney(eventId: string) {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT * FROM countdown_journey 
     WHERE event_id = $1 AND user_id = $2
     ORDER BY days_remaining DESC`,
    [eventId, userId]
  )
  
  return result.rows
}

export async function getJourneyProgress(eventId: string) {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT 
       COUNT(*) as total_milestones,
       SUM(CASE WHEN milestone_date <= NOW() THEN 1 ELSE 0 END) as completed_milestones
     FROM countdown_journey
     WHERE event_id = $1 AND user_id = $2`,
    [eventId, userId]
  )
  
  const row = result.rows[0]
  const total = parseInt(row.total_milestones)
  const completed = parseInt(row.completed_milestones)
  
  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100)
  }
}
