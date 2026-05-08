import { NextResponse } from 'next/server'
import { getAdminDb, getAdminMessaging } from '@/lib/firebase-admin'
import { getNowLocal } from '@/lib/utils'
import type { messaging } from 'firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Security check for Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const adminDb = getAdminDb()
    const adminMessaging = getAdminMessaging()

    const nowStr = getNowLocal('Europe/Berlin')
    const [, currentTime] = nowStr.split('T')

    console.log(`[Cron] Checking alarms for ${currentTime}...`)

    const notifications: messaging.TokenMessage[] = []

    // 1. Get all babies
    const babiesSnap = await adminDb.collection('babies').get()
    
    for (const babyDoc of babiesSnap.docs) {
      const baby = babyDoc.data()
      const alarms = baby.alarms || []
      const dueAlarms = alarms.filter((a: any) => a.time === currentTime)
      
      if (dueAlarms.length > 0) {
        const caregivers = baby.caregivers || []
        
        for (const cg of caregivers) {
          const userDoc = await adminDb.collection('users').doc(cg.userId).get()
          if (userDoc.exists) {
            const user = userDoc.data()
            const enabledAlarms = user?.settings?.enabledAlarms || []
            const pushEnabled = user?.settings?.notifications?.push
            const tokens = user?.fcmTokens || []

            if (pushEnabled && tokens.length > 0) {
              dueAlarms.forEach((alarm: any) => {
                if (enabledAlarms.includes(alarm.id)) {
                  tokens.forEach((token: string) => {
                    notifications.push({
                      token,
                      notification: {
                        title: `${alarm.label} 🔔`,
                        body: `Zeit für ${baby.name}! (${alarm.time})`,
                      },
                      data: {
                        babyId: babyDoc.id,
                        alarmId: alarm.id,
                        type: alarm.type
                      },
                      android: {
                        priority: 'high',
                        notification: {
                          channelId: 'alarms',
                          sound: 'default'
                        }
                      },
                      apns: {
                        payload: {
                          aps: {
                            sound: 'default',
                            badge: 1
                          }
                        }
                      }
                    })
                  })
                }
              })
            }
          }
        }
      }
    }

    if (notifications.length > 0) {
      console.log(`[Cron] Sending ${notifications.length} notifications...`)
      const batches: messaging.TokenMessage[][] = []
      for (let i = 0; i < notifications.length; i += 500) {
        batches.push(notifications.slice(i, i + 500))
      }
      await Promise.all(batches.map(batch => adminMessaging.sendEach(batch)))
    }

    return NextResponse.json({ 
      success: true, 
      sent: notifications.length,
      time: currentTime 
    })

  } catch (error: any) {
    console.error('[Cron Error]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
