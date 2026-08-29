# ANIMERIA

Animeria; monokrom (siyah, beyaz ve gri tonları) tasarım diline sahip, çoklu anime kaynaklarını tek bir arayüzde birleştiren, AniList entegrasyonlu ve gelişmiş güvenlik katmanlarına sahip açık kaynak bir anime izleme ve profil takip platformudur.

[Proje Deposu](https://github.com/fadimrak/animeria)

---

## Icerik Tablosu

- [Proje Ozellikleri](#proje-ozellikleri)
- [Teknoloji Yigini](#teknoloji-yigini)
- [Dizin Yapisi](#dizin-yapisi)
- [Yerel Gelistirme (Localhost) Kurulumu](#yerel-gelistirme-localhost-kurulumu)
- [Canliya Alma (Production Deployment) Rehberi](#canliya-alma-production-deployment-rehberi)
  - [Neden Mevcut Surum Yalnizca Localhost Icin Uygundur?](#neden-mevcut-surum-yalnizca-localhost-icin-uygundur)
  - [Canliya Almadan Once Yapilmasi Gereken Guncellemeler](#canliya-almadan-once-yapilmasi-gereken-guncellemeler)
  - [Adim Adim Dagitim Secenekleri](#adim-adim-dagitim-secenekleri)
- [Ortam Degiskenleri (.env Referansi)](#ortam-degiskenleri-env-referansi)
- [Guvenlik Mimarisi](#guvenlik-mimarisi)
- [Lisans ve DMCA Bildirimi](#lisans-ve-dmca-bildirimi)

---

## Proje Ozellikleri

### 1. Gelismis Video Oynatici ve Akis
- **HLS (.m3u8) Akis Destegi:** Hls.js tabanli, adaptif ve yuksek performansli video oynatimi.
- **Coklu Saglayici (Multi-Provider):** MKissa, Reanime, AniZone, AniKoto, AnimeGG, AniNeko, AniDB, 2dhive, Kickassanime, AnimeDunya gibi farkli kaynaklar arasinda dinamik gecis.
- **Alt Yazi ve Dublaj:** Sub ve Dub secenekleri arasinda tek tikla gecis.
- **AniSkip Entegrasyonu:** Anime acilis (OP) ve kapanis (ED) kisimlarini otomatik veya manuel atlama.
- **Oynatici Kontrolleri:** Oynatma hizi (0.25x - 2x), video cozunurluk secimi (1080p, 720p, 480p, 360p), PIP (Picture-in-Picture), tam ekran ve klavye kisayollari.
- **Dahili HLS ve Segment Proxy:** Kaynak sunucularin CORS, hotlinking veya referer kisitlamalarini sunucu tarafinda asan entegre proxy mekanizmasi.

### 2. Kesfet ve Anime Katalogu
- **AniList GraphQL Entegrasyonu:** Trendler, populer animeler, en yuksek puanlilar ve guncel sezon takvimi.
- **Detayli Filtreleme:** Tur, yayin yili, sezon, format (TV, Movie, OVA, ONA, Special) ve puanlama filtreleri.
- **Dinamik Arama:** Baslik ve karakter bazli anlik sonuclar.

### 3. Kullanici Yonetimi ve Istatistikler
- **Izleme Listeleri (Watchlist):** Izleniyor, Tamamlandi, Planlandi, Duraklatildi ve Birakildi kategorileri.
- **Kapsamli Profil Istatistikleri:** Toplam izlenen saat, gun, bolum sayisi, ortalama puan ve tur dagilim grafigi.
- **Harici Liste Ice Aktarma:** AniList veya MyAnimeList (MAL) hesaplarindan tek tikla liste senkronizasyonu.
- **Bolum Yorumlari:** Bolum bazli yorum yapma, spoiler isaretleme ve begeni mekanizmasi.

---

## Teknoloji Yigini

| Bilesen | Kullanilan Teknolojiler |
|---|---|
| **Backend** | Node.js (ES Modules), Express.js, Anivexa Core API Engine |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, Vanilla CSS3 (Custom Design System), Canvas Topography FX |
| **API ve Veri** | AniList GraphQL API, AniSkip API, Google Translate API |
| **Guvenlik** | Helmet, Zod Dogrulama, Speakeasy (TOTP 2FA), JWT ve HttpOnly Cerezler, sanitize-html, SSRF Guard, Scrypt Password Hashing |
| **Veritabani** | JSON Flat-File DB (data/*.json) - Gelistirme ortami icin |
| **Konteyner** | Docker (node:20-slim + curl) |

---

## Dizin Yapisi

```text
animeria/
|-- Anivexa-API-main/        # Anime saglayicilari ve scraper motoru
|-- backend/
|   |-- db.js                # Veritabani islemleri (Kullanicilar, oturumlar, listeler, yorumlar)
|   `-- security/            # Guvenlik modulleri
|       |-- auditLogger.js   # Denetim ve erisim loglama
|       |-- env.js           # Ortam degiskeni dogrulama
|       |-- fileUpload.js    # Gorsel yukleme ve buffer kontrolleri
|       |-- headers.js       # Helmet, CSP, HSTS ve guvenlik basliklari
|       |-- jwt.js           # JWT token uretimi ve rotasyonu
|       |-- rateLimiter.js   # Hiz sinirlandirma (Rate limiting)
|       |-- rbac.js          # Rol tabanli yetkilendirme (USER / ADMIN)
|       |-- sanitizer.js     # XSS ve NoSQL/Prototype Pollution temizleyici
|       |-- ssrfGuard.js     # SSRF (Localhost ve Cloud Metadata) korumasi
|       |-- twoFactor.js     # 2FA (TOTP QR ve Kurtarma Kodlari)
|       `-- validator.js     # Zod giris semalari
|-- data/                    # JSON veri dosyalari (users, sessions, watchlists, comments)
|-- public/                  # Frontend statik dosyalari
|   |-- css/                 # Monokrom stil dosyalari
|   |-- js/                  # Istemci scriptleri (api.js, player.js, auth.js, ui.js vb.)
|   |-- browse.html          # Arama ve filtreleme sayfasi
|   |-- dmca.html            # DMCA ve Telif hakki sayfasi
|   |-- index.html           # Ana sayfa
|   |-- profile.html         # Profil, istatistikler ve 2FA ayarlari
|   |-- top.html             # En yuksek puanlilar sayfasi
|   |-- trending.html        # Trend animeler sayfasi
|   `-- watch.html           # Video oynatici sayfasi
|-- .env.example             # Ornek ortam degiskenleri sablonu
|-- Dockerfile               # Konteyner build yapilandirmasi
|-- package.json             # Bagimliliklar ve npm betikleri
`-- server.js                # Ana Express sunucusu ve API rotalari
```

---

## Yerel Gelistirme (Localhost) Kurulumu

Projeyi yerel gelistirme ortaminda calistirmak icin asagidaki adimlari izleyin:

### 1. Gereksinimler
- Node.js (v18 veya uzeri, Node.js v20 LTS tavsiye edilir)
- npm veya pnpm / yarn
- curl (Linux/macOS sistemlerde varsayilan bulunur, Windows 10/11 sistemlerde mevcuttur)

### 2. Depoyu Klonlayin ve Bagimliliklari Yukleyin
```bash
git clone https://github.com/fadimrak/animeria.git
cd animeria
npm install
```

### 3. Ortam Degiskenlerini Hazirlayin
`.env.example` dosyasini kopyalayarak `.env` olusturun:
```bash
cp .env.example .env
```

`.env` dosyasinin icerigini kontrol edin:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=ornek_gelistirme_jwt_anahtari_2026
SESSION_SECRET=ornek_gelistirme_session_anahtari_2026
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Sunucuyu Baslatin
```bash
# Gelistirme modunda (Dosya degisikliklerinde otomatik yeniden baslar)
npm run dev

# veya standart modda
npm start
```

Tarayicinizdan erisin: `http://localhost:3000`

---

## Canliya Alma (Production Deployment) Rehberi

> [!IMPORTANT]
> Proje varsayilan haliyle yerel ortam (localhost) uzerinde calismaktadir. Bir sunucuya deploy etmeden once asagidaki mimari gereksinimleri ve yapilmasi gereken degisiklikleri uygulayiniz.

---

### Neden Mevcut Surum Yalnizca Localhost Icin Uygundur?

1. **JSON Tabanli Flat-File Veritabani (`data/*.json`):**
   - Kullanicilar, oturumlar, izleme listeleri ve yorumlar yerel diske JSON formatinda yazilir.
   - Vercel, Netlify veya Render ucretsiz katmani gibi **serverless / ephemeral (gecici diskli)** ortamlarda, sunucu uykuya gectiginde veya her yeni deploy isleminde diske yazilan tum veriler silinir.
   - Bu nedenle uygulamanin ya **kalici disk (Persistent Volume)** bagli bir VPS/Container uzerinde calistirilmasi ya da veritabaninin MongoDB/PostgreSQL gibi harici bir veritabanina baglanmasi gerekir.

2. **Video Akis Proxy'si (Stream & Segment Proxy):**
   - `/api/proxy/stream` rotasi kaynak sitelerin CORS ve referer kisitlamalarini asmak icin video segmentlerini Node.js sunucusu uzerinden iletir.
   - Serverless fonksiyonlarda mevcut olan 10-60 saniyelik zaman asimi (timeout) ve bant genisligi sinirlari nedeniyle, uygulamanin **kesintisiz calisan bir Node.js sunucusunda (VPS, Docker, Dedicated Server)** barindirilmasi zorunludur.

3. **HTTPS ve Cerez Guvenligi:**
   - Canli modda (`NODE_ENV=production`) tarayicilarin HttpOnly ve Secure bayrakli cerezleri kabul etmesi icin alan adinizin gecerli bir SSL sertifikasina (HTTPS) sahip olmasi gerekir.

4. **Sistem Seviyesinde `curl` Bagimliligi:**
   - Bazi anime kaynaklarina erisim saglanirken TLS engellerini asmak adina sistem uzerindeki `curl` kutuphanesi kullanilir. Sunucu ortaminda `curl` kurulu olmalidir (Dockerfile icerisinde bu adim hazir bulunmaktadir).

---

### Canliya Almadan Once Yapilmasi Gereken Guncellemeler

#### 1. Uretim Ortam Degiskenlerini Tanimlayin
Canli sunucunuzda `.env` dosyasina guclu kriptografik anahtarlar ve alan adinizi ekleyin:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=kriptografik_olarak_guclu_en_az_64_karakterli_jwt_secret
SESSION_SECRET=kriptografik_olarak_guclu_en_az_64_karakterli_session_secret
CORS_ORIGIN=https://animeria.siteniz.com
```

Rastgele guclu anahtar uretmek icin su komutu calistirabilirsiniz:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### 2. Kalici Disk veya Veritabani Entegrasyonu
- **JSON Veritabani Kullanilacaksa:** Docker uzerinde `data/` dizinini kalici bir volume olarak baglayin (`-v animeria_data:/app/data`).
- **Olceklenebilir Yapi Icin:** `backend/db.js` dosyasindaki okuma/yazma fonksiyonlarini PostgreSQL (Prisma/Drizzle) veya MongoDB baglantisina yonlendirin.

#### 3. Reverse Proxy ve SSL Yapilandirmasi
- Sunucu onune Nginx, Caddy veya Cloudflare ekleyin.
- `server.js` dosyasinda `app.set("trust proxy", 1);` aktif durumdadir; ters vekil sunucunuzun `X-Forwarded-For` ve `X-Forwarded-Proto` basliklarini ilettiginden emin olun.

---

### Adim Adim Dagitim Secenekleri

#### Secenek 1: Docker ve Docker Compose ile Dagitim (Onerilen)

Proje icerisinde optimize edilmis bir [Dockerfile](Dockerfile) (`node:20-slim` + `curl`) bulunmaktadir.

1. Sunucunuzda `docker-compose.yml` dosyasi olusturun:
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
      - JWT_SECRET=uretim_icin_guclu_jwt_secret_anahtari
      - SESSION_SECRET=uretim_icin_guclu_session_secret_anahtari
      - CORS_ORIGIN=https://animeria.siteniz.com
    volumes:
      - animeria_data:/app/data

volumes:
  animeria_data:
```

2. Konteyneri derleyip calistirin:
```bash
docker compose up -d --build
```

---

#### Secenek 2: Ubuntu/Debian VPS Uzerinde PM2 ve Nginx ile Dagitim

1. **Gerekli Paketleri Kurun:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

2. **Projeyi Klonlayin:**
```bash
cd /var/www
sudo git clone https://github.com/fadimrak/animeria.git
cd animeria
sudo npm ci --omit=dev
sudo cp .env.example .env
sudo nano .env # Uretim degerlerini girin
```

3. **PM2 ile Servisi Baslatin:**
```bash
pm2 start server.js --name "animeria"
pm2 save
pm2 startup
```

4. **Nginx Yapilandirmasi (`/etc/nginx/sites-available/animeria`):**
```nginx
server {
    server_name animeria.siteniz.com;

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

5. **Nginx'i Etkinlestirin ve SSL Sertifikasi Alin:**
```bash
sudo ln -s /etc/nginx/sites-available/animeria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d animeria.siteniz.com
```

---

#### Secenek 3: PaaS Platformlari (Railway, Render, Coolify, CapRover)

- **Railway:** GitHub reposunu baglayin. Settings > Disks bolumunden `/app/data` dizinine **Persistent Volume** ekleyin. Ortam degiskenlerini panelden tanimlayin.
- **Render:** Web Service olusturun (Docker ortamini secin). Disks sekmesinden `/app/data` dizinini kalici disk olarak tanimlayin.
- **Coolify / CapRover:** Kendi VPS sunucunuzda Docker Compose dosyasini kullanarak tek tikla dagitim yapin.

---

## Ortam Degiskenleri (.env Referansi)

| Degisken Adi | Varsayilan | Zorunlu mu? | Aciklama |
|---|---|---|---|
| `PORT` | `3000` | Hayir | Sunucunun dinleyecegi port. |
| `NODE_ENV` | `development` | Evet (Canlida) | Calisma modu (`development` veya `production`). |
| `JWT_SECRET` | *(Otomatik uretilir)* | Evet (Canlida) | JWT erisim token'larini imzalamak icin kullanilan gizli anahtar. |
| `SESSION_SECRET` | *(Otomatik uretilir)* | Evet (Canlida) | Oturum ve cerez guvenligi icin kullanilan gizli anahtar. |
| `CORS_ORIGIN` | `""` *(Localhost izinli)* | Evet (Canlida) | Izin verilen domain adresleri (Virgulle ayrilmis liste). |

---

## Guvenlik Mimarisi

- **SSRF Korumasi (`ssrfGuard.js`):** Proxy isteklerinde `127.0.0.1`, `localhost`, RFC1918 ozel IP araliklari ve bulut metadata (AWS/GCP `169.254.169.254`) adreslerine erisim engellenir.
- **Brute-Force ve Hesap Kilitleme:** 5 ardisik hatali parola girisiminde kullanici hesabi 15 dakika boyunca kilitlenir.
- **Kriptografik Parola Guvenligi:** Node.js yerel `crypto.scryptSync` (64-byte key + 32-byte salt) ve zamanlama saldirilarina karsi `crypto.timingSafeEqual` kullanilir.
- **Iki Adimli Dogrulama (2FA):** Speakeasy ile RFC6238 TOTP standardi, QR Kod entegrasyonu ve yedek kurtarma kodlari.
- **Girdi Dogrulama ve Sanitizasyon:** Zod giris semalari ile veri dogrulama, XSS ve NoSQL/Prototype Pollution temizligi (`sanitize-html`).
- **Kademeli Hiz Sinirlandirma (Rate Limiting):** API, Auth, Yorum ve Proxy rotalari icin ayri ayri yapilandirilmis IP tabanli istek limitleri.
- **Guvenlik Basliklari:** Helmet ile Content Security Policy (CSP), HSTS, X-Frame-Options (Clickjacking onleme) ve X-Content-Type-Options: nosniff basliklari.

---

## Lisans ve DMCA Bildirimi

- **Lisans:** Bu proje MIT Lisansi ile lisanslanmistir. Detaylar icin [LICENSE](LICENSE) dosyasina bakabilirsiniz.
- **DMCA ve Telif Hakki:** Animeria sunucularinda hicbir video veya medya dosyasi barindirilmaz. Tum icerikler ucuncu taraf herkese acik saglayicilar uzerinden derlenmektedir. Telif hakki bildirimleri ve iletisim icin `/dmca.html` sayfasini inceleyebilirsiniz.
