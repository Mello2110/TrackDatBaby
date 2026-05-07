import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { createUser, getUser } from './db'

export async function signUpWithEmail(
  email: string,
  password: string,
  rememberMe: boolean
) {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  )
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await createUser(cred.user.uid, { uid: cred.user.uid })
  return cred.user
}

export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe: boolean
) {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  )
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  // Create user doc if first time
  const existing = await getUser(cred.user.uid)
  if (!existing) {
    await createUser(cred.user.uid, {
      uid: cred.user.uid,
      name: cred.user.displayName || '',
    })
  }
  return cred.user
}


export async function logOut() {
  await signOut(auth)
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb)
}
