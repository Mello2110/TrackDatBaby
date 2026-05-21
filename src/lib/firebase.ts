import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Prevent re-initialization in Next.js hot reload
const isNewApp = !getApps().length
const app = isNewApp ? initializeApp(firebaseConfig) : getApp()

// Enable offline persistence on first init; fall back to standard Firestore on HMR re-runs
// persistentLocalCache uses IndexedDB so writes are committed locally first,
// then synced to the server — eliminating all client-side write latency.
export const db = isNewApp
  ? initializeFirestore(app, { localCache: persistentLocalCache() })
  : getFirestore(app)

export const auth = getAuth(app)
export const messaging = async () => (await isSupported()) ? getMessaging(app) : null

export const googleProvider = new GoogleAuthProvider()

export default app
