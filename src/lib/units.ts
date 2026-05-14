import { differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears } from 'date-fns'

export function formatAge(dob: string, preferredUnit: string | undefined, t: any) {
  const birth = new Date(dob)
  const now = new Date()
  
  if (preferredUnit === 'days') {
    const days = differenceInDays(now, birth)
    return `${days} ${t('baby.dashboard.days')}`
  }
  if (preferredUnit === 'weeks') {
    const weeks = differenceInWeeks(now, birth)
    return `${weeks} ${t('baby.dashboard.weeks')}`
  }
  if (preferredUnit === 'months') {
    const months = differenceInMonths(now, birth)
    return `${months} ${t('baby.dashboard.months')}`
  }
  if (preferredUnit === 'years') {
    const years = differenceInYears(now, birth)
    return `${years} ${t('baby.dashboard.years')}`
  }
  
  // Default logic (mix of weeks, months, years)
  const diffMs = now.getTime() - birth.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  const weeks = Math.ceil((diffDays + 0.1) / 7)
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()

  if (months < 12) {
    return `${weeks || 1} ${t('baby.dashboard.wk')}`
  }
  if (months < 24) {
    return `${months} ${t('baby.dashboard.mo')}`
  }
  return `${Math.floor(months / 12)} ${t('baby.dashboard.yr')}`
}

export function formatWeight(valueInKg: number, preferredUnit: string | undefined, t: any) {
  if (preferredUnit === 'g') {
    return `${Math.round(valueInKg * 1000)} ${t('baby.dashboard.g')}`
  }
  return `${valueInKg.toFixed(2)} ${t('baby.dashboard.kg')}`
}

export function convertToKg(value: number, unit: string): number {
  if (unit === 'g') return value / 1000
  return value
}
