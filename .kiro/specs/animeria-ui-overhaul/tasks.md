# Implementation Plan: animeria-ui-overhaul

## Overview

Bu plan, ANIMERIA anime yayın platformunun kapsamlı UI/UX revizyonunu yedi ana eksende hayata geçirir: metin/emoji temizliği, animasyonlu arka plan, logo yenileme, performans optimizasyonları, altyazı ayarları UX iyileştirmesi, video kalite seçici ve doğal arayüz dili. Tüm değişiklikler mevcut vanilla JS + HTML + CSS mimarisini koruyacak; framework veya build aracı eklenmeyecektir.

---

## Tasks

- [x] 1. HTML dosyalarında emoji ve metin temizliği
  - [x] 1.1 `public/index.html` temizliği
    - `langToggleBtn` içindeki `🇹🇷 TR` span'ını `TR` olarak güncelle (emoji kaldır)
    - `shelf_trending_tag` içeriğini `"Şu Anda Popüler"` → `"Popüler"` olarak değiştir
    - `shelf_popular_tag` içeriğini `"Tüm Zamanların En İyileri"` → `"En Yüksek Puanlılar"` olarak değiştir
    - `footer-bottom` içindeki `"Liquid Glass Topographic Anime Streaming Experience"` span'ını tamamen kaldır
    - `footer_desc` içeriğini `"Siyah ve gri tonlarında özgün anime akış platformu."` olarak kısalt
    - _Requirements: 1.1, 1.3, 1.7_

  - [x] 1.2 `public/watch.html` temizliği
    - `langToggleBtn` içindeki `🇹🇷 TR` span'ını `TR` olarak güncelle (emoji kaldır)
    - Altyazı modal etiketlerini sadeleştir: `"Yazı Boyutu / Font Size"` → `"Yazı Boyutu"`, `"Arkaplan Opaklığı / Background"` → `"Arkaplan"`, `"Yazı Kalınlığı / Thickness"` → `"Kalınlık"`, `"Yazı Rengi / Color"` → `"Renk"`, `"Metin Kenarlığı & Efekt / Stroke"` → `"Kenarlık & Efekt"`
    - Renk pill butonlarını emojisiz hale getir: `"⚪ Saf Beyaz"` → `"Beyaz"`, `"🟡 Anime Sarısı"` → `"Sarı"`, `"🔵 Buz Mavisi"` → `"Mavi"`, `"🟢 Pastel Yeşil"` → `"Yeşil"`
    - `deck-selectors-bar` içindeki sunucu pill'indeki `⚡` span'ını kaldır (`currentServerNameText` korunur)
    - Live preview label'ını `"Canlı Önizleme / Live Preview"` → `"Canlı Önizleme"` olarak kısalt
    - _Requirements: 1.1, 1.2, 1.6_

  - [x] 1.3 `public/browse.html`, `public/trending.html`, `public/top.html` temizliği
    - Her üç dosyada `langToggleBtn` içindeki `🇹🇷 TR` span'ını `TR` olarak güncelle (emoji kaldır)
    - `trending.html` içindeki `shelf_trending_tag` içeriğini `"Şu Anda Popüler"` → `"Popüler"` olarak değiştir
    - _Requirements: 1.1_

- [x] 2. `public/js/i18n.js` string temizliği
  - [x] 2.1 TR sözlüğü güncellemesi
    - `toast_bookmarked` değerini `"Listeme eklendi 🖤"` → `"Listeme eklendi"` olarak değiştir
    - `audio_sub` değerini `"🎙️ SUB (Orijinal Ses)"` → `"Sub (Orijinal Ses)"` olarak değiştir
    - `audio_dub` değerini `"🎧 DUB (Dublaj)"` → `"Dub (Dublaj)"` olarak değiştir
    - `shelf_trending_tag` değerini `"Şu Anda Popüler"` → `"Popüler"` olarak değiştir
    - `shelf_popular_tag` değerini `"Tüm Zamanların En İyileri"` → `"En Yüksek Puanlılar"` olarak değiştir
    - `footer_desc` değerini `"Siyah ve gri tonlarında özgün anime akış platformu."` olarak güncelle
    - _Requirements: 1.4, 1.5, 1.7_

  - [x] 2.2 EN sözlüğü emoji temizliği
    - `audio_sub` değerinden `🎙️` emoji'sini kaldır
    - `audio_dub` değerinden `🎧` emoji'sini kaldır
    - `toast_bookmarked` değerinden `🖤` emoji'sini kaldır
    - _Requirements: 1.4, 1.5_

  - [x] 2.3 `updateDomTexts()` langBtn güncelleme
    - `langBtn.innerHTML` içindeki `🇹🇷 TR` → `TR` ve `🇬🇧 EN` → `EN` olarak flag emoji'lerini kaldır
    - TR aktifken: `<span style="font-weight: 800;">TR</span> <span style="opacity: 0.4;">/ EN</span>`
    - EN aktifken: `<span style="opacity: 0.4;">TR /</span> <span style="font-weight: 800;">EN</span>`
    - _Requirements: 1.4_

- [x] 3. `public/js/player.js` ve `public/js/app.js` mesaj temizliği
  - [x] 3.1 `player.js` `renderAudioMenu()` başlık sadeleştirmesi
    - `audioHead.textContent` değerini `"Ses Formatı / Audio"` → `"Ses"` olarak değiştir
    - `subHead.textContent` değerini `"Altyazı Seçimi / Subtitles"` → `"Altyazı"` olarak değiştir
    - Altyazı dil menüsü item'larındaki flag emoji'lerini kaldır: `'🇹🇷 Türkçe'` → `'Türkçe'`, `'🇬🇧 English'` → `'English'`
    - _Requirements: 1.5_

  - [x] 3.2 `player.js` toast mesajı sadeleştirmesi
    - `resolveAndPlay()` içindeki "sunucu yok" toast'unu `"Bu anime için aktif video sunucusu bulunamadı."` → `"Şu an aktif sunucu yok."` olarak değiştir
    - `resolveAndPlay()` içindeki fallback geçiş toast'unu `"Sunucuya geçiliyor: ${nextCodename}"` → `"${nextCodename} sunucusuna geçildi"` olarak değiştir
    - `resolveAndPlay()` içindeki yükleme hatası toast'unu `"Video akışı yüklenemedi. Lütfen başka bir sunucu seçin."` → `"Video yüklenemedi. Başka bir sunucu dene."` olarak değiştir
    - `renderServerMenu()` içindeki sunucu geçişi toast'unu `"Sunucuya bağlanılıyor: ${meta.name}"` → `"${meta.name} sunucusuna geçiliyor"` olarak değiştir
    - _Requirements: 7.2, 7.3_

  - [x] 3.3 `app.js` toast ve passive scroll güncellemesi
    - `langToggleBtn` click handler'ındaki toast'u `"Dil: Türkçe 🇹🇷"` → `"Dil: Türkçe"` ve `"Language: English 🇬🇧"` → `"Language: English"` olarak değiştir
    - `loadEpisode` catch bloğundaki toast'u `"Bölüm yüklenirken bir hata oluştu: "` → `"Bölüm yüklenemedi: "` olarak güncelle
    - `window.addEventListener("scroll", ...)` çağrısını `{ passive: true }` seçeneğiyle güncelle
    - _Requirements: 4.6, 7.1_

- [x] 4. Kontrol noktası — Metin temizliği testleri
  - Tüm HTML dosyalarında `🇹🇷`, `🇬🇧`, `⚪`, `🟡`, `🔵`, `🟢`, `⚡`, `🖤`, `🎙️`, `🎧` karakterlerinin olmadığını doğrula
  - `i18n.js` TR/EN sözlüklerinde emoji kalmadığını doğrula
  - Tüm testler geçmeli, sorun olursa kullanıcıya sor

- [x] 5. CSS ve statik arka plan güncelleme
  - [x] 5.1 `public/css/theme.css` body background temizliği
    - `body` kuralından şu satırları kaldır: `background-image: url('../assets/topography-bg.svg')`, `background-size: cover`, `background-position: center`, `background-attachment: fixed`, `background-repeat: no-repeat`
    - `background-color: var(--bg-deep)` satırı korunacak
    - _Requirements: 2.1_

- [x] 6. `public/js/topography.js` oluşturma (Animasyonlu Arka Plan)
  - [x] 6.1 `TopographyBackground` class temel yapısı
    - `constructor()`: `<canvas id="bgCanvas">` oluştur, `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none` stilleri uygula, `document.body` başına ekle
    - Canvas `getContext("2d")` null dönerse canvas'ı gizle ve erken çık (fallback)
    - `resize()`: canvas genişliği/yüksekliğini `window.innerWidth` / `window.innerHeight` ile eşitle
    - `init()` metodunu tanımla (6.2'de doldurulacak)
    - `createParticles()`, `animate()`, `drawParticle()`, `pause()`, `resume()`, `destroy()` metodlarını iskelet olarak tanımla
    - _Requirements: 2.1, 2.6_

  - [x] 6.2 Particle sistemi ve rAF döngüsü
    - `createParticles()`: maksimum 60 particle oluştur; her particle şu alanları içerir: `x` (0..canvasWidth), `y` (0..canvasHeight), `vx` (-0.3..0.3), `vy` (-0.3..0.3), `radius` (1..3), `opacity` (0.02..0.07)
    - `drawParticle(p)`: yalnızca `rgba(255, 255, 255, p.opacity)` rengi kullan; `ctx.arc` ile daire çiz
    - Yakın partiküller arası bağlantı: mesafe < 200px ise `rgba(255, 255, 255, alpha)` ile `ctx.strokeStyle`, `lineWidth: 0.5` kullanarak çizgi çiz; `alpha = 0.015 * (1 - dist/200)`
    - `animate()`: başında `document.hidden` kontrolü yap (true ise return); `ctx.clearRect` ile temizle; tüm partikülleri çiz; her partiküle `vx`/`vy` drift uygula; boundary wrap (canvas dışına çıkınca karşı taraftan gir); `requestAnimationFrame` ile döngü devam et
    - `pause()`: `cancelAnimationFrame(this.rafId)`
    - `resume()`: `this.rafId = requestAnimationFrame(() => this.animate())`
    - _Requirements: 2.2, 2.4_

  - [x] 6.3 `prefers-reduced-motion` ve Page Visibility API entegrasyonu
    - `init()` içinde: `window.matchMedia("(prefers-reduced-motion: reduce)")` kontrolü; `matches` true ise `canvas.style.display = "none"` yapıp return et
    - `mq.addEventListener("change", ...)` ile tercih değişikliğini dinle
    - `document.addEventListener("visibilitychange", ...)` ile `document.hidden` durumunda `pause()`, görünür durumda `resume()` çağır
    - `window.addEventListener("resize", () => this.resize())` ekle
    - `destroy()` metodunu tamamla: tüm event listener'ları kaldır, `cancelAnimationFrame`, canvas'ı DOM'dan kaldır
    - Son satır: `window.TopographyBg = new TopographyBackground();`
    - _Requirements: 2.2, 2.3, 2.5_

- [x] 7. Tüm HTML sayfalarına `topography.js` script tag'i ekleme
  - `public/index.html`, `public/watch.html`, `public/browse.html`, `public/trending.html`, `public/top.html` dosyalarının her birinde `</body>` kapanış etiketinden önce `<script src="js/topography.js"></script>` ekle
  - `index.html`'de mevcut script'lerden sonra (app.js'in arkasına) ekle
  - `watch.html`'de mevcut script'lerden sonra (app.js'in arkasına) ekle
  - _Requirements: 2.1_

- [x] 8. Kontrol noktası — Animasyon ve metin testi
  - Sayfada canvas elementinin DOM'a eklendiğini doğrula
  - `topography-bg.svg` referansının `body` CSS'inden kaldırıldığını doğrula
  - Tüm testler geçmeli, sorun olursa kullanıcıya sor

- [x] 9. `public/assets/logo.svg` yenileme
  - [x] 9.1 Yeni "A" lettermark SVG oluşturma
    - `viewBox="0 0 40 40"` boyutunu koru
    - Yalnızca `#ffffff` rengi ve şeffaf zemin kullan
    - Dış çerçeve: `rx="8"` yuvarlak dikdörtgen, `fill="rgba(255,255,255,0.06)"`, `stroke="#ffffff"`, `stroke-width="1.5"`
    - "A" harfi gövdesi: `<path d="M11 32 L20 8 L29 32" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    - "A" harfi yatay çizgisi: `<line x1="14.5" y1="23" x2="25.5" y2="23" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>`
    - Mevcut `public/assets/logo.svg` dosyasının üzerine yaz
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 10. Performans optimizasyonları — CSS ve DocumentFragment
  - [x] 10.1 CSS containment ekleme
    - `public/css/main.css` içinde `.anime-card` kuralına `contain: layout style` ekle
    - `public/css/player.css` içinde `.episode-item` kuralından `backdrop-filter: var(--glass-blur)` ve `-webkit-backdrop-filter: var(--glass-blur)` satırlarını kaldır
    - `public/css/player.css` içinde `.episode-item` kuralına `contain: layout style` ekle
    - _Requirements: 4.1, 4.2_

  - [x] 10.2 `public/js/ui.js` DocumentFragment optimizasyonu
    - `renderShelf()` fonksiyonunda: `mediaList.forEach` döngüsünü `DocumentFragment` kullanacak şekilde güncelle; döngü içinde `container.appendChild` yerine `fragment.appendChild` çağır; döngü bittikten sonra tek seferde `container.appendChild(fragment)` ile ekle
    - `renderGrid()` fonksiyonunda: aynı `DocumentFragment` pattern'ini uygula
    - _Requirements: 4.4_

  - [x] 10.3 `public/js/ui.js` karakter avatar lazy loading
    - `renderDetailsModal()` fonksiyonunda karakter grid'ini oluşturan `<img class="char-avatar" ...>` etiketine `loading="lazy"` attribute'u ekle
    - _Requirements: 4.3_

- [x] 11. Kontrol noktası — Performans testleri
  - `renderShelf` çağrısı sonrasında container'a eklenen kart sayısının input array boyutuyla eşleştiğini doğrula
  - Tüm testler geçmeli, sorun olursa kullanıcıya sor

- [x] 12. `public/watch.html` altyazı modal UI revizyonu
  - [x] 12.1 Font boyutu range slider ekleme
    - `#subFontSizeRow` div'ini şu yapıyla değiştir:
      ```html
      <div class="setting-range-row" id="subFontSizeRow">
        <input type="range" id="subFontSizeSlider" min="14" max="32" step="1" value="20"
               class="setting-range-slider" aria-label="Yazı Boyutu"/>
        <span class="setting-range-value" id="subFontSizeDisplay">20px</span>
      </div>
      ```
    - `<label>` elementinin `for` attribute'u `subFontSizeSlider` ile eşleşmeli (accessibility)
    - _Requirements: 5.1_

  - [x] 12.2 Altyazı dikey konum slider ekleme
    - Mevcut shadow `setting-group`'undan sonra yeni bir `setting-group` ekle:
      ```html
      <div class="setting-group">
        <label class="setting-label" for="subPositionSlider">Altyazı Konumu (Alttan)</label>
        <div class="setting-range-row" id="subPositionRow">
          <input type="range" id="subPositionSlider" min="4" max="40" step="1" value="60"
                 class="setting-range-slider" aria-label="Altyazı Konumu"/>
          <span class="setting-range-value" id="subPositionDisplay">60px</span>
        </div>
      </div>
      ```
    - _Requirements: 5.3_

  - [x] 12.3 Yazı tipi seçimi pill group ekleme
    - Konum slider group'undan sonra yeni bir `setting-group` ekle:
      ```html
      <div class="setting-group">
        <label class="setting-label">Yazı Tipi</label>
        <div class="setting-pills-row" id="subFontFamilyRow">
          <button class="setting-pill active" data-font="Outfit">Outfit</button>
          <button class="setting-pill" data-font="JetBrains Mono">Mono</button>
          <button class="setting-pill" data-font="Noto Sans JP">Noto JP</button>
        </div>
      </div>
      ```
    - _Requirements: 5.5_

- [x] 13. `public/js/player.js` altyazı ayarları genişletmesi
  - [x] 13.1 `subConfig` veri modelini güncelle
    - `constructor()` içindeki `subConfig` varsayılan JSON'unu genişlet: `size: 20` (sayı, `"20px"` string yerine), `weight: "700"`, `color: "#ffffff"`, `bg: "transparent"`, `shadow: "stroke"`, `bottom: 60` (yeni alan, sayı), `fontFamily: "Outfit"` (yeni alan)
    - localStorage'dan yüklerken de yeni alanları destekle (varsayılanlarla merge et)
    - _Requirements: 5.7, 5.8_

  - [x] 13.2 `applySubtitleStyles()` metodunu genişlet
    - `root.style.setProperty("--sub-size", ...)` satırını `${this.subConfig.size}px` olacak şekilde güncelle (artık sayı değer)
    - `root.style.setProperty("--sub-font", this.subConfig.fontFamily || "Outfit")` satırını ekle
    - `this.subtitleOverlay.style.bottom = `${this.subConfig.bottom}px`` atamasını ekle (null guard ile)
    - `subPreviewText` güncellemesine `style.fontFamily = this.subConfig.fontFamily` satırını ekle
    - `subPreviewText.style.fontSize` satırını da `${this.subConfig.size}px` şekline getir
    - _Requirements: 5.2, 5.4, 5.6_

  - [x] 13.3 `initSubtitleCustomizer()` içine yeni event binding'ler ekle
    - Font size range slider: `#subFontSizeSlider` input event → `this.subConfig.size = parseInt(...)`, `#subFontSizeDisplay` güncelle, `saveSubConfig()` çağır; slider başlangıç değerini `this.subConfig.size` ile doldur
    - Position range slider: `#subPositionSlider` input event → `this.subConfig.bottom = parseInt(...)`, `#subPositionDisplay` güncelle, `saveSubConfig()` çağır; slider başlangıç değerini `this.subConfig.bottom` ile doldur
    - Font family pills: `#subFontFamilyRow .setting-pill` click event → `this.subConfig.fontFamily = p.getAttribute("data-font")`, `saveSubConfig()` çağır
    - _Requirements: 5.1, 5.3, 5.5_

  - [x] 13.4 `updateSubtitleSettingsUI()` içine yeni UI sync'leri ekle
    - Font size slider değerini `this.subConfig.size` ile güncelle
    - `#subFontSizeDisplay` içeriğini `${this.subConfig.size}px` olarak güncelle
    - Position slider değerini `this.subConfig.bottom` ile güncelle
    - `#subPositionDisplay` içeriğini `${this.subConfig.bottom}px` olarak güncelle
    - `#subFontFamilyRow .setting-pill` butonlarının `active` class'ını `data-font === this.subConfig.fontFamily` karşılaştırmasıyla güncelle
    - _Requirements: 5.7_

- [x] 14. `public/css/player.css` range slider stilleri
  - [x] 14.1 Range slider CSS kuralları ekleme
    - `.setting-range-row { display: flex; align-items: center; gap: 0.85rem; }` ekle
    - `.setting-range-slider` kuralını ekle: `flex: 1`, `height: 4px`, `-webkit-appearance: none`, `background: rgba(255,255,255,0.2)`, `border-radius: var(--radius-full)`, `outline: none`, `cursor: pointer`
    - `.setting-range-slider::-webkit-slider-thumb` kuralını ekle: `width: 16px`, `height: 16px`, `border-radius: 50%`, `background: #ffffff`, `box-shadow: 0 2px 8px rgba(0,0,0,0.6)`, `transition: transform var(--transition-fast)`
    - `.setting-range-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }` ekle
    - `.setting-range-value` kuralını ekle: `font-family: var(--font-mono)`, `font-size: 0.82rem`, `font-weight: 700`, `color: #ffffff`, `min-width: 42px`, `text-align: right`
    - _Requirements: 5.1, 5.3_

- [x] 15. Kontrol noktası — Altyazı ayarları testleri
  - Font boyutu slider min=14, max=32, step=1 attribute'larının doğru olduğunu doğrula
  - localStorage'da altyazı ayarı olmadan sayfanın varsayılan değerlerle (size=20, bottom=60, fontFamily="Outfit") yüklendiğini doğrula
  - Tüm testler geçmeli, sorun olursa kullanıcıya sor

- [x] 16. `public/watch.html` kalite seçici HTML ekleme
  - [x] 16.1 Kalite butonu ekleme
    - `.controls-right` bölümüne `subSettingsBtn`'den önce kalite butonunu ekle:
      ```html
      <button class="control-btn" id="qualityBtn" title="Video Kalitesi" style="display: none;">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M8 10h2m4 0h2M8 14h8"/>
        </svg>
      </button>
      ```
    - `player-wrapper` içindeki `controls-overlay` altına dropdown menü ekle:
      ```html
      <div class="deck-dropdown-menu" id="qualityDropdownMenu"
           style="position: absolute; bottom: 70px; right: 1.25rem; width: 140px; z-index: 50;"></div>
      ```
    - _Requirements: 6.1_

- [x] 17. `public/js/player.js` kalite seçici implementasyonu
  - [x] 17.1 Constructor'a kalite state ve DOM referansları ekle
    - `this.qualityBtn = document.getElementById("qualityBtn")` ekle
    - `this.qualityMenu = document.getElementById("qualityDropdownMenu")` ekle
    - `this.currentQualityLevel = -1` (başlangıç: Otomatik) ekle
    - _Requirements: 6.4_

  - [x] 17.2 `initEvents()` içine qualityBtn click handler ekle
    - `qualityBtn` click event: `e.stopPropagation()`, `isOpen` kontrolü, `closeAllDropdowns()`, açık değilse `qualityMenu.classList.add("open")` ve `qualityBtn.classList.add("open")`
    - _Requirements: 6.1_

  - [x] 17.3 `closeAllDropdowns()` metodunu güncelle
    - `this.qualityMenu.classList.remove("open")` satırını ekle
    - `this.qualityBtn.classList.remove("open")` satırını ekle
    - _Requirements: 6.8_

  - [x] 17.4 `populateQualityMenu()` metodunu oluştur
    - `this.hls` veya `this.qualityMenu` yoksa erken return
    - `qualityBtn.style.display = "flex"` ile butonu görünür yap
    - `qualityMenu.innerHTML = ""` ile temizle
    - "Otomatik" seçeneği oluştur: `deck-menu-item` sınıfı, `hls.currentLevel === -1` ise `active`, tıklandığında `hls.currentLevel = -1`, `currentQualityLevel = -1`, `closeAllDropdowns()`, `populateQualityMenu()` çağır
    - `hls.levels` dizisini `height` alanına göre yüksekten düşüğe sırala (orijinal index'leri koru)
    - Her seviye için `deck-menu-item` oluştur: `level.height` varsa `"${height}p"` etiketi, yoksa `"Seviye ${n}"` etiketi; tıklandığında `hls.currentLevel = level.originalIndex`, `currentQualityLevel = level.originalIndex`, menüyü kapat ve yeniden render et
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 17.5 `playHLS()` içinde `MANIFEST_PARSED` handler'ı güncelle
    - `this.hls.on(Hls.Events.MANIFEST_PARSED, ...)` callback'inin başına `this.populateQualityMenu()` çağrısı ekle
    - _Requirements: 6.2_

  - [x] 17.6 `playEmbed()` ve `resetPlayerState()` güncelleme
    - `playEmbed()` içine: `if (this.qualityBtn) this.qualityBtn.style.display = "none"` ve `if (this.qualityMenu) this.qualityMenu.innerHTML = ""` ekle
    - `resetPlayerState()` içine: `this.currentQualityLevel = -1`, `if (this.qualityMenu) this.qualityMenu.innerHTML = ""`, `if (this.qualityBtn) this.qualityBtn.style.display = "none"` ekle
    - _Requirements: 6.6, 6.7_

- [x] 18. Kontrol noktası — Kalite seçici ve genel entegrasyon testleri
  - Embed modunda `qualityBtn.style.display === "none"` olduğunu doğrula
  - `hls.levels = []` iken dropdown'da yalnızca "Otomatik" seçeneğinin bulunduğunu doğrula
  - Tüm testler geçmeli, sorun olursa kullanıcıya sor

- [ ] 19. Property-based testler (vitest + fast-check)
  - [ ]* 19.1 `tests/` klasörü ve test ortamı kurulumu
    - Proje kökünde `tests/` klasörü oluştur
    - `package.json` yoksa `{ "type": "module" }` içeren minimal bir tane oluştur
    - `vitest` ve `fast-check` paketlerini `devDependencies` olarak yükle (pinned version)
    - `vitest.config.js` dosyası oluştur; test ortamı `jsdom` olarak ayarla
    - _Requirements: Tüm test property'leri_

  - [ ]* 19.2 Property 1: Monokrom renk değişmezi testi
    - `tests/topography.property.test.js` dosyası oluştur
    - `TopographyBackground.drawParticle(p)` metodunu izole test et: mock canvas context ile çağır; `fillStyle` değerinin `rgba(255, 255, 255, α)` formatında ve `α < 0.08` olduğunu doğrula
    - `fc.record(...)` ile tüm geçerli particle alanlarını üret, minimum 100 iterasyon çalıştır
    - **Property 1: Monochrome Color Invariant**
    - **Validates: Gereksinim 2.4**

  - [ ]* 19.3 Property 3: Font boyutu CSS değişkeni senkronizasyon testi
    - `tests/subtitle.property.test.js` dosyası oluştur
    - `applySubtitleStyles()` mantığını izole fonksiyon olarak test et; mock `document.documentElement` kullan
    - `fc.integer({ min: 14, max: 32 })` ile boyut üret; `--sub-size` CSS değişkeninin `"${value}px"` ile eşleştiğini doğrula
    - **Property 3: Font Size CSS Variable Sync**
    - **Validates: Gereksinim 5.2**

  - [ ]* 19.4 Property 4: Altyazı konum localStorage round-trip testi
    - `tests/subtitle.property.test.js` içine ekle
    - `fc.integer({ min: 4, max: 40 })` ile `bottom` değeri üret; mock localStorage ile kaydet ve yükle; `loaded.bottom === original` olduğunu doğrula
    - **Property 4: Subtitle Position Round-Trip**
    - **Validates: Gereksinim 5.4**

  - [ ]* 19.5 Property 5: Font family CSS değişkeni senkronizasyon testi
    - `tests/subtitle.property.test.js` içine ekle
    - `fc.constantFrom("Outfit", "JetBrains Mono", "Noto Sans JP")` ile font seç; `--sub-font` CSS değişkeninin seçilen değerle eşleştiğini doğrula
    - **Property 5: Font Family CSS Variable Sync**
    - **Validates: Gereksinim 5.6**

  - [ ]* 19.6 Property 6: Altyazı config serializasyon round-trip testi
    - `tests/subtitle.property.test.js` içine ekle
    - Tüm alanları kapsayan `fc.record(...)` ile tam `SubtitleConfig` nesnesi üret; `JSON.stringify` → `JSON.parse` round-trip sonrası tüm alanların orijinal değerlerle eşleştiğini doğrula; minimum 200 iterasyon çalıştır
    - **Property 6: Subtitle Config Serialization Round-Trip**
    - **Validates: Gereksinim 5.7**

  - [ ]* 19.7 Property 7: HLS kalite dropdown boyutu testi
    - `tests/quality.property.test.js` dosyası oluştur
    - `populateQualityMenu()` mantığını izole fonksiyon olarak test et; mock `hls` ve mock `qualityMenu` (items array) kullan
    - `fc.array(fc.record({ height: fc.oneof(...) }), { minLength: 0, maxLength: 10 })` ile seviye dizisi üret; toplam item sayısının `levels.length + 1` olduğunu doğrula
    - **Property 7: HLS Quality Dropdown Size**
    - **Validates: Gereksinim 6.2**

  - [ ]* 19.8 Property 8: Kalite seviyesi etiket format testi
    - `tests/quality.property.test.js` içine ekle
    - `fc.integer({ min: 240, max: 2160 })` ile `height` üret; etiketin `"${height}p"` formatında olduğunu doğrula
    - `height = null` durumu için ayrı test: etiketin `"Seviye ${n}"` formatında olduğunu doğrula
    - **Property 8: Quality Level Label Format**
    - **Validates: Gereksinim 6.3**

---

## Notes

- `*` ile işaretli alt görevler isteğe bağlıdır; MVP için atlanabilir
- Her görev ilgili gereksinimlere izlenebilirlik için referans içermektedir
- Kontrol noktaları artımlı doğrulama sağlar
- Property testleri, tasarım belgesindeki evrensel doğruluk özelliklerini doğrular
- Birim testleri belirli örnekleri ve edge case'leri doğrular
- `topography.js`'nin export edilebilir bileşenler içermesi (class export veya izole fonksiyon export) property test yazımını kolaylaştırır

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["5.1", "9.1"] },
    { "id": 3, "tasks": ["6.1", "10.1", "10.2", "10.3"] },
    { "id": 4, "tasks": ["6.2", "12.1", "12.2", "12.3"] },
    { "id": 5, "tasks": ["6.3", "13.1", "13.2", "14.1"] },
    { "id": 6, "tasks": ["7", "13.3", "16.1"] },
    { "id": 7, "tasks": ["13.4", "17.1", "17.2", "17.3"] },
    { "id": 8, "tasks": ["17.4", "17.5"] },
    { "id": 9, "tasks": ["17.6"] },
    { "id": 10, "tasks": ["19.1"] },
    { "id": 11, "tasks": ["19.2", "19.3", "19.4", "19.5", "19.6", "19.7", "19.8"] }
  ]
}
```
