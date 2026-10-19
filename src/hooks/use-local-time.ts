import { useEffect, useState } from 'react'

const format = (timeZone: string, date: Date) => ({
  label: new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date),
  /** HH:mm in that zone, for <time dateTime>. */
  iso: new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date),
})

/** The current time in `timeZone` ("9:41 AM"), re-rendered on each minute boundary, not every second. */
export function useLocalTime(timeZone: string) {
  const [time, setTime] = useState(() => format(timeZone, new Date()))

  useEffect(() => {
    let interval = 0
    const tick = () => setTime(format(timeZone, new Date()))
    const timeout = window.setTimeout(() => {
      tick()
      interval = window.setInterval(tick, 60_000)
    }, 60_000 - (Date.now() % 60_000))
    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [timeZone])

  return time
}
