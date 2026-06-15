'use client'

export interface ScheduledReminder {
  eventId: string
  eventTitle: string
  eventDate: Date
  reminderType: 'daily' | 'week' | 'three_days' | 'one_day' | 'day_of'
  reminderTime: string
  feeling?: string
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[v0] Browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Calculate when to show a reminder based on event date and reminder type
function calculateReminderDate(eventDate: Date, reminderType: string): Date {
  const reminder = new Date(eventDate)
  
  switch (reminderType) {
    case 'daily':
      // Show daily at specified time until event
      return new Date()
    case 'week':
      reminder.setDate(reminder.getDate() - 7)
      break
    case 'three_days':
      reminder.setDate(reminder.getDate() - 3)
      break
    case 'one_day':
      reminder.setDate(reminder.getDate() - 1)
      break
    case 'day_of':
      // Same day as event
      break
  }
  
  return reminder
}

// Get motivational message based on feeling
function getMotivationalMessage(eventTitle: string, daysRemaining: number, feeling?: string): string {
  const templates: Record<string, string[]> = {
    excited: [
      `${eventTitle} is in ${daysRemaining} days — can you feel the anticipation? 🎉`,
      `${daysRemaining} days until ${eventTitle}. Your excitement is justified!`,
      `The countdown continues... ${daysRemaining} days to go! ✨`,
    ],
    nervous: [
      `${eventTitle} is ${daysRemaining} days away. Take a deep breath — you've got this. 💪`,
      `Nervous about ${eventTitle}? That means it matters. ${daysRemaining} days left.`,
      `${daysRemaining} days until ${eventTitle}. Remember why you're looking forward to this.`,
    ],
    hopeful: [
      `${eventTitle} in ${daysRemaining} days. Keep hoping, keep dreaming! 🌟`,
      `Your hopes and dreams are ${daysRemaining} days away.`,
      `${daysRemaining} days of beautiful anticipation ahead.`,
    ],
    grateful: [
      `So grateful to count down to ${eventTitle}. ${daysRemaining} days left! 🙏`,
      `${daysRemaining} days until ${eventTitle}. What are you most grateful for?`,
      `Appreciation grows as ${eventTitle} approaches — ${daysRemaining} days to go.`,
    ],
    anxious: [
      `${eventTitle} in ${daysRemaining} days. Ground yourself in this moment.`,
      `It's okay to feel anxious. ${eventTitle} is ${daysRemaining} days away.`,
      `${daysRemaining} days. One moment at a time.`,
    ],
    joyful: [
      `Pure joy ahead! ${eventTitle} is ${daysRemaining} days away! 💖`,
      `${daysRemaining} days of pure happiness until ${eventTitle}!`,
      `Your joy is contagious — ${daysRemaining} days to celebration!`,
    ],
  }

  const messages = templates[feeling || 'hopeful'] || templates.hopeful
  return messages[Math.floor(Math.random() * messages.length)]
}

// Show a local notification
export async function showLocalNotification(
  title: string,
  options: NotificationOptions & { eventId?: string } = {}
): Promise<Notification | null> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null
  }

  try {
    const notification = new Notification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      ...options,
    })

    // Close after 10 seconds if not interacted with
    setTimeout(() => notification.close(), 10000)

    return notification
  } catch (error) {
    console.error('[v0] Failed to show notification:', error)
    return null
  }
}

// Schedule a reminder notification
export async function scheduleReminder(reminder: ScheduledReminder): Promise<void> {
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    console.log('[v0] Notification permission not granted')
    return
  }

  const reminderDate = calculateReminderDate(reminder.eventDate, reminder.reminderType)
  const now = new Date()
  
  if (reminderDate <= now && reminder.reminderType !== 'daily') {
    console.log('[v0] Reminder date is in the past')
    return
  }

  // Store reminder in localStorage for persistence
  const reminders = JSON.parse(localStorage.getItem('scheduled_reminders') || '[]')
  reminders.push({
    ...reminder,
    id: `${reminder.eventId}-${reminder.reminderType}`,
    createdAt: now.toISOString(),
  })
  localStorage.setItem('scheduled_reminders', JSON.stringify(reminders))

  // For daily reminders, set up a check every minute
  if (reminder.reminderType === 'daily') {
    const interval = setInterval(async () => {
      const currentTime = new Date()
      const [hours, minutes] = reminder.reminderTime.split(':')
      
      if (
        currentTime.getHours() === parseInt(hours) &&
        currentTime.getMinutes() === parseInt(minutes)
      ) {
        const daysRemaining = Math.ceil(
          (reminder.eventDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysRemaining >= 0) {
          const message = getMotivationalMessage(
            reminder.eventTitle,
            daysRemaining,
            reminder.feeling
          )
          
          await showLocalNotification(`Waiting For — ${reminder.eventTitle}`, {
            body: message,
            eventId: reminder.eventId,
            tag: reminder.eventId,
          })
        } else {
          // Event has passed, clear this reminder
          clearInterval(interval)
        }
      }
    }, 60000) // Check every minute
  } else {
    // One-time reminder: schedule with setTimeout
    const timeUntilReminder = reminderDate.getTime() - now.getTime()
    
    if (timeUntilReminder > 0) {
      setTimeout(async () => {
        const daysRemaining = Math.ceil(
          (reminder.eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        const message = getMotivationalMessage(
          reminder.eventTitle,
          Math.max(0, daysRemaining),
          reminder.feeling
        )
        
        await showLocalNotification(`Waiting For — ${reminder.eventTitle}`, {
          body: message,
          eventId: reminder.eventId,
          tag: reminder.eventId,
        })
      }, timeUntilReminder)
    }
  }
}

// Cancel a scheduled reminder
export function cancelReminder(eventId: string, reminderType: string): void {
  const reminders = JSON.parse(localStorage.getItem('scheduled_reminders') || '[]')
  const filtered = reminders.filter(
    (r: any) => !(r.eventId === eventId && r.reminderType === reminderType)
  )
  localStorage.setItem('scheduled_reminders', JSON.stringify(filtered))
}
