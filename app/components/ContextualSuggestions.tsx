'use client'

interface ContextualSuggestionsProps {
  eventId: string
  category?: string
  daysRemaining: number
  isDark: boolean
}

const SUGGESTIONS_BY_CATEGORY: Record<string, Record<string, string>> = {
  travel: {
    '30': 'Book your flights now for best prices',
    '14': 'Check passport expiration dates',
    '7': 'Reserve rental cars or transportation',
    '3': 'Pack your luggage',
    '1': 'Set alarms and check weather',
  },
  birthday: {
    '30': 'Plan the party or celebration',
    '14': 'Send out invitations',
    '7': 'Buy or order a gift',
    '3': 'Confirm RSVPs',
    '1': 'Prepare decorations',
  },
  wedding: {
    '90': 'Book your venue',
    '60': 'Send save-the-dates',
    '30': 'Finalize guest list',
    '14': 'Order wedding attire',
    '7': 'Confirm all arrangements',
    '3': 'Final headcount',
    '1': 'Get rest and stay calm',
  },
  graduation: {
    '30': 'Prepare your speech or remarks',
    '14': 'Arrange transportation for guests',
    '7': 'Organize regalia and attire',
    '3': 'Invite friends and family',
    '1': 'Get good sleep',
  },
  holiday: {
    '30': 'Plan your itinerary',
    '14': 'Book accommodations',
    '7': 'Shop and prepare',
    '3': 'Clean and organize',
    '1': 'Pack and prepare',
  },
}

function getSuggestion(category?: string, daysRemaining?: number): string | null {
  if (!category || daysRemaining === undefined) return null
  
  const suggestions = SUGGESTIONS_BY_CATEGORY[category]
  if (!suggestions) return null

  const days = Math.max(0, daysRemaining)
  const sortedDays = Object.keys(suggestions)
    .map(Number)
    .sort((a, b) => b - a)
  
  for (const day of sortedDays) {
    if (days >= day) {
      return suggestions[day.toString()]
    }
  }
  
  return Object.values(suggestions)[0]
}

export function ContextualSuggestionsComponent({
  eventId,
  category,
  daysRemaining,
  isDark,
}: ContextualSuggestionsProps) {
  const suggestion = getSuggestion(category, daysRemaining)

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-[var(--surface)] rounded-[20px] p-6 border border-[var(--border)]">
        <h3 className="text-[17px] font-semibold text-[var(--text)] mb-4">Smart Tips</h3>
        
        {suggestion ? (
          <div className="space-y-3">
            <div className="p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-[14px]">
              <div className="text-[14px] text-[var(--text)] font-medium">💡 {suggestion}</div>
            </div>
            
            <div className="text-[13px] text-[var(--text-tertiary)]">
              {daysRemaining && daysRemaining > 0 ? (
                <p>You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} to prepare</p>
              ) : (
                <p>Today's the day!</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[14px] text-center">
            <p className="text-[14px] text-[var(--text-secondary)]">
              Add a category (travel, birthday, wedding, etc.) to get personalized tips.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
