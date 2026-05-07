/**
 * Centralized utility functions for date and timezone handling.
 */

export function getNowLocal(timezone: string = 'Europe/Berlin') {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const map: any = {}
    parts.forEach(p => map[p.type] = p.value)
    
    // Some browsers/environments might return '24' instead of '00' for hour 12 AM
    let hour = map.hour
    if (hour === '24') hour = '00'
    
    return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`
  } catch (e) {
    // Fallback to system local if timezone is invalid
    const d = new Date()
    const offset = d.getTimezoneOffset() * 60000
    const local = new Date(d.getTimezoneOffset() - offset)
    return local.toISOString().slice(0, 16)
  }
}

export function formatInTimezone(date: Date, timezone: string = 'Europe/Berlin') {
  try {
    return date.toLocaleString('de-DE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return date.toLocaleString()
  }
}

/**
 * Parses a datetime-local string (YYYY-MM-DDTHH:mm) in the context of a specific timezone
 * and returns a standard UTC Date object.
 */
export function parseLocalToUTC(localStr: string, timezone: string = 'Europe/Berlin'): Date {
  // We create a Date object from the string. By default, JS treats this as local time.
  // To correctly interpret it as the target timezone, we can use a trick:
  const date = new Date(localStr)
  
  // Get the difference between UTC and the target timezone at that specific date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })
  
  const parts = formatter.formatToParts(date)
  const map: any = {}
  parts.forEach(p => map[p.type] = p.value)
  
  const tzDate = new Date(Date.UTC(
    parseInt(map.year),
    parseInt(map.month) - 1,
    parseInt(map.day),
    parseInt(map.hour === '24' ? '0' : map.hour),
    parseInt(map.minute),
    parseInt(map.second)
  ))
  
  const diff = tzDate.getTime() - date.getTime()
  return new Date(date.getTime() - diff)
}
