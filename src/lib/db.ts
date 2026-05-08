import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc,
  addDoc, deleteDoc, query, orderBy, where, Timestamp,
  arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { encryptName, decryptName } from './utils'
import type {
  UserProfile, UserSettings, BabyProfile, Caregiver,
  MealEntry, IllnessEntry, DevelopmentEntry, BehaviorEntry,
  StatEntry, InviteCode, CaregiverRole, AccessLevel,
} from '@/types'

// ── USER ──────────────────────────────────────────────────
export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.profile?.name) {
    data.profile.name = decryptName(data.profile.name)
  }
  return data
}

export async function createUser(uid: string, profile: Partial<UserProfile>) {
  const encryptedProfile = { ...profile, uid }
  if (encryptedProfile.name) {
    encryptedProfile.name = encryptName(encryptedProfile.name)
  }
  await setDoc(doc(db, 'users', uid), {
    profile: encryptedProfile,
    settings: {
      theme: 'light',
      rememberMe: true,
      language: 'en',
      timezone: 'Europe/Berlin',
      enabledAlarms: [], // Changed from alarms array to enabled IDs
      notifications: { feeding: true, medication: false, push: true },
    },
    linkedBabies: [],
    createdAt: serverTimestamp(),
  })
}

export async function updateUserProfile(uid: string, profile: Partial<UserProfile>) {
  const encrypted = { ...profile }
  if (encrypted.name) encrypted.name = encryptName(encrypted.name)
  await updateDoc(doc(db, 'users', uid), { profile: encrypted })

  // Global Role Sync: Update all linked babies where this user is a caregiver
  const userData = await getUser(uid)
  if (userData?.linkedBabies && profile.role) {
    await Promise.all(userData.linkedBabies.map(async (babyId: string) => {
      const babyRef = doc(db, 'babies', babyId)
      const babySnap = await getDoc(babyRef)
      if (babySnap.exists()) {
        const caregivers = babySnap.data().caregivers || []
        const updated = caregivers.map((c: any) => 
          c.userId === uid ? { ...c, role: profile.role } : c
        )
        await updateDoc(babyRef, { caregivers: updated })
      }
    }))
  }
}

export async function updateUserSettings(uid: string, settings: Partial<UserSettings>) {
  await updateDoc(doc(db, 'users', uid), { settings })
}

// ── BABY ──────────────────────────────────────────────────
export async function getBaby(babyId: string) {
  const snap = await getDoc(doc(db, 'babies', babyId))
  if (!snap.exists()) return null
  const data = snap.data()
  
  if (data.name) data.name = decryptName(data.name)
  
  // Auto-migrate: Add caregiverIds if missing
  if (!data.caregiverIds && data.caregivers) {
    data.caregiverIds = data.caregivers.map((c: any) => c.userId)
    await updateDoc(doc(db, 'babies', babyId), { caregiverIds: data.caregiverIds })
  }
  
  return { id: snap.id, ...data } as BabyProfile
}

export async function getUserBabies(uid: string): Promise<BabyProfile[]> {
  const userData = await getUser(uid)
  if (!userData?.linkedBabies?.length) return []
  const babies = await Promise.all(
    userData.linkedBabies.map((id: string) => getBaby(id))
  )
  return babies.filter(Boolean) as BabyProfile[]
}

export async function createBaby(
  uid: string,
  profile: Omit<BabyProfile, 'id' | 'caregivers' | 'createdAt' | 'createdBy' | 'alarms'>
) {
  const encrypted = { ...profile }
  if (encrypted.name) encrypted.name = encryptName(encrypted.name)

  const ref = await addDoc(collection(db, 'babies'), {
    ...encrypted,
    caregivers: [{
      userId: uid,
      role: 'mother' as CaregiverRole,
      accessLevel: 'full' as AccessLevel,
      invitedBy: uid,
      addedAt: Timestamp.now(),
    }],
    caregiverIds: [uid],
    alarms: [], // Shared alarms
    createdAt: serverTimestamp(),
    createdBy: uid,
  })
  // Link baby to user
  await updateDoc(doc(db, 'users', uid), {
    linkedBabies: arrayUnion(ref.id),
  })
  return ref.id
}

export async function updateBabyProfile(
  babyId: string,
  profile: Partial<BabyProfile>
) {
  const encrypted = { ...profile }
  if (encrypted.name) encrypted.name = encryptName(encrypted.name)
  await updateDoc(doc(db, 'babies', babyId), { ...encrypted })
}

export async function deleteBaby(babyId: string, uid: string) {
  const babyRef = doc(db, 'babies', babyId)
  const babySnap = await getDoc(babyRef)
  if (!babySnap.exists()) return

  const data = babySnap.data()
  const caregivers = data.caregivers || []
  
  // Only someone with full access can delete
  const me = caregivers.find((c: any) => c.userId === uid)
  if (me?.accessLevel !== 'full') {
    throw new Error('Only caregivers with full access can delete the profile.')
  }

  // Remove reference from all caregivers' linkedBabies
  const caregiverIds = data.caregiverIds || caregivers.map((c: any) => c.userId)
  await Promise.all(caregiverIds.map(async (id: string) => {
    const userRef = doc(db, 'users', id)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      const userData = userSnap.data()
      const updatedBabies = (userData.linkedBabies || []).filter((bid: string) => bid !== babyId)
      await updateDoc(userRef, { linkedBabies: updatedBabies })
    }
  }))

  // Delete the baby document itself
  await deleteDoc(babyRef)
}

// ── ACCESS CONTROL HELPERS ────────────────────────────────
export function isCaregiver(baby: BabyProfile, uid: string) {
  return baby.caregivers.some((c) => c.userId === uid)
}

export function hasFullAccess(baby: BabyProfile, uid: string) {
  return baby.caregivers.some(
    (c) => c.userId === uid && c.accessLevel === 'full'
  )
}

// ── INVITE CODES ──────────────────────────────────────────
export async function generateInviteCode(
  babyId: string,
  createdBy: string,
  role: CaregiverRole,
  accessLevel: AccessLevel,
  customRoleName = ''
): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')

  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  )

  await setDoc(doc(db, 'inviteCodes', code), {
    babyId, createdBy, role, customRoleName,
    accessLevel, used: false,
    createdAt: Timestamp.now(), expiresAt,
  })
  return code
}

export async function redeemInviteCode(
  code: string,
  currentUserId: string
): Promise<string> {
  const codeRef = doc(db, 'inviteCodes', code)
  const codeSnap = await getDoc(codeRef)

  if (!codeSnap.exists()) throw new Error('Invalid invite code.')
  const data = codeSnap.data() as InviteCode
  if (data.used) throw new Error('This invite code has already been used.')
  if ((data.expiresAt as any).toDate() < new Date())
    throw new Error('This invite code has expired.')

  const babyRef = doc(db, 'babies', data.babyId)
  const babySnap = await getDoc(babyRef)
  const caregivers: Caregiver[] = babySnap.data()?.caregivers || []

  if (caregivers.find((c) => c.userId === currentUserId))
    throw new Error('You are already linked to this baby.')

  // Role matching check
  const userProfile = await getUser(currentUserId)
  const userRole = userProfile?.profile?.role || 'other'
  if (data.role !== 'other' && data.role !== userRole) {
    throw new Error(`This invite code is for a ${data.role}, but your profile says ${userRole}. Please update your profile or ask for a new code.`)
  }

  await updateDoc(babyRef, {
    caregivers: arrayUnion({
      userId: currentUserId,
      role: data.role,
      customRoleName: data.customRoleName || '',
      accessLevel: data.accessLevel,
      invitedBy: data.createdBy,
      addedAt: Timestamp.now(),
    }),
    caregiverIds: arrayUnion(currentUserId),
  })
  await updateDoc(doc(db, 'users', currentUserId), {
    linkedBabies: arrayUnion(data.babyId),
  })
  await deleteDoc(codeRef)
  return data.babyId
}

// ── GENERIC ENTRY HELPERS ─────────────────────────────────
async function addEntry(babyId: string, sub: string, data: object) {
  const ref = await addDoc(
    collection(db, 'babies', babyId, sub),
    { ...data, createdAt: serverTimestamp() }
  )
  return ref.id
}

async function getEntries(babyId: string, sub: string) {
  const q = query(
    collection(db, 'babies', babyId, sub),
    orderBy('timestamp', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

async function deleteEntry(babyId: string, sub: string, entryId: string) {
  await deleteDoc(doc(db, 'babies', babyId, sub, entryId))
}

// ── MEALS ─────────────────────────────────────────────────
export const addMeal = (babyId: string, data: Omit<MealEntry, 'id' | 'createdAt'>) =>
  addEntry(babyId, 'meals', data)
export const getMeals = (babyId: string) => getEntries(babyId, 'meals')
export const deleteMeal = (babyId: string, id: string) =>
  deleteEntry(babyId, 'meals', id)

// ── ILLNESS ───────────────────────────────────────────────
export const addIllness = (babyId: string, data: Omit<IllnessEntry, 'id' | 'createdAt'>) =>
  addEntry(babyId, 'illness', data)
export const getIllnesses = (babyId: string) => getEntries(babyId, 'illness')
export const deleteIllness = (babyId: string, id: string) =>
  deleteEntry(babyId, 'illness', id)

// ── DEVELOPMENT ───────────────────────────────────────────
export const addDevelopment = (babyId: string, data: Omit<DevelopmentEntry, 'id' | 'createdAt'>) =>
  addEntry(babyId, 'development', data)
export const getDevelopments = (babyId: string) => getEntries(babyId, 'development')
export const deleteDevelopment = (babyId: string, id: string) =>
  deleteEntry(babyId, 'development', id)

// ── BEHAVIOR ──────────────────────────────────────────────
export const addBehavior = (babyId: string, data: Omit<BehaviorEntry, 'id' | 'createdAt'>) =>
  addEntry(babyId, 'behavior', data)
export const getBehaviors = (babyId: string) => getEntries(babyId, 'behavior')
export const deleteBehavior = (babyId: string, id: string) =>
  deleteEntry(babyId, 'behavior', id)

// ── STATS ─────────────────────────────────────────────────
export const addStat = (babyId: string, data: Omit<StatEntry, 'id' | 'createdAt'>) =>
  addEntry(babyId, 'stats', data)
export const getStats = (babyId: string) => getEntries(babyId, 'stats')
export const deleteStat = (babyId: string, id: string) =>
  deleteEntry(babyId, 'stats', id)

// Get latest stat by type
export async function getLatestStat(babyId: string, statType: string) {
  const q = query(
    collection(db, 'babies', babyId, 'stats'),
    where('statType', '==', statType),
    orderBy('timestamp', 'desc')
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ── ALARMS (SHARED) ──────────────────────────────────────
export async function updateBabyAlarms(babyId: string, alarms: any[]) {
  await updateDoc(doc(db, 'babies', babyId), { alarms })
}

export async function toggleUserAlarm(uid: string, alarmId: string, enabled: boolean) {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) return

  const currentEnabled = snap.data().settings?.enabledAlarms || []
  let updated
  if (enabled) {
    updated = Array.from(new Set([...currentEnabled, alarmId]))
  } else {
    updated = currentEnabled.filter((id: string) => id !== alarmId)
  }

  await updateDoc(userRef, {
    'settings.enabledAlarms': updated
  })
}

export async function saveFCMToken(uid: string, token: string) {
  const userRef = doc(db, 'users', uid)
  // We overwrite the array with just this token to avoid duplicate notifications.
  // If multi-device support is needed in the future, use arrayUnion instead.
  await updateDoc(userRef, {
    fcmTokens: [token]
  })
}

export async function removeFCMToken(uid: string, token: string) {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    fcmTokens: arrayRemove(token)
  })
}
