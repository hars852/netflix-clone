# 🎬 Netflix Clone - 100% Frontend Streaming Platform

A responsive, high-performance Netflix streaming application built with **React 19**, **Vite**, **Firebase 11**, the **TMDB (The Movie Database) API**, and the **Internet Archive API**.

> **Architecture Notice:** This project operates on a **100% Frontend-Only Architecture**. It requires **no Node.js/Express backend server** and **no MongoDB database**. All media catalogs, video stream matching, user authentication, and watchlist persistence run directly on the client side using modern browser APIs, Firebase Web SDK, and secure direct API integrations.

---

## 🌟 Key Features

### 1. 🎞️ Real-Time TMDB Movie Catalog
- **Live Now Playing API:** Consumes `GET https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1` in real-time.
- **Frontend Image Quality Filter:** Automatically eliminates any movie with missing backdrop or poster artwork.
- **Hero Spotlight Swap:** Promotes top titles into full-bleed, high-resolution hero banners with seamless gradients.
- **Category & Genre Filtering:** Instant client-side filtering by genre pills: *Action, Comedy, Horror, Thriller, Romance*.

### 2. 📺 Full-Length Movie & Web Series Streaming
- **Internet Archive Matching Engine:** Resolves verified, publicly accessible full-length feature films from Archive.org.
- **No Fake URLs / No Trailer Redirections:** Titles without verified streams clearly state *"Full movie currently unavailable"* rather than displaying trailers or broken streams.
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
- **Session Caching:** Synchronous `sessionStorage` caching eliminates page refresh delays.
- **Netflix Card Skeletons:** Animated CSS shimmer cards provide smooth visual transitions while data loads.

---

## 📁 Project Structure

```text
Netflix-clone/
├── .env.example                # Template for environment secrets
├── .gitignore                  # Exhaustive secrets & build ignore rules
├── index.html                  # HTML entry point
├── package.json                # Project dependencies & scripts
├── vite.config.js              # Vite configuration
├── public/                     # Static assets
└── src/
    ├── assets/                 # App logos, brand icons, spinner assets
    ├── components/
    │   ├── Footer/             # Footer with clickable social links (Instagram, Twitter)
    │   ├── MovieModal/         # Quick movie preview & detail modal
    │   ├── Navbar/             # Responsive header, live search, profile dropdown
    │   ├── TitleCards/         # Netflix horizontal carousels with drag-to-scroll
    │   └── VideoPlayer/        # Custom HTML5 responsive video player with controls
    ├── firebase.js             # Firebase Auth & Firestore client configuration
    ├── pages/
    │   ├── Home/               # Main movie library & hero spotlight
    │   ├── Login/              # Auth page with Sign In, Sign Up & Password Reset
    │   ├── Player/             # Fullscreen video playback page
    │   ├── Profile/            # User account details & social redirects
    │   ├── Series/             # Web series catalog with seasons and episodes
    │   └── Watchlist/          # User's saved "My List" collection
    └── services/
        ├── api.js              # Central services facade for frontend components
        ├── archiveService.js   # Internet Archive API queries & video file resolver
        ├── firebaseService.js  # Firestore watchlist & progress database helper
        ├── tmdbService.js      # Direct TMDB API requests with memory caching
        └── videoService.js     # Movie matching engine connecting TMDB to streams
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Version **18.0.0** or higher recommended)
- [npm](https://www.npmjs.com/) (installed automatically with Node.js)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/netflix-clone.git
cd netflix-clone/Netflix-clone
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
1. Copy the provided `.env.example` file to create your local `.env`:
   ```bash
   # On Windows (PowerShell):
   Copy-Item .env.example .env

   # On macOS / Linux:
   cp .env.example .env
   ```
2. Open `.env` and insert your **TMDB API Read Access Token**:
   ```env
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   VITE_TMDB_TOKEN=your_tmdb_bearer_token_here
   ```
   *(You can obtain a free API token by creating an account at [The Movie Database](https://www.themoviedb.org/settings/api)).*

### Step 4: Run the Development Server
```bash
npm run dev
```

The application will start immediately. Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🔒 Security & Privacy (Access Tokens & API Keys)

This project strictly adheres to security best practices to ensure private access tokens and sensitive data are **never leaked**:

1. **Git Protection:** The `.gitignore` file explicitly excludes `.env`, `.env.*`, `*.pem`, `*.key`, and secret credential dumps.
2. **Template Provided:** Only `.env.example` (containing blank placeholders) is committed to version control.
3. **Session Token Management:** Firebase authentication tokens are kept in secure browser storage (`IndexedDB`) with automatic 60-minute refresh cycles, preventing token exposure in plain code.

---

## 🛠️ Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Launches the local Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles and bundles production-ready assets into the `dist/` directory. |
| `npm run preview` | Serves the production build locally for testing. |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues. |

---

## 📦 Tech Stack

- **Frontend:** [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/), [React Router 7](https://reactrouter.com/)
- **Authentication & Database:** [Firebase 11](https://firebase.google.com/) (Auth, Firestore)
- **Data Providers:** [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api), [Internet Archive API](https://archive.org/help/about.php)
- **Video & Media:** Native HTML5 Video, [HLS.js](https://github.com/video-dev/hls.js/)
- **Icons & Notifications:** [React Icons](https://react-icons.github.io/react-icons/), [React Toastify](https://fkhadra.github.io/react-toastify/)

---

## 📄 License & Disclaimer

This project is created strictly for **educational and personal portfolio purposes**. Movie and television show metadata and images are provided by **The Movie Database (TMDB)**. Playable feature films and classic web series are sourced from the public domain and open-access collections on the **Internet Archive**. All trademarks and brand assets belong to their respective owners.
