# 👶 BabyTrack

<p align="center">
  <em>Every little moment — meals, milestones, health and growth — all in one place.</em>
</p>

## 🌟 Live Demo
👉 **[BabyTrack Live ansehen](https://trackdatbaby.vercel.app/)** 

*(Hinweis: Sobald du das Projekt bei Vercel importierst, ändert sich die URL ggf. zu deiner eigenen. Trage sie dann hier ein!)*

---

## 📖 Über die App
BabyTrack ist eine moderne Web-App für Eltern und Caregiver, um die Entwicklung, Gesundheit und den Alltag ihres Babys zu dokumentieren. Die App zeichnet sich durch ein klares, intuitives Design aus, das sich dank verschiedener Themes (Light, Dark, Baby-Aesthetics) perfekt anpasst.

### ✨ Hauptfunktionen
* **🚼 Onboarding & Profile:** Einfacher Wizard für Eltern- und Baby-Profile.
* **👨‍👩‍👧 Multi-Caregiver Support:** Lade Partner, Babysitter oder Großeltern ein und steuere ihre Zugriffsrechte (Read-Only vs. Full-Access).
* **🍼 Feeding Logs:** Protokolliere Mahlzeiten (Stillen, Fläschchen, Beikost) einfach und übersichtlich.
* **📈 Growth Tracking:** Dokumentiere Gewicht und Größe mit einer klaren Historie.
* **⭐ Milestones:** Speichere Meilensteine mit Timing-Indikatoren (Early / On time / Delayed).
* **🤒 Illness & Health:** Tracke Krankheitssymptome, Fieber und Medikamente mit einem 1-10 Severity-Slider.
* **🎭 Behavior & Mood:** Dokumentiere Energie- und Sozialverhalten deines Babys mit interaktiven Range-Slidern.

---

## 🛠️ Tech Stack
* **Frontend:** Next.js 14 (App Router), React
* **Styling:** Custom CSS / CSS Modules (kein Tailwind, Fokus auf CSS Custom Properties & Theming)
* **Backend / Database:** Firebase (Firestore)
* **Authentifizierung:** Firebase Auth (Email/Passwort & Google)
* **Hosting:** Vercel

---

## 🚀 Lokale Installation für Entwickler

1. **Repository klonen**
   ```bash
   git clone https://github.com/DEIN-GITHUB-NAME/TrackDatBaby.git
   cd TrackDatBaby
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   Kopiere die `.env.example` in eine neue `.env.local` Datei und fülle sie mit deinen Firebase Credentials aus der Firebase Console.
   ```bash
   cp .env.example .env.local
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```
   Die App ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

---

## 🔒 Sicherheitsregeln (Firestore)
Die App nutzt strikte Firestore Security Rules, um sicherzustellen, dass nur autorisierte Caregiver auf die Daten eines Babys zugreifen können. Die aktuellen Regeln befinden sich in der `firestore.rules`.
