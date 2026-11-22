# 🎬 Netflix Clone - 100% Frontend Streaming Platform

A complete, high-performance, and responsive Netflix streaming web application built with **React 19**, **Vite**, **Firebase 11**, **The Movie Database (TMDB) API**, and the **Internet Archive API**.

> **Architecture Notice:** This project operates on a **100% Pure Frontend Architecture**. It requires **zero Node.js/Express backend server** and **zero MongoDB database**. Media catalogs, full-length stream matching, user authentication, and watchlist persistence run directly on the client side using modern browser APIs, Firebase Web SDK, and secure direct API integrations.

---

## 🌟 Key Features

### 1. 🎞️ Real-Time TMDB Movie Catalog
- **Live Now Playing API:** Direct integration with `https://api.themoviedb.org/3/movie/now_playing`.
- **Frontend Image Quality Filter:** Automatically eliminates any movie with missing backdrop or poster artwork.
- **Hero Spotlight Swap:** Promotes top titles into full-bleed, high-resolution hero banners with seamless gradients.
- **Category & Genre Filtering:** Instant client-side filtering by genre pills: *Action, Comedy, Horror, Thriller, Romance*.

### 2. 📺 Full-Length Movie & Web Series Streaming
- **Internet Archive Matching Engine:** Resolves verified, publicly accessible full-length feature films from Archive.org.
- **No Fake URLs / No Trailer Redirections:** Every title connects directly to an actual full-length video stream (`.mp4`/HLS) in the player.
- **TV & Web Series Hub:** Complete multi-season television catalog with episodic navigation and stream resolution.

### 3. 🎥 Custom HTML5 Video Player
- Built-in video player supporting standard **MP4** and **HLS** streams (powered by `hls.js`).
- Complete playback controls: **Play/Pause, Seekbar, Volume & Mute, Fullscreen, Playback Speed (0.5x - 2.0x)**.
- **Keyboard Shortcuts:** Spacebar (Play/Pause), Left/Right arrows (Seek ±10s), M (Mute), F (Fullscreen).
- **Progress Memory:** Automatically saves and resumes playback positions.

### 4. 🔐 Firebase Authentication & Password Reset
- **Email & Password Authentication:** Client-side account creation and sign-in via Firebase Auth.
- **Forgot Password / Gmail Reset:** Built-in password reset dispatching a secure reset link directly to the user's Gmail/inbox.
- **Smart Confirmation UI:** Displays an email confirmation screen with a 3-step guide, Spam folder notice, **"Open Gmail ↗"** direct shortcut, and a 30-second cooldown on resending.

### 5. 📑 User Watchlist & Account Profile
- **Firestore Watchlist:** Users can add/remove movies to "My List", synced live to Firebase Firestore.
- **Dedicated Profile Page (`/profile`):** Displays account tier, active membership badge, saved title counters, and streaming preferences.
- **Social Media Hub:** Official clickable redirect links to **Instagram** (`https://instagram.com/netflix`) and **Twitter / X** (`https://twitter.com/netflix`).

### 6. ⚡ Zero-Flicker Performance & Shimmer Skeletons
- **Session Caching:** Synchronous `sessionStorage` caching eliminates page refresh delays and random image flashes.
- **Netflix Card Skeletons:** Animated CSS shimmer cards provide smooth visual transitions while data loads.

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (Version **18.0.0** or higher)
- [npm](https://www.npmjs.com/)

### Step 1: Navigate to Project Directory
```bash
cd Netflix-clone
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the provided `.env.example` file to create your local `.env`:
```bash
# On Windows (PowerShell):
Copy-Item .env.example .env

# On macOS / Linux:
cp .env.example .env
```

Open `.env` and configure your API tokens (built-in fallback keys are also pre-configured):
```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
VITE_TMDB_TOKEN=your_tmdb_bearer_token_here
```

### Step 4: Run the Development Server
```bash
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 📁 Project Directory Structure

```text
Netflix/
├── .gitignore                  # Root Git ignore rules (protects .env & secrets)
├── README.md                   # Main project overview & documentation
└── Netflix-clone/              # React 19 + Vite Frontend Application
    ├── .env.example            # Environment template (safe for Git)
    ├── .gitignore              # Package-level Git ignore rules
    ├── index.html              # Single Page Application root HTML
    ├── package.json            # NPM dependencies & scripts
    ├── vite.config.js          # Vite build configuration
    ├── public/                 # Static assets & favicon
    └── src/
        ├── assets/             # Brand logos, icons, cards, spinner
        ├── components/
        │   ├── Footer/         # Footer with social links (Instagram, Twitter)
        │   ├── MovieModal/     # Quick movie preview & detail modal
        │   ├── Navbar/         # Header with live search & profile dropdown
        │   ├── TitleCards/     # Horizontal carousels with drag-to-scroll
        │   └── VideoPlayer/    # HTML5 video player with full controls
        ├── firebase.js         # Firebase Auth & Firestore client setup
        ├── pages/
        │   ├── Home/           # Hero spotlight & categorized movie library
        │   ├── Login/          # Sign In, Sign Up, & Gmail Password Reset
        │   ├── Player/         # Fullscreen streaming player page
        │   ├── Profile/        # User account details & social redirects
        │   ├── Series/         # Web series catalog with seasons and episodes
        │   └── Watchlist/      # Saved "My List" collection
        └── services/
            ├── api.js          # Unified services facade
            ├── archiveService.js # Internet Archive stream resolvers
            ├── firebaseService.js# Firestore watchlist & progress database helper
            ├── tmdbService.js  # Direct TMDB API requests with memory caching
            └── videoService.js # Movie matching engine connecting TMDB to streams
```

---

## 🛡️ Security & Token Protection

This project strictly adheres to security best practices:
1. **Zero Secret Leaks:** `.gitignore` explicitly excludes `.env`, `.env.*`, `*.pem`, `*.key`, and secret token files from Git.
2. **Template Provided:** Only `.env.example` (containing safe placeholder values) is committed to version control.
3. **Client-Side Auth:** Firebase authentication tokens are kept in secure browser storage (`IndexedDB`) with automatic refresh cycles, preventing token exposure.

---

## 🛠️ Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Launches the local Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles and bundles production-ready assets into the `dist/` directory. |
| `npm run preview` | Serves the production build locally for testing. |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues. |

---

## 📄 License & Disclaimer

This project is created strictly for **educational and personal portfolio purposes**. Movie metadata and images are provided by **The Movie Database (TMDB)**. Playable feature films and classic web series are sourced from the public domain and open-access collections on the **Internet Archive**. All trademarks and brand assets belong to their respective owners.
