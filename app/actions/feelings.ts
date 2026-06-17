'use server'

export async function saveFeelingAction(eventId: string, feeling: string, intensity: number) {
  return { success: false, message: 'Deprecated' }
}

export async function getFeelingAction(eventId: string) {
  return { success: false, feeling: null }
}
