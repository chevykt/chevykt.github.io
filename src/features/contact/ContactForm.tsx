import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle, PaperPlaneTilt, WarningCircle } from '@phosphor-icons/react'
import { contactForm as f } from '@/content/contact'
import { site } from '@/content/site'
import { isCompleteMessage, missingFields, type ContactMessage } from '@/lib/mail'

type Status = 'idle' | 'error' | 'sending' | 'failed' | 'sent'

const FIELDS = ['firstName', 'lastName', 'email', 'message'] as const

/**
 * The bottleneck form. A complete message posts to Formspree (JSON reply, so the visitor stays here);
 * without JavaScript the form's own action and method post it the same way. An incomplete one marks the
 * fields, focuses the first and shakes the button, and sends nothing. A failed send keeps the message
 * and offers the address instead.
 */
export function ContactForm({ nested = false }: { nested?: boolean }) {
  const Done = nested ? 'h4' : 'h3'
  const [status, setStatus] = useState<Status>('idle')
  const [invalid, setInvalid] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const sendRef = useRef<HTMLButtonElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)
  const refocus = useRef<'done' | 'form' | null>(null)

  // Focus follows the panel that just appeared (sent state, or the form again after "Write another").
  useEffect(() => {
    if (refocus.current === 'done') doneRef.current?.focus()
    if (refocus.current === 'form') formRef.current?.querySelector<HTMLInputElement>('input:not([type="hidden"])')?.focus()
    refocus.current = null
  }, [status])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'sending') return
    const form = event.currentTarget
    const data = new FormData(form)
    const message = Object.fromEntries(FIELDS.map((k) => [k, String(data.get(k) ?? '')])) as ContactMessage
    if (!isCompleteMessage(message)) {
      const missing = missingFields(message)
      setInvalid(missing)
      setStatus('error')
      formRef.current?.querySelector<HTMLElement>(`[name="${missing[0]}"]`)?.focus()
      // Restart the shake on every failed try without remounting the button (that would drop focus).
      const send = sendRef.current
      if (send) {
        send.classList.remove('is-shaking')
        void send.offsetWidth
        send.classList.add('is-shaking')
      }
      return
    }
    setInvalid([])
    setStatus('sending')
    try {
      const res = await fetch(f.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`Formspree ${res.status}`)
      form.reset()
      refocus.current = 'done'
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div className="ct-done" role="status">
        <CheckCircle size={30} weight="fill" aria-hidden />
        <Done ref={doneRef} tabIndex={-1}>
          {f.sentTitle}
        </Done>
        <p>{f.sentBody}</p>
        <p className="ct-done__fallback">
          {f.noMailApp} <a href={`mailto:${site.email}`}>{site.email}</a>
        </p>
        <div className="ct-done__actions">
          <button
            type="button"
            className="pg-btn"
            onClick={() => {
              refocus.current = 'form'
              setStatus('idle')
            }}
          >
            {f.again}
          </button>
        </div>
      </div>
    )
  }

  const field = (name: (typeof FIELDS)[number]) => ({ name, 'aria-invalid': invalid.includes(name) || undefined, 'aria-describedby': invalid.includes(name) ? 'ct-err' : undefined })

  return (
    <form ref={formRef} className="ct-form" action={f.action} method="POST" noValidate onSubmit={onSubmit}>
      <input type="hidden" name="_subject" value={f.subject} />
      <div className="ct-row2">
        <label className="ct-field">
          <span>{f.first}</span>
          <input type="text" {...field('firstName')} autoComplete="given-name" required maxLength={80} placeholder={f.phFirst} />
        </label>
        <label className="ct-field">
          <span>{f.last}</span>
          <input type="text" {...field('lastName')} autoComplete="family-name" required maxLength={80} placeholder={f.phLast} />
        </label>
      </div>
      <label className="ct-field">
        <span>{f.email}</span>
        <input type="email" {...field('email')} autoComplete="email" required maxLength={254} placeholder={f.phEmail} />
      </label>
      <label className="ct-field">
        <span>{f.message}</span>
        <textarea {...field('message')} required maxLength={1500} placeholder={f.phMessage} />
      </label>
      <div className="ct-actions">
        <button ref={sendRef} type="submit" className="ct-send" disabled={status === 'sending'} onAnimationEnd={(e) => e.currentTarget.classList.remove('is-shaking')}>
          <PaperPlaneTilt size={16} weight="fill" aria-hidden />
          {status === 'sending' ? f.sending : f.send}
        </button>
        {status === 'error' ? (
          <span id="ct-err" className="ct-err" role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden />
            {f.error}
          </span>
        ) : status === 'failed' ? (
          <span id="ct-err" className="ct-err" role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden />
            <span>
              {f.failed} <a href={`mailto:${site.email}`}>{site.email}</a>.
            </span>
          </span>
        ) : (
          <span className="ct-hint">{f.hint}</span>
        )}
      </div>
    </form>
  )
}
