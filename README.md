# 👶 BabyTrack

<p align="center">
  <em>Every little moment — meals, milestones, health and growth — all in one place.</em>
</p>

## 🌟 Live Demo
👉 **[BabyTrack Live ansehen](https://trackdatbaby.vercel.app/)** 

---

## 📖 Über die App
BabyTrack ist eine moderne Web-App für Eltern und Caregiver, um die Entwicklung, Gesundheit und den Alltag ihres Babys zu dokumentieren. Die App zeichnet sich durch ein klares, intuitives Design aus, das sich dank verschiedener Themes (Light, Dark, Baby-Aesthetics) perfekt anpasst.

### ✨ Hauptfunktionen
* **🌍 Multi-Language Support:** Vollständig auf Deutsch und Englisch übersetzbar.
* **🚼 Onboarding & Profile:** Wizard-geführte Einrichtung für Eltern- und Baby-Profile.
* **👨‍👩‍👧 Caregiver & Invite System:** Teile den Zugriff mit Partnern oder Großeltern via Invite-Codes.
* **🍼 Feeding Logs:** Protokolliere Mahlzeiten (Stillen, Fläschchen, Beikost).
* **📈 Growth Stats:** Dokumentiere Gewicht, Größe, Kopfumfang und Schuhgröße.
* **⭐ Meilensteine:** Tracke die Entwicklung mit Timing-Indikatoren.
* **🤒 Gesundheit:** Protokolliere Krankheitssymptome, Fieber und Medikamente.
* **🎭 Verhalten:** Interaktive Slider für Stimmung, Energie und soziales Verhalten.

---

## 🛠️ Für Tech-Interessierte (Nerd-Section)

### Tech Stack
* **Framework:** Next.js 14 (App Router) für effizientes Server-Side Rendering und Routing.
* **Sprache:** TypeScript für Typsicherheit und Robustheit.
* **Backend:** Firebase (Firestore) als NoSQL-Echtzeit-Datenbank.
* **Authentifizierung:** Firebase Auth (Email/Password, Vorbereitung für OAuth).
* **Styling:** Vanilla CSS mit CSS Custom Properties (Variablen) für ein modulares Designsystem und dynamisches Theming ohne externe UI-Libraries.

### App-Struktur
* **`/src/app`**: Nutzt den Next.js App Router. Jede Route ist in logische Verzeichnisse unterteilt (z.B. `/baby/[babyId]` für dynamische Baby-Profile).
* **`/src/components`**: Wiederverwendbare UI-Komponenten (Topbar, TabBar, InputGroups), die über ein zentrales Designsystem gesteuert werden.
* **`/src/lib`**: 
    * `db.ts`: Zentrale Datenbank-Schnittstelle (Firebase CRUD-Logik).
    * `AuthContext.tsx`: Globaler State für den angemeldeten User.
    * `LanguageContext.tsx`: Custom i18n-Lösung für den Sprachwechsel.
* **`/src/styles`**: Globale Styles und Design-Tokens (Colors, Spacing, Typography).

### Datenbank-Design
Die Datenstruktur ist so aufgebaut, dass jedes Baby-Dokument eine Liste von `caregivers` (User-IDs) enthält. Security Rules auf Datenbank-Ebene stellen sicher, dass User nur Dokumente lesen/schreiben können, wenn ihre ID in dieser Liste enthalten ist.

---

## 🚀 Lokale Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/Mello2110/TrackDatBaby.git
   cd TrackDatBaby
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   Erstelle eine `.env.local` Datei basierend auf den Firebase Credentials aus deinem Google/Firebase Projekt.

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

---

## 🔒 Sicherheitskonzept
Der Zugriff auf sensible Daten wird über serverseitige Firestore Security Rules gesteuert. Invite-Codes sind zeitlich begrenzt (24h) und nur einmalig verwendbar, um unbefugten Zugriff zu verhindern.
