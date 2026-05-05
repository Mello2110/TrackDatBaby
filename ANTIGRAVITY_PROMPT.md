# BabyTrack — Antigravity Handoff Prompt

Kopiere diesen gesamten Text als erste Nachricht in Antigravity.

---

## Was ist das hier?

Wir bauen **BabyTrack** — eine vollständige Baby- und Kinder-Tracking-Web-App für Eltern und Pflegepersonen. Die App erlaubt es, Mahlzeiten, Gesundheit, Entwicklungsmeilensteine, Verhalten und Körperwachstum eines Babys zu tracken. Mehrere Personen (Eltern, Großeltern, Babysitter) können über ein Einladungssystem gemeinsam auf ein Baby-Profil zugreifen, mit verschiedenen Zugriffsrollen.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Firebase** (Auth, Firestore, Hosting)
- **TailwindCSS** + CSS Custom Properties für 3 Themes
- **Lucide Icons** (SVG, keine Emojis)

## Was bereits vollständig implementiert ist

Das Projektgerüst liegt vollständig vor. Folgende Dateien existieren und sind fertig:

### Core / Config
- `package.json` — alle Dependencies (next, firebase, tailwindcss, lucide-react, date-fns)
- `tsconfig.json`, `next.config.js`, `postcss.config.js`, `tailwind.config.js`
- `.env.example` — Vorlage für Firebase-Credentials
- `firebase.json` — Firebase Hosting + Firestore config
- `firestore.rules` — vollständige Sicherheitsregeln mit Caregiver-Rollen

### Styles & Types
- `src/styles/globals.css` — vollständiges 3-Theme-System als CSS Custom Properties:
  - **Light:** warmes Beige (`--bg: #DDD7CC`, `--surface: #F5F0E8`, `--accent: #A85C28`)
  - **Dark:** tiefes Espresso-Braun (`--bg: #12100C`, `--surface: #282018`) — warm, nie kalt
  - **Baby:** weiches Rosa (`--bg: #EDD8E4`, `--surface: #FDF6FA`, `--accent: #B83860`)
  - Alle Komponenten-Klassen via `@layer components` definiert (`.btn-primary`, `.card`, `.input-field`, `.topbar`, usw.)
- `src/types/index.ts` — alle TypeScript-Interfaces (UserProfile, BabyProfile, Caregiver, MealEntry, IllnessEntry, DevelopmentEntry, BehaviorEntry, StatEntry, InviteCode, etc.)

### Firebase / Auth / DB
- `src/lib/firebase.ts` — Firebase-Init (liest aus `.env.local`), Google + Apple Provider
- `src/lib/auth.ts` — alle Auth-Funktionen: `signUpWithEmail`, `signInWithEmail`, `signInWithGoogle`, `signInWithApple`, `logOut`
- `src/lib/db.ts` — alle Firestore-Operationen: User CRUD, Baby CRUD, Invite Code generieren/einlösen, alle Subcollection-Operationen für Meals, Illness, Development, Behavior, Stats
- `src/lib/AuthContext.tsx` — React Context mit `user`, `userData`, `loading`, `refreshUserData`
- `src/lib/ThemeContext.tsx` — Theme-Switcher (`light` | `dark` | `baby`), persistiert in `localStorage`, setzt `data-theme` auf `<html>`

### UI Components
- `src/components/ui/index.tsx` — fertige wiederverwendbare Komponenten:
  - `<Topbar>` mit Back-Button + Action-Button
  - `<TabBar>` mit Home/Baby/Settings-Tabs
  - `<ToggleRow>` — Toggle-Switch mit Label
  - `<InputGroup>` und `<SelectGroup>` — Form-Inputs
  - `<Pill>` mit Farb-Varianten (mint, rose, blue, lav, accent, neutral)
  - `<EntryTime>` — formatierter Timestamp
  - `<EmptyState>` — leerer Zustand mit Icon

### App Layout
- `src/app/layout.tsx` — Root Layout mit `<ThemeProvider>` + `<AuthProvider>`, Google Fonts DM Sans
- `src/app/page.tsx` — Root Redirect (prüft Auth + Onboarding-Status → leitet weiter)

### Vollständig implementierte Pages
- `src/app/(auth)/login/page.tsx` — Login mit Email/PW + Google + Apple, "Keep me signed in"-Toggle
- `src/app/(auth)/register/page.tsx` — Registrierung mit Email/PW + Google
- `src/app/dashboard/page.tsx` — Parent Dashboard: zeigt Baby-Cards, Invite-Code einlösen, Profil-Link
- `src/app/settings/page.tsx` — Settings: Theme-Switcher (3 Themes), Toggles, Language, Export-Buttons, Logout, Account löschen
- `src/app/baby/[babyId]/page.tsx` — Baby Hub: Quick-Stats, 4 Kategorie-Buttons, Recent Meals
- `src/app/baby/[babyId]/meals/page.tsx` — Vollständige Meals-Seite: Liste, Latest-Highlight, Add-Formular inline, Delete
- `src/app/baby/[babyId]/stats/page.tsx` — Vollständige Stats-Seite: Summary-Grid, Verlauf, Add-Formular inline
- `src/app/baby/[babyId]/wellbeing/page.tsx` — Well-being Hub mit 3 Subcategory-Buttons
- `src/app/baby/[babyId]/caregivers/page.tsx` — Caregiver-Liste + Invite-Code Generator (nur für Full Access)

## Was noch fehlt und jetzt implementiert werden muss

Die folgenden Seiten haben bereits eine Route (leeres Verzeichnis), aber noch keine `page.tsx`. Das Muster für jede Seite ist identisch zu `meals/page.tsx` — Latest-Highlight-Card oben, Liste darunter, Add-Formular als Inline-View bei `showForm === true`.

### PRIORITÄT 1 — Fehlende Core-Pages

#### 1. Onboarding (`src/app/onboarding/page.tsx`)
3-Schritt-Wizard, nur beim ersten Login angezeigt:
- **Step 1:** Willkommens-Screen mit App-Beschreibung
- **Step 2:** Eltern-Profil ausfüllen (Name, Geburtsdatum, Blutgruppe, Familienerkrankungen, persönliche Erkrankungen, Notizen) → speichert in `users/{uid}/profile` via `updateUserProfile()`
- **Step 3:** Erstes Baby hinzufügen (Name, Geburtsdatum, Geschlecht, Blutgruppe, Geburtsgewicht, Geburtsgröße) → erstellt via `createBaby()` und leitet zu `/dashboard` weiter
- Progress-Dots oben links (wie im Prototyp gesehen)
- Wenn `?step=baby` in URL → direkt zu Step 3 springen (für "Add another baby" vom Dashboard)

#### 2. Parent Profile (`src/app/parent-profile/page.tsx`)
- Formular mit allen Feldern: Name, Geburtsdatum, Blutgruppe, Familienerkrankungen, persönliche Erkrankungen, Notizen
- Lädt existierende Daten aus `userData.profile`
- Speichert via `updateUserProfile(user.uid, profile)`
- Topbar mit "Save"-Action-Button
- "Delete account" Button unten (mit Bestätigungs-Dialog)

#### 3. Baby Profile (`src/app/baby/[babyId]/profile/page.tsx`)
- Nur für Full Access Caregivers editierbar (prüfe mit `hasFullAccess()`)
- Felder: Name, Geburtsdatum, Geschlecht, Blutgruppe, Geburtsgewicht, Geburtsgröße, Allergien, aktuelle Medikamente, Impfungen, Notizen
- Familienerkrankungen: **auto-inherited** — zeige dieses Feld als read-only, befüllt aus den verknüpften Eltern-Profilen (lade alle Full-Access-Caregiver, hole deren `userData.profile.familyDiseases`, zeige zusammengefasst)
- Speichert via `updateBabyProfile(babyId, profile)`

### PRIORITÄT 2 — Well-being Subcategories

Alle drei folgen exakt demselben Muster wie `meals/page.tsx`:

#### 4. Illness (`src/app/baby/[babyId]/wellbeing/illness/page.tsx`)
Formular-Felder pro Eintrag:
- `timestamp` — datetime-local, default: jetzt
- `symptomType` — select: fever | rash | cough | vomiting | diarrhoea | other
- `temperature` — number input, optional (°C)
- `severity` — 1–10, als klickbare Dot-Row (nicht Slider): 10 Quadrate, aktive werden farbig (accent)
- `medication` — text input, optional (z.B. "Paracetamol 2.5ml at 10:00")
- `status` — select: ongoing | improving | resolved
- `notes` — textarea, optional

Latest-Card: zeigt symptomType + severity + status als Pills
Liste: zeigt alle Einträge chronologisch mit Timestamp

Nutzt `addIllness()`, `getIllnesses()`, `deleteIllness()` aus `lib/db.ts`

#### 5. Development (`src/app/baby/[babyId]/wellbeing/development/page.tsx`)
Formular-Felder:
- `timestamp` — datetime-local
- `milestoneType` — select: first_words | walking | social | learning | other
- `description` — textarea
- `ageInMonths` — number input
- `comparisonStatus` — 3 klickbare Buttons: "Early 🌟" | "On time ✓" | "A bit later" (Toggle-Style, aktiver Button bekommt Farbe: mint/blue/accent)
- `notes` — textarea, optional

Wichtig: Unter dem comparisonStatus-Selector immer diese supportive Note anzeigen:
> *"Every baby develops at their own pace — all milestones come in time."*

Nutzt `addDevelopment()`, `getDevelopments()`, `deleteDevelopment()` aus `lib/db.ts`

#### 6. Behavior (`src/app/baby/[babyId]/wellbeing/behavior/page.tsx`)
Formular-Felder:
- `timestamp` — datetime-local
- `behaviorType` — select: mood | energy | social | temperament | other
- `description` — textarea
- `energyScale` — range slider 1–10 mit Labels "Calm" ↔ "Hyperactive", live Wert-Anzeige
- `socialScale` — range slider 1–10 mit Labels "Shy" ↔ "Outgoing", live Wert-Anzeige
- `trigger` — text input, optional
- `duration` — text input, optional (z.B. "30 min")
- `response` — textarea, optional (was geholfen hat / was es schlimmer machte)
- `notes` — textarea, optional

Nutzt `addBehavior()`, `getBehaviors()`, `deleteBehavior()` aus `lib/db.ts`

### PRIORITÄT 3 — Firebase Setup

#### 7. Firebase Projekt einrichten

Führe folgende Schritte aus:

```bash
# 1. Dependencies installieren
npm install

# 2. Firebase CLI installieren (falls nicht vorhanden)
npm install -g firebase-tools

# 3. Firebase login
firebase login

# 4. Firebase init (wähle: Firestore, Hosting)
firebase init

# 5. Firestore Rules deployen
firebase deploy --only firestore:rules
```

Erstelle `.env.local` aus `.env.example` und befülle mit den Firebase-Credentials aus:
Firebase Console → Project Settings → Your apps → Web app → Config

In Firebase Console folgendes aktivieren:
- **Authentication** → Sign-in methods:
  - ✅ Email/Password
  - ✅ Google
  - ✅ Apple (optional, braucht Apple Developer Account)
- **Firestore** → Datenbank erstellen → Production mode
- **Hosting** → aktivieren

#### 8. `.gitignore`
Erstelle `.gitignore` mit mindestens:
```
node_modules/
.next/
.env.local
.firebase/
out/
```

---

## Design-Regeln — WICHTIG

Das Design ist exakt definiert und darf nicht verändert werden:

1. **Keine Emojis** in der UI — nur SVG-Icons (Lucide-Stil, `stroke-width="2"`, `stroke-linecap="round"`)
2. **Alle Boxen/Karten müssen sichtbar sein** ohne Hover — `border: 2px solid var(--border2)` auf allen Cards, Inputs, Buttons
3. **Buttons sind nie transparent** — `.btn-primary` hat immer `background: var(--accent)`, `.btn-ghost` hat immer `background: var(--surface)` + starken Border
4. **Inputs** haben immer `background: var(--surface)` + `border: 2px solid var(--border2)` — nie unsichtbar auf dem Hintergrund
5. **Schriften**: DM Sans, `font-weight: 700` für Überschriften, `600` für Labels, `500` für Body
6. **Rundungen**: Cards `border-radius: 14px`, Inputs/Buttons `border-radius: 10px`
7. **Tab Bar** ist `position: fixed; bottom: 0` mit `background: var(--surface)` und `border-top: 2px solid var(--border2)`
8. Das **Baby Theme** hat einen rosa-pastell Hintergrund (`#EDD8E4`) — es ist leicht verspielt aber nutzbar

## Firestore Datenstruktur (Referenz)

```
users/{uid}
  profile: { name, dob, bloodType, familyDiseases, personalDiseases, notes }
  settings: { theme, rememberMe, language, timezone, alarms[], notifications }
  linkedBabies: [babyId, ...]

babies/{babyId}
  name, dob, gender, bloodType, birthWeight, birthHeight,
  allergies, medications, vaccinations, notes
  caregivers: [{ userId, role, customRoleName, accessLevel, invitedBy, addedAt }]
  
  meals/{entryId}: { timestamp, mealType, foodType, quantity, unit, notes, loggedBy }
  illness/{entryId}: { timestamp, symptomType, temperature, severity, medication, status, notes, loggedBy }
  development/{entryId}: { timestamp, milestoneType, description, ageInMonths, comparisonStatus, notes, loggedBy }
  behavior/{entryId}: { timestamp, behaviorType, description, energyScale, socialScale, trigger, duration, response, notes, loggedBy }
  stats/{entryId}: { timestamp, statType, value, unit, notes, loggedBy }

inviteCodes/{code}
  { babyId, createdBy, role, customRoleName, accessLevel, createdAt, expiresAt, used }
```

## Access Control

```typescript
// In lib/db.ts bereits implementiert:
isCaregiver(baby, uid)    // kann Einträge loggen + lesen
hasFullAccess(baby, uid)  // kann Profil editieren, Caregivers einladen, exportieren
```

Regel: Mindestens ein Full-Access-Caregiver muss immer bestehen bleiben.

---

## Sofortiger Start

1. Unzip `babytrack.zip` in dein Arbeitsverzeichnis
2. `npm install`
3. `.env.example` → `.env.local` kopieren, Firebase-Credentials eintragen
4. Firebase-Projekt einrichten (siehe Priorität 3)
5. Mit Implementierung in Reihenfolge der Prioritäten beginnen: Onboarding → Parent Profile → Baby Profile → Illness → Development → Behavior

Alle Patterns, Types, DB-Funktionen und Styles sind bereits vollständig vorhanden — es geht nur noch um das Zusammenstecken der fehlenden Pages nach dem exakt gleichen Muster wie die bereits fertigen Pages.
