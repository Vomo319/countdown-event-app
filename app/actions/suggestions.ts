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

// Contextual suggestions based on event category and timing
const SUGGESTIONS: Record<string, Record<number, string>> = {
  Travel: {
    60: 'Now\'s a good time to start researching destinations and flights.',
    30: 'It\'s time to book your flights and accommodations if you haven\'t already.',
    14: 'Start packing and confirm your travel documents are up to date.',
    7: 'Make a packing list and gather everything you need.',
    3: 'Pack your bags and set reminders for early departure.',
    1: 'Do a final check: passport, tickets, and valuables.',
  },
  Wedding: {
    180: 'Begin planning the wedding details and booking vendors.',
    120: 'Send out save-the-date notices.',
    60: 'Finalize guest list and send invitations.',
    30: 'Follow up with RSVPs and finalize seating arrangements.',
    14: 'Confirm all vendors and final details.',
    3: 'Prepare speeches and playlists.',
  },
  Birthday: {
    30: 'Think about party theme, date, and guest list.',
    14: 'Send invitations or messages to guests.',
    7: 'Confirm attendance and plan activities.',
    3: 'Order cake and decorations.',
    1: 'Prepare drinks and snacks.',
  },
  Milestones: {
    60: 'Start planning how you want to celebrate.',
    30: 'Invite close people to join the celebration.',
    14: 'Plan the details of your celebration.',
    7: 'Prepare mentally for this special moment.',
    1: 'Get ready to embrace this achievement!',
  },
  'Personal': {
    30: 'Start preparing for this moment.',
    14: 'Get excited! Share your anticipation.',
    7: 'Final preparations and mindset setting.',
    1: 'You\'re ready. This is your moment!',
  },
}

export async function generateSuggestions(eventId: string, category: string, eventDate: string) {
  const userId = await getUserId()
  
  const event = new Date(eventDate)
  const now = new Date()
  const daysUntil = Math.ceil((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const categoryKey = category in SUGGESTIONS ? category : 'Personal'
  const suggestions = SUGGESTIONS[categoryKey]
  
  // Generate suggestions
  for (const [daysStr, suggestionText] of Object.entries(suggestions)) {
    const days = parseInt(daysStr)
    if (daysUntil >= days) {
      const suggestionId = uuidv4()
      
      await db.query(
        `INSERT INTO event_suggestions 
         (id, event_id, user_id, suggestion_text, suggestion_category, days_before_event, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [suggestionId, eventId, userId, suggestionText, category, days]
      )
    }
  }
  
  return { success: true }
}

export async function getActiveS uggestions(eventId: string) {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT * FROM event_suggestions 
     WHERE event_id = $1 AND user_id = $2 AND is_dismissed = false
     ORDER BY days_before_event DESC`,
    [eventId, userId]
  )
  
  return result.rows
}

export async function dismissSuggestion(suggestionId: string) {
  await db.query(
    `UPDATE event_suggestions SET is_dismissed = true WHERE id = $1`,
    [suggestionId]
  )
  
  return { success: true }
}

export async function getUpcomingSuggestions(dayRange: number = 30) {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT DISTINCT s.* FROM event_suggestions s
     JOIN events e ON s.event_id = e.id
     WHERE s.user_id = $1 
     AND s.is_dismissed = false
     AND (e.event_date - NOW()) <= ($2 || ' days')::INTERVAL
     AND (e.event_date - NOW()) > INTERVAL '0 days'
     ORDER BY e.event_date ASC`,
    [userId, dayRange]
  )
  
  return result.rows
}
