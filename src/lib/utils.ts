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
    
    let hour = map.hour
    // Normalize hour (some envs return 24 for 00)
    if (hour === '24') hour = '00'
    
    return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`
  } catch (e) {
    const d = new Date()
    return d.toISOString().slice(0, 16)
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

export function parseLocalToUTC(localStr: string, timezone: string = 'Europe/Berlin'): Date {
  // Strategy: Create a UTC Date from the components, then adjust by the offset
  // that the target timezone has at THAT UTC time.
  const [datePart, timePart] = localStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute))
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
  })
  
  const formatted = formatter.formatToParts(utcDate)
  const map: any = {}
  formatted.forEach(p => map[p.type] = p.value)
  
  const testDate = new Date(Date.UTC(
    parseInt(map.year),
    parseInt(map.month) - 1,
    parseInt(map.day),
    parseInt(map.hour === '24' ? '0' : map.hour),
    parseInt(map.minute)
  ))
  
  const offsetMs = testDate.getTime() - utcDate.getTime()
  return new Date(utcDate.getTime() - offsetMs)
}

/**
 * Simple reversible obfuscation for "name protection" in the database.
 * In a production app, this would use proper crypto (e.g. AES-GCM) with shared keys.
 */
const SECRET_KEY = 'babytrack-safe-key'

export function encryptName(name: string): string {
  if (!name) return ''
  // Simple XOR-like obfuscation + prefix to identify encrypted data
  const chars = Array.from(name).map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
  ).join('')
  return 'ENC:' + btoa(unescape(encodeURIComponent(chars)))
}

export function decryptName(encrypted: string): string {
  if (!encrypted || !encrypted.startsWith('ENC:')) return encrypted || ''
  try {
    const base64 = encrypted.slice(4)
    const chars = decodeURIComponent(escape(atob(base64)))
    return Array.from(chars).map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('')
  } catch (e) {
    return encrypted // Fallback to original if decryption fails
  }
}
