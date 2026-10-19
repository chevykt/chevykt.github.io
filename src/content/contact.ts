/**
 * Contact: the headline is the route's own line; faqEyebrow, faqSub and the form copy are the plate
 * and the form beside it. Change the words here, never in the components.
 */
export const contactPage = {
  eyebrow: 'Contact',
  titleThin: 'Tell me what',
  titleBold: 'you need built.',
  lede: 'Read the answers first. If your question is still open, write and I will reply with a plan or a straight no.',
  faqEyebrow: 'FAQs',
  faqTitle: 'Quick answers',
  faqSub: 'Still have one? Write below.',
  cardTitle: 'Send me a message',
  cardBody: 'What do you need? What are you using today? Two or three lines is enough.',
}

/** The form. Send posts to Formspree, which forwards the message to my inbox. */
export const contactForm = {
  action: 'https://formspree.io/f/mqeblwql',
  subject: 'Dev portfolio enquiry',
  first: 'First name',
  last: 'Last name',
  email: 'Email',
  message: 'Tell me more about your project',
  phFirst: 'First name',
  phLast: 'Last name',
  phEmail: 'you@company.com',
  phMessage: 'What do you need? What are you using today? What does a good result look like?',
  send: 'Send message',
  sending: 'Sending…',
  hint: 'Sent through Formspree to my inbox. Your details are used only to reply.',
  error: 'Add your name, a real email, and a short note.',
  failed: 'That did not go through. Your message is still here; try again, or write to',
  sentTitle: 'Thanks, it is on its way.',
  sentBody: 'I read every message and reply within one business day.',
  // Shown under the sent note, for a visitor who would rather use their own mail app.
  noMailApp: 'Prefer email? Write to',
  again: 'Write another',
}
