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

export async function setEventNotification(eventId: string, notificationConfig: {
  type: 'daily' | '7days' | '3days' | '1day' | 'day_of'
  reminderTime?: string
}) {
  const userId = await getUserId()
  const notificationId = uuidv4()
  
  const daysBefore = {
    daily: 0,
    '7days': 7,
    '3days': 3,
    '1day': 1,
    day_of: 0
  }
  
  const reminderDays = daysBefore[notificationConfig.type]
  
  // Upsert notification
  await db.query(
    `INSERT INTO event_notifications 
     (id, event_id, user_id, notification_type, reminder_days_before, reminder_time, is_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (event_id, user_id) DO UPDATE SET
       notification_type = $4,
       reminder_days_before = $5,
       reminder_time = $6,
       updated_at = NOW()`,
    [
      notificationId,
      eventId,
      userId,
      notificationConfig.type,
      reminderDays,
      notificationConfig.reminderTime || '09:00',
      true
    ]
  )
  
  return { success: true }
}

export async function getEventNotifications(eventId: string) {
  const userId = await getUserId()
  
  const result = await db.query(
    `SELECT * FROM event_notifications 
     WHERE event_id = $1 AND user_id = $2`,
    [eventId, userId]
  )
  
  return result.rows
}

export async function markNotificationSent(notificationId: string) {
  await db.query(
    `UPDATE event_notifications SET last_sent_at = NOW() WHERE id = $1`,
    [notificationId]
  )
}

// Get notifications that need to be sent now
export async function getPendingNotifications() {
  const result = await db.query(
    `SELECT n.*, e.event_title, e.event_emoji 
     FROM event_notifications n
     JOIN events e ON n.event_id = e.id
     WHERE n.is_enabled = true
     AND (n.last_sent_at IS NULL OR n.last_sent_at < NOW() - INTERVAL '24 hours')`
  )
  
  return result.rows
}
