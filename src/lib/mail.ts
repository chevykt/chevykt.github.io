export type ContactMessage = { firstName: string; lastName: string; email: string; message: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The fields still empty, or the email when it is not shaped like one, in form order. */
export function missingFields(m: ContactMessage): (keyof ContactMessage)[] {
  return (['firstName', 'lastName', 'email', 'message'] as const).filter((k) => (k === 'email' ? !EMAIL.test(m.email.trim()) : !m[k].trim()))
}

/** Every field filled and the email shaped like one. Formspree does the real check. */
export function isCompleteMessage(m: ContactMessage): boolean {
  return missingFields(m).length === 0
}
