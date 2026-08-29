<img width="1900" height="914" alt="Ekran görüntüsü 2026-08-29 140227" src="https://github.com/user-attachments/assets/c1fd9549-0932-4476-a136-8e79f43302d3" />
<img width="1902" height="906" alt="Ekran görüntüsü 2026-08-29 135813" src="https://github.com/user-attachments/assets/f52a6783-618e-4fef-9b4b-63f99b72e8fb" />

# ANIMERIA

Animeria is an open-source, monochrome-styled anime streaming and watchlist tracking platform. It aggregates multiple anime providers into a unified interface, integrates with the AniList GraphQL API, and features a multi-layered backend security architecture.

[GitHub Repository](https://github.com/fadimrak/animeria)

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Local Development Setup (Localhost)](#local-development-setup-localhost)
- [Production Deployment Guide](#production-deployment-guide)
  - [Why the Current Build is Optimized for Localhost](#why-the-current-build-is-optimized-for-localhost)
  - [Required Changes Before Production Deployment](#required-changes-before-production-deployment)
  - [Step-by-Step Deployment Options](#step-by-step-deployment-options)
- [Environment Variables (.env Reference)](#environment-variables-env-reference)
- [Security Architecture](#security-architecture)
- [License and DMCA Notice](#license-and-dmca-notice)

---

## Key Features

### 1. Advanced Video Player & Streaming
- **HLS (.m3u8) Streaming Support:** Built on Hls.js for adaptive bitrate and low-latency playback.
- **Multi-Provider Aggregation:** Instant source switching across providers including MKissa, Reanime, AniZone, AniKoto, AnimeGG, AniNeko, AniDB, 2dhive, Kickassanime, and AnimeDunya.
- **Sub & Dub Selector:** Seamlessly switch between Japanese audio with subtitles and English/localized dubs.
- **AniSkip Integration:** Automatic or manual one-click skipping for anime Openings (OP) and Endings (ED).
- **Custom Player Controls:** Playback speed adjustments (0.25x - 2x), resolution selection (1080p, 720p, 480p, 360p), Picture-in-Picture (PIP), full-screen mode, and comprehensive keyboard shortcuts.
- **Built-in HLS & Segment Stream Proxy:** Internal proxy engine to bypass upstream CORS restrictions, hotlinking blocks, and referer checks.

### 2. Catalog & Discovery Engine
- **AniList GraphQL Integration:** Real-time trending, popular releases, top-rated rankings, and seasonal airing schedules.
- **Advanced Filtering:** Multi-criteria filtering by genres, release year, season, media format (TV, Movie, OVA, ONA, Special), and sort metrics.
- **Real-Time Live Search:** Fast querying across titles, alternate romanized names, and character databases.

### 3. User Profiles & Watchlist Tracking
- **Categorized Watchlists:** Manage titles under Watching, Completed, Planning, Paused, and Dropped statuses.
- **In-Depth Profile Analytics:** Real-time metrics calculating total hours and days watched, completed episodes, average rating, and genre breakdown charts.
- **External Account Sync:** One-click list import and synchronization from AniList and MyAnimeList (MAL) accounts.
- **Episode Discussions:** Episode-specific comment section featuring spoiler tags and like interactions.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js (ES Modules), Express.js, Anivexa Core API Engine |
| **Frontend** | Vanilla JavaScript (ES6+), Semantic HTML5, Vanilla CSS3 (Custom Design System), Canvas Topography FX |
| **APIs & Data** | AniList GraphQL API, AniSkip API, Google Translate API |
| **Security** | Helmet, Zod Validation, Speakeasy (TOTP 2FA), JWT & HttpOnly Cookies, sanitize-html, SSRF Guard, Scrypt Password Hashing |
| **Database** | JSON Flat-File Storage (data/*.json) - *For local development* |
| **Containerization** | Docker (node:20-slim + curl) |

---

## Project Directory Structure

```text
animeria/
|-- Anivexa-API-main/        # Integrated anime provider scrapers and mapping engine
|-- backend/
|   |-- db.js                # Data access layer (users, sessions, watchlists, comments)
|   `-- security/            # Security middleware suite
|       |-- auditLogger.js   # Audit and access logging
|       |-- env.js           # Environment configuration validator
|       |-- fileUpload.js    # Image upload and buffer validation
|       |-- headers.js       # Helmet, CSP, HSTS, and HTTP security headers
|       |-- jwt.js           # JWT token generation and refresh rotation
|       |-- rateLimiter.js   # Layered rate limiters (Global, Auth, Comments, Proxy)
|       |-- rbac.js          # Role-based access control (USER / ADMIN)
|       |-- sanitizer.js     # XSS and NoSQL/Prototype Pollution sanitization
|       |-- ssrfGuard.js     # SSRF mitigation (blocks Localhost & Cloud Metadata IPs)
|       |-- twoFactor.js     # 2FA engine (TOTP QR codes & emergency backup codes)
|       `-- validator.js     # Zod schema input validation
|-- data/                    # Local JSON data files (users, sessions, watchlists, comments)
|-- public/                  # Frontend static web assets
|   |-- css/                 # Monochrome CSS stylesheets
|   |-- js/                  # Client scripts (api.js, player.js, auth.js, ui.js, etc.)
|   |-- browse.html          # Browse and advanced filter page
|   |-- dmca.html            # DMCA copyright policy and takedown request page
|   |-- index.html           # Landing home page
|   |-- profile.html         # User profile, statistics, and 2FA settings page
|   |-- top.html             # Top-rated anime ranking page
|   |-- trending.html        # Trending anime showcase page
|   `-- watch.html           # Video player streaming page
|-- .env.example             # Environment variable template
|-- Dockerfile               # Production container definition
|-- package.json             # Project dependencies and npm scripts
`-- server.js                # Primary Express server and API routing entrypoint
```

---

## Local Development Setup (Localhost)

Follow these steps to run the application locally on your machine:

### 1. Prerequisites
- Node.js (v18.0.0 or higher, **Node.js v20 LTS recommended**)
- npm, pnpm, or yarn
- curl (Standard on modern Linux, macOS, and Windows 10/11)

### 2. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/fadimrak/animeria.git
cd animeria
npm install
```

### 3. Configure Environment Variables
Create your local `.env` file from the provided template:
```bash
cp .env.example .env
```

Review your `.env` file configuration:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=local_development_jwt_secret_key_2026
SESSION_SECRET=local_development_session_secret_key_2026
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Start the Application
```bash
# Development mode (Hot-reload with node --watch)
npm run dev

# Or standard execution
npm start
```

Access the application in your browser: `http://localhost:3000`

---

## Production Deployment Guide

> [!IMPORTANT]
> Animeria is configured by default for local development. Before hosting on public cloud providers or servers, review the architectural considerations and deployment steps detailed below.

---

### Why the Current Build is Optimized for Localhost

1. **Flat-File JSON Database (`data/*.json`):**
   - User credentials, session tokens, watchlists, and comments are stored in local JSON files.
   - On **ephemeral / serverless** platforms (such as Vercel, Netlify, or free-tier Render instances), the local filesystem is reset on every sleep cycle or redeploy, wiping stored user data.
   - Production setups must use either a **Persistent Volume** or an external database adapter (e.g., PostgreSQL, MongoDB, Redis).

2. **Long-Running Video Stream Proxying:**
   - The `/api/proxy/stream` endpoint proxies live video segments through Node.js to bypass third-party CORS restrictions.
   - Serverless functions impose strict execution timeouts (10-60 seconds) and bandwidth caps. Therefore, a **persistent Node.js runtime (VPS, Container, or Dedicated Server)** is mandatory.

3. **HTTPS & Cookie Requirements:**
   - When running in production (`NODE_ENV=production`), HttpOnly cookies require `Secure=true` and `SameSite=Lax`. Browsers will reject these cookies unless your domain has an active SSL/TLS certificate (HTTPS).

4. **System-Level `curl` Dependency:**
   - Certain anime scraper modules use system-level `curl` to resolve Cloudflare-protected endpoints. Ensure `curl` is present in your server environment (this is pre-configured in the included `Dockerfile`).

---

### Required Changes Before Production Deployment

#### 1. Set Production Environment Variables
On your server or container dashboard, define strong cryptographic secrets and specify your production domain:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=use_a_cryptographically_secure_random_string_min_64_chars
SESSION_SECRET=use_a_cryptographically_secure_random_string_min_64_chars
CORS_ORIGIN=https://animeria.yourdomain.com
```

You can generate cryptographically secure keys with Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### 2. Persistent Storage or Database Adapter
- **If continuing with JSON Flat-File storage:** Attach a persistent volume to the `/app/data` directory inside Docker or your VPS.
- **For distributed/scalable setups:** Update `backend/db.js` to query an external PostgreSQL (via Prisma/Drizzle) or MongoDB instance.

#### 3. Reverse Proxy & SSL Configuration
- Deploy behind Nginx, Caddy, or Cloudflare.
- The server enables `app.set("trust proxy", 1);` by default. Verify that your reverse proxy forwards `X-Forwarded-For` and `X-Forwarded-Proto` headers.

---

### Step-by-Step Deployment Options

#### Option 1: Docker & Docker Compose Deployment (Recommended)

The repository includes an optimized [Dockerfile](Dockerfile) (`node:20-slim` + `curl`).

1. Create a `docker-compose.yml` file on your server:
```yaml
version: '3.8'

services:
  animeria:
    build: .
    container_name: animeria_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=your_production_jwt_secret_key
      - SESSION_SECRET=your_production_session_secret_key
      - CORS_ORIGIN=https://animeria.yourdomain.com
    volumes:
      - animeria_data:/app/data

volumes:
  animeria_data:
```

2. Build and launch the container:
```bash
docker compose up -d --build
```

---

#### Option 2: Linux VPS (Ubuntu/Debian) with PM2 & Nginx

1. **Install Server Packages:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

2. **Clone & Setup Project:**
```bash
cd /var/www
sudo git clone https://github.com/fadimrak/animeria.git
cd animeria
sudo npm ci --omit=dev
sudo cp .env.example .env
sudo nano .env # Enter production values
```

3. **Start Process with PM2:**
```bash
pm2 start server.js --name "animeria"
pm2 save
pm2 startup
```

4. **Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/animeria`):**
```nginx
server {
    server_name animeria.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable Site & Provision Let's Encrypt SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/animeria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d animeria.yourdomain.com
```

---

#### Option 3: PaaS Providers (Railway, Render, Coolify, CapRover)

- **Railway:** Connect the GitHub repository. In Settings > Disks, mount a **Persistent Volume** pointing to `/app/data`. Configure environment variables in the dashboard.
- **Render:** Deploy as a **Web Service** with Docker Environment. Add a Persistent Disk attached to `/app/data`.
- **Coolify / CapRover:** Deploy using Docker Compose directly onto your self-hosted server instance.

---

## Environment Variables (.env Reference)

| Variable | Default | Required in Prod | Description |
|---|---|---|---|
| `PORT` | `3000` | No | Network port the Express server listens on. |
| `NODE_ENV` | `development` | Yes | Runtime environment (`development` or `production`). |
| `JWT_SECRET` | *(Auto-generated)* | Yes | Cryptographic secret used for signing JWT access tokens. |
| `SESSION_SECRET` | *(Auto-generated)* | Yes | Secret key used for signing session IDs and cookies. |
| `CORS_ORIGIN` | `""` *(Localhost permitted)* | Yes | Comma-separated list of allowed origins (e.g. `https://animeria.yourdomain.com`). |

---

## Security Architecture

- **SSRF Guard (`ssrfGuard.js`):** Blocks internal network probing (`127.0.0.1`, `localhost`, RFC1918 private subnets, and cloud metadata endpoints such as AWS/GCP `169.254.169.254`).
- **Account Lockout & Brute-Force Defense:** Automatically locks user accounts for 15 minutes after 5 consecutive failed login attempts.
- **Cryptographic Password Hashing:** Uses Node.js native `crypto.scryptSync` (64-byte key + 32-byte dynamic salt) and constant-time string verification (`crypto.timingSafeEqual`).
- **Two-Factor Authentication (2FA):** RFC6238 TOTP implementation via Speakeasy, complete with QR code setup and emergency backup recovery codes.
- **Strict Input Validation & Sanitization:** Zod schema validation across all write endpoints with XSS and prototype pollution filtering via `sanitize-html`.
- **Multi-Tier Rate Limiting:** Distinct rate limit thresholds for General API, Authentication, User Comments, and Streaming Proxy endpoints.
- **HTTP Security Headers:** Helmet-configured Content Security Policy (CSP), HSTS, X-Frame-Options (Clickjacking defense), and X-Content-Type-Options: nosniff.

---

## License and DMCA Notice

- **License:** Distributed under the MIT License. See [LICENSE](LICENSE) for details.
- **DMCA & Copyright Disclaimer:** Animeria does not host, store, or upload media files on its servers. All video streams and metadata are aggregated from publicly available third-party sources. For copyright inquiries and takedown notices, consult `/dmca.html`.
