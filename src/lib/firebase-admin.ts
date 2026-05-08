import admin from 'firebase-admin'

function initAdmin() {
  if (!admin.apps.length) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT
      if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set')
      const serviceAccount = JSON.parse(raw)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    } catch (error) {
      console.error('Firebase admin initialization error', error)
    }
  }
  return admin
}

export function getAdminDb() {
  return initAdmin().firestore()
}

export function getAdminMessaging() {
  return initAdmin().messaging()
}
