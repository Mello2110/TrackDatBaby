import { NextResponse } from 'next/server'
import { getAdminDb, getAdminMessaging } from '@/lib/firebase-admin'
import { getNowLocal } from '@/lib/utils'
import type { messaging } from 'firebase-admin'
import { Receiver } from '@upstash/qstash'

export const dynamic = 'force-dynamic'

// ── Server-side decryption (mirrors utils.ts but uses Buffer instead of atob/btoa) ──
const SECRET_KEY = 'babytrack-safe-key'

function decryptName(encrypted: string): string {
  if (!encrypted || !encrypted.startsWith('ENC:')) return encrypted || ''
  try {
    const base64 = encrypted.slice(4)
    // Use Buffer (Node.js) instead of atob (browser-only)
    const decoded = Buffer.from(base64, 'base64').toString('binary')
    return Array.from(decoded).map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('')
  } catch (e) {
    return encrypted
  }
}

// ── Upstash security handler ──────────────────────────────────────────────────
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
})

async function handler(_request: Request) {
  try {
    const adminDb = getAdminDb()
    const adminMessaging = getAdminMessaging()

    const nowStr = getNowLocal('Europe/Berlin')
    const [, currentTime] = nowStr.split('T')

    console.log(`[QStash-Cron] Checking alarms for ${currentTime}...`)

    const notifications: messaging.TokenMessage[] = []

    // 1. Get all babies
    const babiesSnap = await adminDb.collection('babies').get()
    
    for (const babyDoc of babiesSnap.docs) {
      const baby = babyDoc.data()
      // Decrypt the baby name – it is stored encrypted in Firestore
      const babyName = decryptName(baby.name)
      const alarms = baby.alarms || []
      const dueAlarms = alarms.filter((a: any) => a.time === currentTime)
      
      if (dueAlarms.length > 0) {
        const caregivers = baby.caregivers || []
        
        for (const cg of caregivers) {
          const userDoc = await adminDb.collection('users').doc(cg.userId).get()
          if (!userDoc.exists) continue

          const user = userDoc.data()!
          const enabledAlarms: string[] = user?.settings?.enabledAlarms || []
          const pushEnabled: boolean = user?.settings?.notifications?.push ?? false
          // Deduplicate tokens. Keep only the LAST one to guarantee one notification
          // per user per alarm, regardless of how many tokens are stored in Firestore.
          const rawTokens: string[] = user?.fcmTokens || []
          const tokens: string[] = rawTokens.length > 0 ? [rawTokens[rawTokens.length - 1]] : []

          if (!pushEnabled || tokens.length === 0) continue

          dueAlarms.forEach((alarm: any) => {
            if (!enabledAlarms.includes(alarm.id)) return

            // Map alarm type to German label + emoji
            const typeLabel =
              alarm.type === 'feeding'    ? '🍼 Mahlzeit' :
              alarm.type === 'medication' ? '💊 Medikamente' :
                                            '🔔 Sonstiges'

            // Decrypt alarm label in case it is also encrypted
            const alarmLabel = decryptName(alarm.label)

            tokens.forEach((token: string) => {
              notifications.push({
                token,
                notification: {
                  title: typeLabel,
                  body: `${babyName} · Zeit für: ${alarmLabel}`,
                },
                data: {
                  babyId: babyDoc.id,
                  alarmId: alarm.id,
                  type: alarm.type,
                },
                android: {
                  priority: 'high',
                  notification: {
                    channelId: 'alarms',
                    sound: 'default',
                  },
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default',
                      badge: 1,
                    },
                  },
                },
              })
            })
          })
        }
      }
    }

    if (notifications.length > 0) {
      console.log(`[QStash] Sending ${notifications.length} notification(s)...`)
      // Send in batches of 500 (FCM limit)
      const batches: messaging.TokenMessage[][] = []
      for (let i = 0; i < notifications.length; i += 500) {
        batches.push(notifications.slice(i, i + 500))
      }
      await Promise.all(batches.map(batch => adminMessaging.sendEach(batch)))
    } else {
      console.log('[QStash] No due alarms found.')
    }

    return NextResponse.json({ 
      success: true, 
      sent: notifications.length,
      time: currentTime 
    })

  } catch (error: any) {
    console.error('[QStash Error]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Wrap the handler with Upstash signature verification (production only)
export const POST = async (req: Request) => {
  if (process.env.NODE_ENV !== 'production') {
    return handler(req)
  }

  const signature = req.headers.get('upstash-signature') || ''
  const body = await req.text()
  const isValid = await receiver.verify({ signature, body })

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 })
  }

  return handler(req)
}

// Allow GET for manual testing
export const GET = handler
