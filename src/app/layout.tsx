import type { Metadata } from 'next'
import '@/styles/globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { ThemeProvider } from '@/lib/ThemeContext'
import { LanguageProvider } from '@/lib/LanguageContext'
import { AlarmWatcher } from '@/components/AlarmWatcher'

export const metadata: Metadata = {
  title: 'TrackDatBaby',
  description: 'Every little moment, remembered.',
  manifest: '/manifest.json',
  themeColor: '#A85C28',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    title: 'TrackBaby',
    statusBarStyle: 'default',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
            });
          }
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <div className="app-frame">
                {children}
              </div>
              <AlarmWatcher />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
