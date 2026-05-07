// ── AUTH ──────────────────────────────────────────────────
export type AuthProvider = 'email' | 'google' | 'apple'

// ── USER / PARENT ─────────────────────────────────────────
export interface UserProfile {
  uid: string
  name: string
  dob: string
  bloodType: string
  familyDiseases: string
  personalDiseases: string
  notes: string
  role: CaregiverRole
  createdAt: Date
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'baby'
  rememberMe: boolean
  language: string
  timezone: string
  enabledAlarms: string[] // IDs of alarms that are active for this user
  notifications: NotificationSettings
}

export interface Alarm {
  id: string
  type: 'feeding' | 'medication' | 'custom'
  label: string
  time: string
  babyId?: string
}

export interface NotificationSettings {
  feeding: boolean
  medication: boolean
  push: boolean
}

// ── CAREGIVER ─────────────────────────────────────────────
export type CaregiverRole =
  | 'mother'
  | 'father'
  | 'grandma'
  | 'grandad'
  | 'aunt'
  | 'uncle'
  | 'other'

export type AccessLevel = 'full' | 'caregiver'

export interface Caregiver {
  userId: string
  role: CaregiverRole
  customRoleName?: string
  accessLevel: AccessLevel
  invitedBy: string
  addedAt: Date
}

// ── BABY ──────────────────────────────────────────────────
export interface BabyProfile {
  id: string
  name: string
  dob: string
  gender: 'girl' | 'boy' | 'other'
  bloodType: string
  birthWeight: string
  birthHeight: string
  allergies: string
  medications: string
  vaccinations: string
  notes: string
  caregivers: Caregiver[]
  alarms: Alarm[] // Shared alarms for this baby
  createdAt: Date
  createdBy: string
}

// ── INVITE CODE ───────────────────────────────────────────
export interface InviteCode {
  code: string
  babyId: string
  createdBy: string
  role: CaregiverRole
  customRoleName?: string
  accessLevel: AccessLevel
  createdAt: Date
  expiresAt: Date
  used: boolean
}

// ── MEALS ─────────────────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'bottle_feed'
export type FoodType = 'breast_milk' | 'formula' | 'solids' | 'other'
export type QuantityUnit = 'g' | 'ml' | 'oz'

export interface MealEntry {
  id: string
  babyId: string
  loggedBy: string
  timestamp: Date
  mealType: MealType
  foodType: FoodType
  quantity: number
  unit: QuantityUnit
  notes?: string
  createdAt: Date
}

// ── ILLNESS ───────────────────────────────────────────────
export type SymptomType = 'fever' | 'rash' | 'cough' | 'vomiting' | 'diarrhoea' | 'other'
export type IllnessStatus = 'ongoing' | 'improving' | 'resolved'

export interface IllnessEntry {
  id: string
  babyId: string
  loggedBy: string
  timestamp: Date
  symptomType: SymptomType
  temperature?: number
  severity: number // 1–10
  medication?: string
  status: IllnessStatus
  notes?: string
  createdAt: Date
}

// ── DEVELOPMENT ───────────────────────────────────────────
export type MilestoneType = 'first_words' | 'walking' | 'social' | 'learning' | 'other'
export type ComparisonStatus = 'early' | 'on_time' | 'delayed'

export interface DevelopmentEntry {
  id: string
  babyId: string
  loggedBy: string
  timestamp: Date
  milestoneType: MilestoneType
  description: string
  ageInMonths: number
  comparisonStatus: ComparisonStatus
  notes?: string
  createdAt: Date
}

// ── BEHAVIOR ──────────────────────────────────────────────
export type BehaviorType = 'mood' | 'energy' | 'social' | 'temperament' | 'other'

export interface BehaviorEntry {
  id: string
  babyId: string
  loggedBy: string
  timestamp: Date
  behaviorType: BehaviorType
  description: string
  energyScale: number   // 1–10 calm→hyperactive
  socialScale: number   // 1–10 shy→outgoing
  trigger?: string
  duration?: string
  response?: string
  notes?: string
  createdAt: Date
}

// ── STATS ─────────────────────────────────────────────────
export type StatType = 'weight' | 'height' | 'head_circumference' | 'shoe_size'
export type StatUnit = 'kg' | 'g' | 'cm' | 'eu'

export interface StatEntry {
  id: string
  babyId: string
  loggedBy: string
  timestamp: Date
  statType: StatType
  value: number
  unit: StatUnit
  notes?: string
  createdAt: Date
}

// ── FIRESTORE PATHS ───────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  BABIES: 'babies',
  INVITE_CODES: 'inviteCodes',
} as const

export const SUBCOLLECTIONS = {
  MEALS: 'meals',
  ILLNESS: 'illness',
  DEVELOPMENT: 'development',
  BEHAVIOR: 'behavior',
  STATS: 'stats',
} as const
