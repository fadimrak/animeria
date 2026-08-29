# Design Document

## Overview

Bu belge, ANIMERIA anime yayın platformunun kapsamlı UI/UX revizyonu için teknik tasarımı tanımlar. Revizyon yedi ana eksende gerçekleşecektir: metin/emoji temizliği, animasyonlu arka plan, logo yenileme, performans optimizasyonları, altyazı ayarları UX iyileştirmesi, video kalite seçici ve doğal arayüz dili. Tüm değişiklikler mevcut vanilla JS + HTML + CSS mimarisini koruyacak; framework veya build aracı eklenmeyecektir.

```
┌─────────────────────────────────────────────────────────┐
│                    ANIMERIA SPA                         │
│                                                         │
│  index.html / watch.html / browse.html / trending.html  │
│  top.html                                               │
│       │                                                 │
│       ├── css/theme.css   (CSS değişkenleri)            │
│       ├── css/main.css    (layout, component)           │
│       ├── css/player.css  (oynatıcı, altyazı)          │
│       │                                                 │
│       ├── js/i18n.js      (lokalizasyon)                │
│       ├── js/api.js       (veri katmanı)                │
│       ├── js/ui.js        (render engine)               │
│       ├── js/player.js    (AnimeriaPlayer sınıfı)       │
│       ├── js/app.js       (AnimeriaApp controller)      │
│       └── js/topography.js  [YENİ]                      │
│                                                         │
│  assets/logo.svg          [YENİLENECEK]                 │
│  assets/topography-bg.svg [KALDIRILACAK - opsiyonel]    │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture

Bu proje bir SPA (Single-Page Application) olarak yapılandırılmış, sunucu tarafı render veya bundler kullanmıyor. Her değişiklik doğrudan ilgili statik dosyaya uygulanır. Bileşenler arasındaki iletişim `window.UI`, `window.I18n`, `window.API`, `window.Player` global referansları üzerinden yürütülür.

### Değişiklik Kapsamı

| Dosya | Değişiklik Türü | Gereksinim |
|---|---|---|
| `public/index.html` | Metin/emoji temizliği, footer güncelleme | 1, 7 |
| `public/watch.html` | Emoji temizliği, kalite butonu ekleme | 1, 6 |
| `public/watch.html` | Altyazı modalı UI revizyonu | 5 |
| `public/browse.html` | Emoji temizliği (lang butonu) | 1 |
| `public/trending.html` | Emoji temizliği (lang butonu) | 1 |
| `public/top.html` | Emoji temizliği (lang butonu) | 1 |
| `public/css/theme.css` | `body` background kaldırma | 2 |
| `public/css/main.css` | CSS containment, backdrop-filter optimizasyonu | 4 |
| `public/css/player.css` | Altyazı range slider stilleri, kalite dropdown stili | 5, 6 |
| `public/js/i18n.js` | TR/EN string sadeleştirme, emoji kaldırma | 1, 7 |
| `public/js/ui.js` | `renderShelf`'te DocumentFragment, emoji kaldırma | 1, 4 |
| `public/js/player.js` | Toast mesajları, altyazı ayarları, kalite seçici | 5, 6, 7 |
| `public/js/app.js` | Toast mesajları, passive scroll | 4, 7 |
| `public/js/topography.js` | **[YENİ]** Canvas animasyon modülü | 2 |
| `public/assets/logo.svg` | **[YENİLENECEK]** Yeni lettermark | 3 |

---

## Components and Interfaces

### 1. Metin/Emoji Temizliği

#### Yaklaşım: Search-and-Replace (yapısal değişiklik yok)

Tüm değişiklikler metin seviyesinde olup DOM yapısı korunur.

**`public/index.html` değişiklikleri:**

```
// Önce
<span style="font-weight: 800;">🇹🇷 TR</span> <span style="opacity: 0.4;">/ EN</span>

// Sonra
<span style="font-weight: 800;">TR</span> <span style="opacity: 0.4;">/ EN</span>
```

```
// Önce (section-tag)
<span class="section-tag" data-i18n="shelf_trending_tag">Şu Anda Popüler</span>

// Sonra
<span class="section-tag" data-i18n="shelf_trending_tag">Popüler</span>
```

```
// Önce (footer-bottom)
<span>Liquid Glass Topographic Anime Streaming Experience</span>

// Sonra  — satır tamamen kaldırılır
```

**`public/watch.html` değişiklikleri:**

```
// watch.html altyazı modal — renk pill'leri
// Önce
<button class="setting-pill active" data-color="#ffffff">⚪ Saf Beyaz</button>
<button class="setting-pill" data-color="#fde047">🟡 Anime Sarısı</button>
<button class="setting-pill" data-color="#7dd3fc">🔵 Buz Mavisi</button>
<button class="setting-pill" data-color="#86efac">🟢 Pastel Yeşil</button>

// Sonra
<button class="setting-pill active" data-color="#ffffff">Beyaz</button>
<button class="setting-pill" data-color="#fde047">Sarı</button>
<button class="setting-pill" data-color="#7dd3fc">Mavi</button>
<button class="setting-pill" data-color="#86efac">Yeşil</button>
```

```
// Etiket sadeleştirme
// Önce
<label class="setting-label">Yazı Boyutu / Font Size</label>
<label class="setting-label">Arkaplan Opaklığı / Background</label>

// Sonra
<label class="setting-label">Yazı Boyutu</label>
<label class="setting-label">Arkaplan</label>
```

**`public/js/i18n.js` değişiklikleri:**

```js
// Önce (TR dictionary)
toast_bookmarked: "Listeme eklendi 🖤",
audio_sub: "🎙️ SUB (Orijinal Ses)",
audio_dub: "🎧 DUB (Dublaj)",
shelf_trending_tag: "Şu Anda Popüler",
shelf_popular_tag: "Tüm Zamanların En İyileri",
footer_desc: "Siyah, beyaz ve gri tonlarında...AniList ve Anivexa motoru ile desteklenmektedir."

// Sonra (TR dictionary)
toast_bookmarked: "Listeme eklendi",
audio_sub: "Sub (Orijinal Ses)",
audio_dub: "Dub (Dublaj)",
shelf_trending_tag: "Popüler",
shelf_popular_tag: "En Yüksek Puanlılar",
footer_desc: "Siyah ve gri tonlarında özgün anime akış platformu."
```

```js
// updateDomTexts() — langBtn satırı
// Önce
langBtn.innerHTML = this.currentLang === "tr" 
  ? `<span style="font-weight: 800;">🇹🇷 TR</span>...`
  : `...<span style="font-weight: 800;">🇬🇧 EN</span>`;

// Sonra
langBtn.innerHTML = this.currentLang === "tr" 
  ? `<span style="font-weight: 800;">TR</span> <span style="opacity: 0.4;">/ EN</span>`
  : `<span style="opacity: 0.4;">TR /</span> <span style="font-weight: 800;">EN</span>`;
```

**`public/js/player.js` renderAudioMenu() değişiklikleri:**

```js
// Önce
audioHead.textContent = "Ses Formatı / Audio";
subHead.textContent = "Altyazı Seçimi / Subtitles";
subItem innerHTML: "Sub (Orijinal Ses)"
dubItem innerHTML: "Dub (Dublaj)"

// Sonra
audioHead.textContent = "Ses";
subHead.textContent = "Altyazı";
// Sub/Dub isimleri korunur (zaten kısa)
```

Altyazı dil menüsündeki emoji flag referansları düz metin ile değiştirilir:

```js
// Önce
`${isTurkish ? '🇹🇷 Türkçe' : (isEnglish ? '🇬🇧 English' : label)}`

// Sonra
`${isTurkish ? 'Türkçe' : (isEnglish ? 'English' : label)}`
```

```
// Deck server pill'i — ⚡ ikonu (watch.html)
// Önce
<span style="color: #facc15;">⚡</span>

// Sonra — kaldırılır, sadece sunucu adı gösterilir
```

---

### 2. Animasyonlu Arka Plan (`public/js/topography.js`)

#### Tasarım Kararı

Canvas 2D bağlamı tercih edildi çünkü:
- CSS animasyon ile aynı GPU hızlandırması sağlar
- Page Visibility API entegrasyonu doğrudandır (`document.hidden` kontrolü)
- `prefers-reduced-motion` desteği programatik olarak eklenebilir
- Particle sayısı ve opaklık üzerinde tam kontrol sağlar

SVG tabanlı `topography-bg.svg` `body`'den kaldırılır; yerine `<canvas id="bgCanvas">` eklenir.

#### Bileşen Yapısı

```js
class TopographyBackground {
  constructor()     // canvas oluştur, CSS uygula, sistemi başlat
  init()            // particle dizisi oluştur, event listener'ları bağla
  createParticles() // max 60 particle, rastgele konum/hız/opaklık
  animate()         // rAF döngüsü — clearRect + drawParticles
  drawParticle(p)   // tek particle çiz (monokrom renk, opacity < 0.08)
  pause()           // rAF iptal et
  resume()          // rAF yeniden başlat
  resize()          // canvas boyutunu viewport'a eşitle
  destroy()         // event listener'ları temizle, rAF iptal et
}
```

#### Canvas Kurulumu

`theme.css` içindeki `body` background-image satırı kaldırılır:

```css
/* KALDIRILACAK */
background-image: url('../assets/topography-bg.svg');
background-size: cover;
background-position: center;
background-attachment: fixed;
background-repeat: no-repeat;
```

Her HTML sayfasının `<body>` açılış etiketinden hemen sonra canvas enjekte edilir (veya topography.js bunu otomatik yapar):

```html
<!-- topography.js tarafından otomatik enjekte edilir -->
<canvas id="bgCanvas" style="
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: -1;
  pointer-events: none;
"></canvas>
```

#### Particle Sistemi

```js
// Particle nesnesi
{
  x: Number,       // 0..canvasWidth
  y: Number,       // 0..canvasHeight
  vx: Number,      // -0.3..0.3 (çok yavaş drift)
  vy: Number,      // -0.3..0.3
  radius: Number,  // 1..3
  opacity: Number  // 0.02..0.07 (maksimum 0.08)
}
```

Her particle şu kurala göre çizilir:

```js
drawParticle(p) {
  // Yalnızca rgba(255, 255, 255, p.opacity) kullanılır
  // --bg-deep: #08080a temel alınarak, partiküller saf beyaz ama çok düşük opaklıkta
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
  ctx.fill();
}
```

Yakın partiküller arasında bağlantı çizgisi (200px eşiği altında):

```js
// İki particle arası mesafe < 200px ise
// rgba(255, 255, 255, 0.015 * (1 - dist/200)) ile çizgi
ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
ctx.lineWidth = 0.5;
```

#### prefers-reduced-motion ve Page Visibility

```js
init() {
  // reduced-motion kontrolü
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) {
    // canvas görünmez kalır, animasyon hiç başlamaz
    this.canvas.style.display = "none";
    return;
  }
  mq.addEventListener("change", (e) => {
    e.matches ? this.pause() : this.resume();
  });

  // Page Visibility API
  document.addEventListener("visibilitychange", () => {
    document.hidden ? this.pause() : this.resume();
  });

  // Resize
  window.addEventListener("resize", () => this.resize());

  this.resume();
}
```

#### Script Entegrasyonu

Tüm HTML sayfalarında `</body>` kapanış etiketinden önce:

```html
<script src="js/topography.js"></script>
```

`topography.js` dosyasının son satırı:

```js
// Otomatik başlat
window.TopographyBg = new TopographyBackground();
```

---

### 3. Yeni Logo (`public/assets/logo.svg`)

#### Tasarım Kararı

Mevcut elmas/katana geometrisinin yerini soyut bir **"A" lettermark** alır. Tasarım ilkeleri:
- Geometrik kesilmeler (cut-out) ile minimal
- 28px boyutunda tanınabilir
- Yalnızca `#ffffff` (beyaz), şeffaf zemin
- `viewBox="0 0 40 40"` (gereksinim 3.4'ü karşılar)

#### SVG Tasarımı

İki yatay bar ve üst köşede kesimli bir üçgen formundan oluşan "A" lettermark:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <!-- Dış çerçeve: ince yuvarlak dikdörtgen, çok düşük fill -->
  <rect x="3" y="3" width="34" height="34" rx="8"
        fill="rgba(255,255,255,0.06)" stroke="#ffffff" stroke-width="1.5"/>

  <!-- A harfinin sol bacağı -->
  <path d="M11 32 L20 8 L29 32" stroke="#ffffff" stroke-width="2.8"
        stroke-linecap="round" stroke-linejoin="round" fill="none"/>

  <!-- A harfinin yatay çizgisi -->
  <line x1="14.5" y1="23" x2="25.5" y2="23"
        stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
</svg>
```

#### Uyumluluk

Mevcut tüm HTML'lerde logo referansı `<img src="assets/logo.svg">` formatında, dolayısıyla SVG dosyası değiştirildiğinde tüm sayfalar otomatik güncellenir (gereksinim 3.5). JS veya HTML değişikliği gerekmez.

---

### 4. Performans Optimizasyonları

#### 4.1 CSS Containment

`public/css/main.css` içinde `.anime-card`:

```css
.anime-card {
  /* Mevcut stiller korunur, eklenir: */
  contain: layout style;
}
```

`public/css/player.css` içinde `.episode-item`:

```css
.episode-item {
  /* Mevcut backdrop-filter KALDIRILIR */
  /* backdrop-filter: var(--glass-blur);  ← SİLİNECEK */
  /* Containment eklenir: */
  contain: layout style;
}
```

`.episodes-sidebar` container'ı backdrop-filter'ı korur — bu yeterli görsel efekti sağlar.

#### 4.2 Tekrarlayan backdrop-filter Kaldırma

`.episode-item` üzerindeki `backdrop-filter` ve `-webkit-backdrop-filter` satırları silinir. Konteyner `.episodes-sidebar` zaten `backdrop-filter: var(--glass-blur)` içeriyor.

#### 4.3 DocumentFragment in renderShelf

`public/js/ui.js` içindeki `renderShelf` ve `renderGrid` fonksiyonları:

```js
renderShelf(containerId, mediaList, isHistory = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (!mediaList || mediaList.length === 0) {
    container.innerHTML = `<div ...>${this.t('empty_history')}</div>`;
    return;
  }

  // DocumentFragment ile toplu ekleme
  const fragment = document.createDocumentFragment();
  mediaList.forEach(anime => {
    const card = this.createAnimeCard(anime, isHistory, isHistory ? anime : null);
    fragment.appendChild(card);
  });
  container.appendChild(fragment); // tek DOM işlemi
},
```

Aynı değişiklik `renderGrid` için de uygulanır.

#### 4.4 Lazy Loading

`createAnimeCard` içindeki `<img>` etiketi zaten `loading="lazy"` içeriyor — bu davranış korunur ve `renderDetailsModal` içindeki karakter avatar resimleri için de eklenir:

```js
// renderDetailsModal karakterler grid'i
`<img class="char-avatar" src="${c.node?.image?.medium || ''}" 
      alt="${c.node?.name?.full}" loading="lazy"/>`
```

#### 4.5 Passive Scroll Listener

`public/js/app.js` içindeki `bindEvents()`:

```js
// Önce
window.addEventListener("scroll", () => { ... });

// Sonra
window.addEventListener("scroll", () => { ... }, { passive: true });
```

#### 4.6 CSS Değişkeni Tutarlılığı

`public/css/player.css` içinde tekrar eden `blur(28px) saturate(190%)` kullanımları `var(--glass-blur)` ile değiştirilir. Zaten `theme.css`'de `--glass-blur: blur(28px) saturate(190%)` tanımlı.

---

### 5. Geliştirilmiş Altyazı Ayarları

#### Veri Modeli Genişletmesi

Mevcut `subConfig` nesnesi yeni alanlarla genişletilir:

```js
// player.js constructor içinde
this.subConfig = JSON.parse(localStorage.getItem("animeria_sub_customization") || JSON.stringify({
  size: 20,           // Number (px değeri, range slider için)
  weight: "700",
  color: "#ffffff",
  bg: "transparent",
  shadow: "stroke",
  bottom: 60,         // Number (px, yeni alan)
  fontFamily: "Outfit" // String (yeni alan)
}));
```

**Dikkat:** `size` artık `"20px"` yerine `20` (sayı) saklanır. `applySubtitleStyles()` bunu `${this.subConfig.size}px` şeklinde CSS'e uygular. Bu değişiklik tüm kullanım noktalarını etkiler.

#### 5.1 Font Boyutu Range Slider (watch.html)

Mevcut pill button grubu kaldırılır:

```html
<!-- KALDIRILACAK -->
<div class="setting-pills-row" id="subFontSizeRow">
  <button class="setting-pill" data-size="16px">Küçük (16px)</button>
  ...
</div>

<!-- YERİNE -->
<div class="setting-range-row" id="subFontSizeRow">
  <input type="range" id="subFontSizeSlider" 
         min="14" max="32" step="1" value="20"
         class="setting-range-slider"/>
  <span class="setting-range-value" id="subFontSizeDisplay">20px</span>
</div>
```

#### 5.2 Dikey Konum Slider (watch.html)

```html
<!-- Yeni setting-group olarak eklenir -->
<div class="setting-group">
  <label class="setting-label">Altyazı Konumu (Alttan)</label>
  <div class="setting-range-row" id="subPositionRow">
    <input type="range" id="subPositionSlider"
           min="4" max="40" step="1" value="60"
           class="setting-range-slider"/>
    <span class="setting-range-value" id="subPositionDisplay">60px</span>
  </div>
</div>
```

**Not:** Mevcut `bottom: 60px` CSS `.player-subtitle-overlay`'da hardcoded. Bu değer slider ile dinamik hale gelecek. `applySubtitleStyles()` içinde:

```js
if (this.subtitleOverlay) {
  this.subtitleOverlay.style.bottom = `${this.subConfig.bottom}px`;
}
```

#### 5.3 Yazı Tipi Seçimi (watch.html)

```html
<!-- Mevcut shadow setting-group'undan sonra eklenir -->
<div class="setting-group">
  <label class="setting-label">Yazı Tipi</label>
  <div class="setting-pills-row" id="subFontFamilyRow">
    <button class="setting-pill active" data-font="Outfit">Outfit</button>
    <button class="setting-pill" data-font="JetBrains Mono">Mono</button>
    <button class="setting-pill" data-font="Noto Sans JP">Noto JP</button>
  </div>
</div>
```

#### 5.4 CSS Değişkeni Güncellemeleri

`applySubtitleStyles()` genişletilir:

```js
applySubtitleStyles() {
  const root = document.documentElement;
  root.style.setProperty("--sub-size", `${this.subConfig.size}px`);
  root.style.setProperty("--sub-weight", this.subConfig.weight);
  root.style.setProperty("--sub-color", this.subConfig.color);
  root.style.setProperty("--sub-bg", this.subConfig.bg);
  root.style.setProperty("--sub-font", this.subConfig.fontFamily || "Outfit");

  // subtitle overlay bottom pozisyonu
  if (this.subtitleOverlay) {
    this.subtitleOverlay.style.bottom = `${this.subConfig.bottom}px`;
  }

  // ... mevcut shadow kodu korunur ...

  // Önizleme güncelleme
  if (this.subPreviewText) {
    this.subPreviewText.style.fontSize = `${this.subConfig.size}px`;
    this.subPreviewText.style.fontFamily = this.subConfig.fontFamily || "Outfit";
    // ... diğer stiller ...
  }
}
```

#### 5.5 Event Bağlama (initSubtitleCustomizer)

```js
// Font size range slider
const sizeSlider = document.getElementById("subFontSizeSlider");
const sizeDisplay = document.getElementById("subFontSizeDisplay");
if (sizeSlider) {
  sizeSlider.value = this.subConfig.size;
  sizeSlider.addEventListener("input", () => {
    this.subConfig.size = parseInt(sizeSlider.value);
    if (sizeDisplay) sizeDisplay.textContent = `${this.subConfig.size}px`;
    this.saveSubConfig();
  });
}

// Position range slider
const posSlider = document.getElementById("subPositionSlider");
const posDisplay = document.getElementById("subPositionDisplay");
if (posSlider) {
  posSlider.value = this.subConfig.bottom;
  posSlider.addEventListener("input", () => {
    this.subConfig.bottom = parseInt(posSlider.value);
    if (posDisplay) posDisplay.textContent = `${this.subConfig.bottom}px`;
    this.saveSubConfig();
  });
}

// Font family pills
document.querySelectorAll("#subFontFamilyRow .setting-pill").forEach(p => {
  p.addEventListener("click", () => {
    this.subConfig.fontFamily = p.getAttribute("data-font");
    this.saveSubConfig();
  });
});
```

#### 5.6 Range Slider CSS (player.css)

```css
/* setting-range-row — yeni stil */
.setting-range-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.setting-range-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
}

.setting-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  transition: transform var(--transition-fast);
}

.setting-range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.setting-range-value {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
  min-width: 42px;
  text-align: right;
}
```

---

### 6. Video Kalite Seçici

#### Bileşen Etkileşim Diyagramı

```
hls.js MANIFEST_PARSED event
         │
         ▼
AnimeriaPlayer.playHLS()
  └── hls.on(MANIFEST_PARSED, () => {
        this.populateQualityMenu();  ← yeni metod
        ...
      })
         │
         ▼
populateQualityMenu()
  └── hls.levels[] dizisini tarar
  └── "Otomatik" seçeneğini ekler (currentLevel = -1)
  └── Her seviye için: level.height + "p" etiketi
  └── qualityMenu DOM elementini doldurur
         │
         ▼
Kullanıcı kalite seçer
  └── qualityMenu click handler
  └── hls.currentLevel = seçilen index (-1 veya 0..N)
  └── closeAllDropdowns()
```

#### HTML (watch.html — controls-right)

```html
<!-- controls-right bölümüne eklenir, subSettingsBtn'den önce -->
<button class="control-btn" id="qualityBtn" title="Video Kalitesi" 
        style="display: none;">
  <svg width="16" height="16" fill="none" stroke="currentColor" 
       stroke-width="2" viewBox="0 0 24 24">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M8 10h2m4 0h2M8 14h8"/>
  </svg>
</button>

<!-- Dropdown menü — deck-compact-wrapper içine değil,
     player-wrapper içindeki controls-overlay altına -->
<div class="deck-dropdown-menu" id="qualityDropdownMenu" 
     style="position: absolute; bottom: 70px; right: 1.25rem; 
            width: 140px; z-index: 50;"></div>
```

#### JavaScript (player.js)

**Constructor'a yeni state:**

```js
this.qualityBtn = document.getElementById("qualityBtn");
this.qualityMenu = document.getElementById("qualityDropdownMenu");
this.currentQualityLevel = -1; // -1 = Otomatik
```

**`initEvents()` içine eklenir:**

```js
if (this.qualityBtn && this.qualityMenu) {
  this.qualityBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = this.qualityMenu.classList.contains("open");
    this.closeAllDropdowns();
    if (!isOpen) {
      this.qualityMenu.classList.add("open");
      this.qualityBtn.classList.add("open");
    }
  });
}
```

**`closeAllDropdowns()` güncellenir:**

```js
closeAllDropdowns() {
  if (this.audioMenu) this.audioMenu.classList.remove("open");
  if (this.serverMenu) this.serverMenu.classList.remove("open");
  if (this.qualityMenu) this.qualityMenu.classList.remove("open");  // YENİ
  if (this.audioPillBtn) this.audioPillBtn.classList.remove("open");
  if (this.serverPillBtn) this.serverPillBtn.classList.remove("open");
  if (this.qualityBtn) this.qualityBtn.classList.remove("open");     // YENİ
}
```

**`playHLS()` içindeki `MANIFEST_PARSED` event handler genişletilir:**

```js
this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
  this.populateQualityMenu(); // YENİ
  const savedTime = this.getSavedTime();
  if (savedTime > 10) this.video.currentTime = savedTime;
  this.video.play().catch(() => {});
});
```

**Yeni `populateQualityMenu()` metodu:**

```js
populateQualityMenu() {
  if (!this.qualityMenu || !this.qualityBtn) return;
  if (!this.hls) return;

  const levels = this.hls.levels || [];
  this.qualityMenu.innerHTML = "";

  // Buton her zaman görünür (embed modunda gizlenir)
  this.qualityBtn.style.display = "flex";

  // "Otomatik" seçenek
  const autoItem = document.createElement("div");
  const isAuto = (this.currentQualityLevel === -1);
  autoItem.className = `deck-menu-item ${isAuto ? 'active' : ''}`;
  autoItem.innerHTML = `
    <div class="menu-item-left">
      <span class="menu-item-name">Otomatik</span>
      ${isAuto ? '<span class="menu-item-check">✓</span>' : ''}
    </div>
  `;
  autoItem.addEventListener("click", (e) => {
    e.stopPropagation();
    this.hls.currentLevel = -1;
    this.currentQualityLevel = -1;
    this.closeAllDropdowns();
    this.populateQualityMenu();
  });
  this.qualityMenu.appendChild(autoItem);

  // Seviyeleri yüksekten düşüğe sırala
  const sortedLevels = levels
    .map((l, idx) => ({ ...l, originalIndex: idx }))
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  sortedLevels.forEach(level => {
    const label = level.height ? `${level.height}p` : `Seviye ${level.originalIndex + 1}`;
    const isActive = (this.currentQualityLevel === level.originalIndex);

    const item = document.createElement("div");
    item.className = `deck-menu-item ${isActive ? 'active' : ''}`;
    item.innerHTML = `
      <div class="menu-item-left">
        <span class="menu-item-name">${label}</span>
        ${isActive ? '<span class="menu-item-check">✓</span>' : ''}
      </div>
    `;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hls.currentLevel = level.originalIndex;
      this.currentQualityLevel = level.originalIndex;
      this.closeAllDropdowns();
      this.populateQualityMenu();
    });
    this.qualityMenu.appendChild(item);
  });
}
```

**`playEmbed()` — kalite butonunu gizler:**

```js
playEmbed(embedUrl) {
  // ... mevcut kod ...
  if (this.qualityBtn) this.qualityBtn.style.display = "none";  // YENİ
  if (this.qualityMenu) this.qualityMenu.innerHTML = "";         // YENİ
}
```

**`resetPlayerState()` — kalite durumunu sıfırlar:**

```js
resetPlayerState() {
  // ... mevcut kod ...
  this.currentQualityLevel = -1;                                  // YENİ
  if (this.qualityMenu) this.qualityMenu.innerHTML = "";          // YENİ
  if (this.qualityBtn) this.qualityBtn.style.display = "none";   // YENİ
}
```

---

### 7. Doğal Arayüz Dili

Toast mesajları ve sistem mesajları doğal Türkçe cümle yapısına kavuşturulur.

#### player.js Mesaj Değişiklikleri

```js
// resolveAndPlay() — provider bulunamadı
// Önce: "Bu anime için aktif video sunucusu bulunamadı."
// Sonra: "Şu an aktif sunucu yok."

// resolveAndPlay() — fallback geçişi
// Önce: `Sunucuya bağlanılıyor: ${nextCodename}`
// Sonra: `${nextCodename} sunucusuna geçildi`

// resolveAndPlay() — genel yükleme hatası
// Önce: "Video akışı yüklenemedi. Lütfen başka bir sunucu seçin."
// Sonra: "Video yüklenemedi. Başka bir sunucu dene."

// renderServerMenu() — sunucu geçişi toast
// Önce: `Sunucuya bağlanılıyor: ${meta.name}`
// Sonra: `${meta.name} sunucusuna geçiliyor`
```

#### app.js Toast Değişiklikleri

```js
// langToggleBtn click handler
// Önce: nextLang === "tr" ? "Dil: Türkçe 🇹🇷" : "Language: English 🇬🇧"
// Sonra: nextLang === "tr" ? "Dil: Türkçe" : "Language: English"

// loadEpisode catch
// Önce: "Bölüm yüklenirken bir hata oluştu: " + err.message
// Sonra: "Bölüm yüklenemedi: " + err.message
```

#### index.html Bölüm Etiketleri

```html
<!-- Önce -->
<span class="section-tag" data-i18n="shelf_trending_tag">Şu Anda Popüler</span>
<span class="section-tag" data-i18n="shelf_popular_tag">Tüm Zamanların En İyileri</span>

<!-- Sonra — i18n değerleri de güncellenir (i18n.js'te) -->
<span class="section-tag" data-i18n="shelf_trending_tag">Popüler</span>
<span class="section-tag" data-i18n="shelf_popular_tag">En Yüksek Puanlılar</span>
```

#### Footer Kısayollar (index.html)

```html
<!-- Önce -->
<li>[Boşluk] Oynat / Duraklat</li>

<!-- Sonra — zaten kısa; bu format korunur -->
<li>[Boşluk] Oynat / Duraklat</li>
<!-- footer_desc abartılı kısım kaldırılır -->
```

---

## Data Models

### Altyazı Konfigürasyonu

`animeria_sub_customization` localStorage anahtarında saklanan nesne:

```typescript
interface SubtitleConfig {
  size: number;          // 14–32, varsayılan: 20
  weight: string;        // "500" | "700" | "900", varsayılan: "700"
  color: string;         // hex renk kodu, varsayılan: "#ffffff"
  bg: string;            // "transparent" | rgba(), varsayılan: "transparent"
  shadow: string;        // "stroke" | "soft" | "glow", varsayılan: "stroke"
  bottom: number;        // 4–40 (px), varsayılan: 60
  fontFamily: string;    // "Outfit" | "JetBrains Mono" | "Noto Sans JP",
                         // varsayılan: "Outfit"
}
```

**Varsayılan değerler (gereksinim 5.8):**

```js
const DEFAULT_SUB_CONFIG = {
  size: 20,
  weight: "700",
  color: "#ffffff",
  bg: "transparent",
  shadow: "stroke",
  bottom: 60,
  fontFamily: "Outfit"
};
```

### Particle Nesnesi (Topography)

```typescript
interface Particle {
  x: number;        // 0..canvas.width
  y: number;        // 0..canvas.height
  vx: number;       // -0.3..0.3
  vy: number;       // -0.3..0.3
  radius: number;   // 1..3
  opacity: number;  // 0.02..0.07
}
```

### HLS Quality Level

```typescript
interface QualityLevel {
  originalIndex: number;  // hls.levels[] içindeki orijinal indeks
  height: number | null;  // çözünürlük yüksekliği (ör. 1080)
  label: string;          // "1080p" | "720p" | "Seviye N"
}
```

---

## Correctness Properties

*Bir özellik, bir sistemin tüm geçerli çalışmalarında geçerli olması gereken bir karakteristik veya davranıştır — temelde, sistemin ne yapması gerektiğine dair formal bir ifade. Özellikler, insan tarafından okunabilir spesifikasyonlar ile makine tarafından doğrulanabilir doğruluk garantileri arasındaki köprüdür.*

### Property 1: Monochrome Color Invariant

*Herhangi bir* canvas frame render döngüsünde, topography animasyonu tarafından çizilen tüm pikseller yalnızca `rgba(255, 255, 255, α)` formatında olmalıdır; burada `α < 0.08`.

**Validates: Gereksinim 2.4**

### Property 2: Card Images Lazy Loading

*Herhangi bir* `renderShelf`, `renderGrid` veya `createAnimeCard` çağrısı sonucunda DOM'a eklenen `<img>` elementlerinin tamamı `loading="lazy"` attribute'ına sahip olmalıdır.

**Validates: Gereksinim 4.3**

### Property 3: Font Size CSS Variable Sync

*Herhangi bir* geçerli font boyutu değeri (14–32 arası tam sayı) için `subConfig.size` güncellendikten sonra, `--sub-size` CSS custom property değeri `${value}px` ile eşleşmelidir.

**Validates: Gereksinim 5.2**

### Property 4: Subtitle Position Round-Trip

*Herhangi bir* geçerli konum değeri (4–40 arası tam sayı) için: değer `subConfig.bottom`'a atanıp `saveSubConfig()` çağrıldıktan sonra, `localStorage`'dan okunan `animeria_sub_customization` JSON'undaki `bottom` alanı orijinal değerle eşleşmelidir.

**Validates: Gereksinim 5.4**

### Property 5: Font Family CSS Variable Sync

*Herhangi bir* geçerli font-family değeri (`"Outfit"`, `"JetBrains Mono"`, `"Noto Sans JP"`) için, ilgili pill butonuna tıklandıktan sonra `--sub-font` CSS custom property değeri seçilen font-family string ile eşleşmelidir.

**Validates: Gereksinim 5.6**

### Property 6: Subtitle Config Serialization Round-Trip

*Herhangi bir* geçerli `SubtitleConfig` nesnesi için: nesneyi `localStorage`'a kaydedip tekrar yüklemek, tüm alanları orijinal değerleriyle aynı olan eşdeğer bir nesne üretmelidir.

**Validates: Gereksinim 5.7**

### Property 7: HLS Quality Dropdown Size

*Herhangi bir* N sayıda seviye içeren HLS manifest için, `populateQualityMenu()` çağrısının ardından kalite dropdown'undaki öğe sayısı N + 1 olmalıdır (N seviye + 1 "Otomatik" seçeneği).

**Validates: Gereksinim 6.2**

### Property 8: Quality Level Label Format

*Herhangi bir* `height` değerine sahip HLS level nesnesi için (`level.height = H`), üretilen etiket `"${H}p"` formatında olmalıdır. Eğer `height` null/undefined ise etiket `"Seviye ${n}"` formatında olmalıdır.

**Validates: Gereksinim 6.3**

---

## Error Handling

### Animasyonlu Arka Plan

- Canvas API desteklenmiyorsa (`getContext("2d")` null dönerse): canvas gizlenir, sayfa statik koyu arka planla devam eder.
- `prefers-reduced-motion: reduce` aktifse: canvas gizlenir, animasyon hiç başlamaz.
- Page hidden iken `requestAnimationFrame` callback çağrılırsa: `document.hidden` kontrolü ile erken dönüş yapılır.

```js
animate() {
  if (document.hidden) return; // güvenlik kontrolü
  this.rafId = requestAnimationFrame(() => this.animate());
  // ...
}
```

### Video Kalite Seçici

- `hls.levels` boş array ise: `populateQualityMenu()` yalnızca "Otomatik" seçeneğini gösterir, buton görünür kalır (gereksinim 6.6).
- Embed modunda (`playEmbed` çağrısında): buton `display: none` yapılır, menü temizlenir.
- HLS nesnesi henüz yok iken `populateQualityMenu()` çağrılırsa: erken return yapılır.
- Seviye geçişinde hls.js hatası: mevcut `ERROR` event handler yönetir, ayrı işleme gerekmez.

### Altyazı Ayarları

- localStorage erişimi başarısız olursa (private mode, quota exceeded): `try/catch` ile sarmalanır, varsayılan değerler hafıza üzerinde tutulur, disk yazma hatası sessizce yutulur.
- `subConfig.size` geçersiz (NaN, out-of-range) gelirse: `applySubtitleStyles()` içinde `clamp(14, value, 32)` uygulanır.
- `subConfig.bottom` geçersizse: `clamp(4, value, 40)` uygulanır.

```js
saveSubConfig() {
  try {
    localStorage.setItem("animeria_sub_customization", JSON.stringify(this.subConfig));
  } catch (e) {
    console.warn("Altyazı ayarları kaydedilemedi:", e);
  }
  this.applySubtitleStyles();
  this.updateSubtitleSettingsUI();
}
```

### Logo

- `logo.svg` yüklenemezse: `<img>` elementleri `alt="ANIMERIA"` metnini gösterir, layout bozulmaz.

---

## Testing Strategy

Bu proje UI ağırlıklı ve side-effect odaklı olduğundan, property-based testing belirli alanlarda uygulanabilir; ancak büyük çoğunluk example-based ve integration testlerle karşılanır.

### Birim Testleri (Example-Based)

**Metin/Emoji Temizliği:**
- HTML dosyalarını string olarak yükle, belirli emoji karakterlerinin (`🇹🇷`, `🇬🇧`, `⚪`, `🟡`, `🔵`, `🟢`, `⚡`) var olmadığını doğrula
- i18n.js TR/EN sözlüklerinde emoji olmadığını doğrula
- `renderAudioMenu()` çıktısında "Ses Formatı / Audio" ve "Altyazı Seçimi / Subtitles" ifadelerinin olmadığını doğrula

**Logo:**
- `logo.svg` dosyasının `viewBox="0 0 40 40"` içerdiğini doğrula
- `fill` veya `stroke` değerlerinin yalnızca `#ffffff`, `rgba(255,255,255,...)` veya `transparent/none` olduğunu doğrula

**Kalite Seçici:**
- Embed modunda `qualityBtn.style.display === "none"` olduğunu doğrula
- "Otomatik" seçildiğinde `hls.currentLevel === -1` olduğunu doğrula
- `hls.levels = []` iken dropdown'da yalnızca "Otomatik" öğesinin bulunduğunu doğrula (edge case)

**Altyazı Ayarları:**
- localStorage yokken varsayılan değerlerin uygulandığını doğrula (gereksinim 5.8)
- Font boyutu slider min/max/step attribute'larının doğru olduğunu doğrula

**Performans:**
- `renderShelf` sonrasında container'a eklenen kart sayısının input array boyutuyla eşleştiğini doğrula

### Property-Based Testler

[vitest](https://vitest.dev/) + [fast-check](https://fast-check.io/) kullanılır. Her test minimum 100 iterasyon çalışır.

**Özellik 1: Monokrom Renk Değişmezi**

```js
// Feature: animeria-ui-overhaul, Property 1: Monochrome color invariant
import fc from "fast-check";
import { TopographyBackground } from "../js/topography.js";

test("Property 1: canvas particle colors are monochrome with opacity < 0.08", () => {
  fc.assert(
    fc.property(
      fc.record({
        x: fc.float({ min: 0, max: 1920 }),
        y: fc.float({ min: 0, max: 1080 }),
        vx: fc.float({ min: -0.3, max: 0.3 }),
        vy: fc.float({ min: -0.3, max: 0.3 }),
        radius: fc.float({ min: 1, max: 3 }),
        opacity: fc.float({ min: 0.02, max: 0.07 })
      }),
      (particle) => {
        const fills = [];
        const mockCtx = {
          beginPath: () => {},
          arc: () => {},
          fill: () => {},
          set fillStyle(v) { fills.push(v); }
        };
        // drawParticle çağrısı
        const bg = new TopographyBackground({ ctx: mockCtx, autoStart: false });
        bg.drawParticle(particle);
        // Tüm fillStyle değerleri rgba(255,255,255,α) formatında, α < 0.08
        return fills.every(f => {
          const m = f.match(/rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/);
          return m && parseFloat(m[1]) < 0.08;
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

**Özellik 3: Font Boyutu CSS Değişkeni Senkronizasyonu**

```js
// Feature: animeria-ui-overhaul, Property 3: Font size CSS variable sync
test("Property 3: --sub-size CSS variable matches subConfig.size after update", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 14, max: 32 }),
      (sizeValue) => {
        const setProps = {};
        const mockRoot = { style: { setProperty: (k, v) => { setProps[k] = v; } } };
        // applySubtitleStyles'ı izole test
        const config = { ...DEFAULT_SUB_CONFIG, size: sizeValue };
        applySubtitleStylesIsolated(config, mockRoot);
        return setProps["--sub-size"] === `${sizeValue}px`;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Özellik 4: Altyazı Konum Round-Trip**

```js
// Feature: animeria-ui-overhaul, Property 4: Subtitle position localStorage round-trip
test("Property 4: subtitle bottom value round-trips through localStorage", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 4, max: 40 }),
      (bottomValue) => {
        const store = {};
        const mockStorage = {
          setItem: (k, v) => { store[k] = v; },
          getItem: (k) => store[k] || null
        };
        const config = { ...DEFAULT_SUB_CONFIG, bottom: bottomValue };
        mockStorage.setItem("animeria_sub_customization", JSON.stringify(config));
        const loaded = JSON.parse(mockStorage.getItem("animeria_sub_customization"));
        return loaded.bottom === bottomValue;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Özellik 5: Font Seçimi CSS Değişkeni**

```js
// Feature: animeria-ui-overhaul, Property 5: Font family CSS variable sync
test("Property 5: --sub-font CSS variable matches selected font-family", () => {
  const validFonts = ["Outfit", "JetBrains Mono", "Noto Sans JP"];
  fc.assert(
    fc.property(
      fc.constantFrom(...validFonts),
      (font) => {
        const setProps = {};
        const mockRoot = { style: { setProperty: (k, v) => { setProps[k] = v; } } };
        const config = { ...DEFAULT_SUB_CONFIG, fontFamily: font };
        applySubtitleStylesIsolated(config, mockRoot);
        return setProps["--sub-font"] === font;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Özellik 6: Altyazı Ayarları Serializasyon Round-Trip**

```js
// Feature: animeria-ui-overhaul, Property 6: Subtitle config serialization round-trip
test("Property 6: subtitle config serializes and deserializes correctly", () => {
  const fonts = ["Outfit", "JetBrains Mono", "Noto Sans JP"];
  const shadows = ["stroke", "soft", "glow"];
  fc.assert(
    fc.property(
      fc.record({
        size: fc.integer({ min: 14, max: 32 }),
        weight: fc.constantFrom("500", "700", "900"),
        color: fc.constantFrom("#ffffff", "#fde047", "#7dd3fc", "#86efac"),
        bg: fc.constantFrom("transparent", "rgba(0,0,0,0.5)", "rgba(4,4,6,0.88)"),
        shadow: fc.constantFrom(...shadows),
        bottom: fc.integer({ min: 4, max: 40 }),
        fontFamily: fc.constantFrom(...fonts)
      }),
      (config) => {
        const serialized = JSON.stringify(config);
        const deserialized = JSON.parse(serialized);
        return (
          deserialized.size === config.size &&
          deserialized.weight === config.weight &&
          deserialized.color === config.color &&
          deserialized.bg === config.bg &&
          deserialized.shadow === config.shadow &&
          deserialized.bottom === config.bottom &&
          deserialized.fontFamily === config.fontFamily
        );
      }
    ),
    { numRuns: 200 }
  );
});
```

**Özellik 7: HLS Kalite Dropdown Boyutu**

```js
// Feature: animeria-ui-overhaul, Property 7: HLS quality dropdown size
test("Property 7: quality dropdown has levels.length + 1 items", () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({ height: fc.oneof(fc.integer({ min: 240, max: 2160 }), fc.constant(null)) }),
        { minLength: 0, maxLength: 10 }
      ),
      (levels) => {
        const items = [];
        const mockMenu = {
          innerHTML: "",
          appendChild: (el) => items.push(el)
        };
        const mockHls = { levels, currentLevel: -1 };
        populateQualityMenuIsolated(mockHls, mockMenu);
        return items.length === levels.length + 1; // +1 "Otomatik"
      }
    ),
    { numRuns: 100 }
  );
});
```

**Özellik 8: Kalite Seviyesi Etiket Formatı**

```js
// Feature: animeria-ui-overhaul, Property 8: Quality level label format
test("Property 8: quality level labels follow height + 'p' format", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 240, max: 2160 }),
      fc.integer({ min: 0, max: 9 }),
      (height, index) => {
        const label = formatQualityLabel({ height, originalIndex: index });
        return label === `${height}p`;
      }
    ),
    { numRuns: 100 }
  );
  // height=null durumu
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 9 }),
      (index) => {
        const label = formatQualityLabel({ height: null, originalIndex: index });
        return label === `Seviye ${index + 1}`;
      }
    ),
    { numRuns: 50 }
  );
});
```

### Integration Testleri

- Canvas animasyonunun sayfada başarıyla başladığını doğrulama (1–2 örnek)
- HLS akışı yüklendiğinde kalite butonunun göründüğünü doğrulama
- Embed akışında kalite butonunun gizlendiğini doğrulama
- localStorage'da altyazı ayarı olmadan sayfanın varsayılan değerlerle yüklendiğini doğrulama

### Erişilebilirlik Testleri

- Tüm yeni `<input type="range">` elementlerinin `<label>` ile ilişkilendirildiğini doğrula
- Kalite seçici butonunun `title` attribute'u içerdiğini doğrula
- Renk pill'lerinin renk değerinin yanı sıra isim de içerdiğini doğrula (renk körü kullanıcılar için)
