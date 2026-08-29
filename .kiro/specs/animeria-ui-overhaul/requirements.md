# Requirements Document

## Introduction

ANIMERIA anime yayın platformunun UI/UX revizyonu. Hedef: yapay zekaların eklediği doğal olmayan metinleri ve emojileri temizlemek, arka planı animasyonlu hale getirmek, logoyu yenilemek, performans iyileştirmeleri yapmak, altyazı ayarlarını daha kullanışlı hale getirmek ve video kalite seçimi eklemek. Sonuç olarak daha sade, doğal ve hızlı bir kullanıcı arayüzü elde etmek.

---

## Sözlük

- **Platform**: ANIMERIA anime yayın uygulaması (frontend SPA, vanilla JS).
- **Player**: `AnimeriaPlayer` sınıfı tarafından yönetilen `public/js/player.js` içindeki özel HLS video oynatıcı.
- **Deck**: İzle sayfasındaki sunucu ve ses seçim paneli (`deck-compact-wrapper`).
- **Altyazı_Katmanı**: `#playerCustomSubtitles` DOM öğesi üzerinden çalışan özel WebVTT altyazı bindirmesi.
- **Kalite_Seçici**: HLS akışındaki mevcut çözünürlük seviyelerini listeleyen, Player'a entegre edilecek yeni kontrol bileşeni.
- **Arka_Plan_Animasyonu**: Statik SVG'nin yerini alacak, GPU hızlandırmalı CSS/Canvas hareketli arka plan sistemi.
- **HLS_Seviyesi**: `hls.js` kütüphanesinin sunduğu `levels[]` dizisindeki tek bir çözünürlük kaydı.
- **UI_Metni**: HTML şablonlarında, JS `innerHTML` atamalarında ve `i18n.js`'te bulunan kullanıcıya görünen tüm yazılar.

---

## Requirements

### Gereksinim 1: Doğal Olmayan Metin ve Emoji Temizliği

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, arayüzde yapay zekaya özgü emoji ve abartılı pazarlama metinleri yerine sade ve doğal Türkçe ifadeler görmek istiyorum, böylece site daha gerçek ve kullanıcı dostu hissettiriyor.

#### Kabul Kriterleri

1. THE Platform SHALL `public/index.html`, `public/watch.html` ve `public/js/ui.js` içindeki tüm emoji karakterlerini (`🇹🇷`, `🇬🇧`, `⚪`, `🟡`, `🔵`, `🟢`, `⚡`) kaldırmalıdır; bu karakterlerin işlevsel yedeği varsa (`🇹🇷` → `TR` etiketi gibi) düz metin veya küçük HTML `<span>` etiketi ile karşılanmalıdır.
2. THE Platform SHALL bölüm altyazı ayarları modaldaki etiketleri kısaltmalıdır; `"Yazı Boyutu / Font Size"` yerine `"Yazı Boyutu"`, `"Arkaplan Opaklığı / Background"` yerine `"Arkaplan"` gibi sadeleştirilmiş Türkçe etiketler kullanılmalıdır.
3. THE Platform SHALL footer'daki `"Liquid Glass Topographic Anime Streaming Experience"` ve `"AniList ve Anivexa motoru ile desteklenmektedir."` gibi abartılı açıklamaları kaldırmalı, yalnızca `"© 2026 ANIMERIA"` ve kısa bir hizmet açıklaması bırakmalıdır.
4. THE Platform SHALL dil değiştirme toastını (`"Dil: Türkçe 🇹🇷"`, `"Language: English 🇬🇧"`) emojisiz hale getirmelidir; `"Dil: Türkçe"` ve `"Language: English"` yeterlidir.
5. THE Platform SHALL sunucu menüsündeki etiket metinlerini (örn. `"Sub (Orijinal Ses)"`, `"Dub (Dublaj)"`) ve ses bölümü başlıklarını (`"Ses Formatı / Audio"`, `"Altyazı Seçimi / Subtitles"`) temizlemelidir; her biri tek dilde ve kısa olmalıdır.
6. WHEN altyazı pill butonları oluşturulduğunda, THE Platform SHALL `"⚪ Saf Beyaz"`, `"🟡 Anime Sarısı"` gibi renk etiketlerini emojisiz şekilde `"Beyaz"`, `"Sarı"` olarak render etmelidir.
7. THE Platform SHALL hero section bölüm etiketlerini (`"Şu Anda Popüler"`, `"Tüm Zamanların En İyileri"`) günlük dilde karşılıklarıyla değiştirmelidir; `"Popüler"`, `"En Yüksek Puanlılar"` gibi.

---

### Gereksinim 2: Animasyonlu Arka Plan

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, sitenin arka planının hafif hareket etmesini istiyorum, böylece site cansız ve statik görünmek yerine daha modern bir his veriyor; ama bu animasyon CPU ve RAM tüketimini artırmamalı.

#### Kabul Kriterleri

1. THE Platform SHALL statik `topography-bg.svg` arka planını kaldırmalı ve yerine bir CSS/Canvas tabanlı Arka_Plan_Animasyonu sistemi koymalıdır.
2. THE Arka_Plan_Animasyonu SHALL yalnızca `requestAnimationFrame` ve `will-change: transform` kullanan CSS animasyonlarından veya GPU hızlandırmalı Canvas 2D bağlamından oluşmalıdır; `setTimeout`/`setInterval` döngü animasyonu kullanılmamalıdır.
3. THE Arka_Plan_Animasyonu SHALL `prefers-reduced-motion: reduce` medya sorgusuna uymalıdır; bu tercih aktifse animasyon durmalı, statik koyu arka plan kalmalıdır.
4. THE Arka_Plan_Animasyonu SHALL mevcut `--bg-deep: #08080a` renk değişkenini temel alarak monokrom (siyah, koyu gri, çok düşük opaklıklı beyaz) tonlarında olmalıdır; renkli arka plan kullanılmamalıdır.
5. WHEN sayfa arka plana alındığında (Page Visibility API `visibilitychange`), THE Arka_Plan_Animasyonu SHALL animasyonu duraklatmalıdır; sayfa tekrar ön plana alındığında devam etmelidir.
6. THE Arka_Plan_Animasyonu SHALL `z-index: -1` ve `position: fixed` ile konumlandırılmalıdır; diğer içeriklerin üstüne çıkmamalıdır.

---

### Gereksinim 3: Yeni Logo Tasarımı

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, mevcut elmas/katana şeklindeki logonun yerine daha farklı ve minimal bir logo görmek istiyorum, böylece site daha özgün görünüyor.

#### Kabul Kriterleri

1. THE Platform SHALL `public/assets/logo.svg` dosyasını yeni bir SVG logosuyla değiştirmelidir; yeni logo mevcut elmas/katana geometrisinden farklı bir biçime sahip olmalıdır.
2. THE Logo SHALL yalnızca `#ffffff` (beyaz) tek renk kullanmalıdır; gradient veya çok renkli tasarım kullanılmamalıdır.
3. THE Logo SHALL 28×28 px ile 80×80 px arasındaki tüm boyutlarda tanınabilir kalmalıdır.
4. THE Logo SHALL `viewBox="0 0 40 40"` boyutlarını korumalı ve navbar, footer ve tarayıcı favicon'u için `width`/`height` nitelikleri ile yeniden boyutlandırılabilir olmalıdır.
5. WHEN yeni logo SVG dosyası kaydedildiğinde, THE Platform SHALL navbar ve footer'daki tüm `<img src="assets/logo.svg">` referanslarının değişikliği otomatik olarak yansıtmasını sağlamalıdır; ek JS veya HTML değişikliği gerekmemelidir.

---

### Gereksinim 4: Performans Optimizasyonları

**Kullanıcı Hikayesi:** Bir geliştirici olarak, platform daha az RAM ve CPU tüketmesini istiyorum, böylece düşük güçlü cihazlarda da akıcı çalışıyor.

#### Kabul Kriterleri

1. THE Platform SHALL `backdrop-filter` kullanımını azaltmalıdır; `.watch-grid` içindeki `.episode-item` gibi çok sayıda tekrarlı öğe `backdrop-filter` içermemeli, yalnızca kapsayıcı panel öğesi (`episodes-sidebar`) `backdrop-filter` uygulamalıdır.
2. THE Platform SHALL her kart ve bölüm öğesi için `contain: layout style` CSS özelliğini uygulamalıdır; böylece bir öğenin yeniden çizimi diğerlerini etkilememelidir.
3. THE Platform SHALL `<img>` etiketlerinde `loading="lazy"` özelliğinin tüm kart görselleri, karakter avatarları ve bölüm kapak görselleri için mevcut olmasını sağlamalıdır.
4. THE Platform SHALL `createAnimeCard` gibi DOM oluşturma fonksiyonlarında `DocumentFragment` kullanmalıdır; her kart için ayrı `appendChild` çağrısı yapılmamalı, tek toplu ekleme yapılmalıdır.
5. WHEN kullanıcı arama kutusuna yazarken, THE Platform SHALL 350 ms'den fazla debounce uygulamalıdır; her tuş vuruşunda API çağrısı yapılmamalıdır. (Mevcut `searchDebounceTimer` korunmalı ve doğrulanmalıdır.)
6. THE Platform SHALL `window.scroll` dinleyicisini `{ passive: true }` seçeneğiyle kaydetmelidir; kaydırma performansını bloke etmemelidir.
7. THE Platform SHALL hero carousel `setInterval` yerine `requestAnimationFrame` tabanlı zamanlayıcı kullanmalıdır; ya da `setInterval` kalırsa `clearInterval` ile bellek sızıntısı önlenmelidir. (Mevcut `startHeroAutoplay` fonksiyonu zaten `clearInterval` kullanıyor; bu davranış korunmalıdır.)
8. THE Platform SHALL `public/css/main.css` ve `public/css/player.css` içindeki tekrar eden `backdrop-filter` tanımlarını CSS değişkeni aracılığıyla birleştirmelidir; `var(--glass-blur)` kullanımı tutarlı olmalıdır.

---

### Gereksinim 5: Geliştirilmiş Altyazı Ayarları

**Kullanıcı Hikayesi:** Bir izleyici olarak, altyazı boyutunu ve konumunu kaydırıcıyla hassas şekilde ayarlamak ve seçtiğim yazı tipini görmek istiyorum, böylece altyazılar benim için daha rahat okunabiliyor.

#### Kabul Kriterleri

1. THE Platform SHALL mevcut yazı boyutu pill butonlarını (`16px`, `20px`, `24px`, `28px`) bir `<input type="range" min="14" max="32" step="1">` kaydırıcısıyla değiştirmelidir; kaydırıcının yanında anlık `px` değeri görüntülenmelidir.
2. WHEN kullanıcı yazı boyutu kaydırıcısını hareket ettirdiğinde, THE Altyazı_Katmanı SHALL `--sub-size` CSS değişkenini 16 ms içinde güncelleyerek önizleme metnine yansıtmalıdır.
3. THE Platform SHALL altyazı dikey konumunu ayarlayan yeni bir `<input type="range" min="4" max="40" step="1">` kaydırıcısı eklemelidir; değer `px` cinsinden `.player-subtitle-overlay`'ın `bottom` değerine uygulanmalıdır.
4. WHEN kullanıcı konum kaydırıcısını hareket ettirdiğinde, THE Altyazı_Katmanı SHALL `bottom` CSS özelliğini anlık olarak güncellemeli ve `localStorage`'a kaydetmelidir.
5. THE Platform SHALL yazı tipi seçimi için en az üç seçenek sunmalıdır: `Outfit` (varsayılan), `JetBrains Mono`, `Noto Sans JP`; bu seçenekler mevcut pill buton stiliyle gösterilmelidir.
6. WHEN kullanıcı yazı tipi pill butonuna tıkladığında, THE Altyazı_Katmanı SHALL seçilen `font-family` değerini `--sub-font` CSS değişkeni aracılığıyla hem `.subtitle-text-pill` öğesine hem de önizleme kutusuna uygulamalıdır.
7. THE Platform SHALL tüm altyazı ayarlarını (`size`, `weight`, `color`, `bg`, `shadow`, `bottom`, `fontFamily`) `animeria_sub_customization` localStorage anahtarında tek JSON nesnesi olarak saklamalı ve sayfa yüklendiğinde geri yüklemelidir.
8. IF localStorage'da altyazı ayarı yoksa, THE Platform SHALL aşağıdaki varsayılan değerleri uygulamalıdır: boyut `20px`, kalınlık `700`, renk `#ffffff`, arka plan `transparent`, gölge `stroke`, konum `60px`, yazı tipi `Outfit`.

---

### Gereksinim 6: Video Kalite Seçimi

**Kullanıcı Hikayesi:** Bir izleyici olarak, video çözünürlüğünü manuel olarak değiştirmek istiyorum, böylece yavaş bağlantımda daha düşük kalite seçerek kesintisiz izleyebiliyor, hızlı bağlantımda 1080p izleyebiliyorum.

#### Kabul Kriterleri

1. THE Kalite_Seçici SHALL `public/watch.html` içindeki `.controls-right` bölümüne yeni bir `<button>` olarak eklenmeli; buton mevcut `control-btn` stiliyle tutarlı olmalıdır.
2. WHEN `hls.js` manifest dosyası ayrıştırıldığında (`MANIFEST_PARSED` olayı), THE Player SHALL `hls.levels` dizisini tarayarak mevcut çözünürlükleri bir dropdown menüye doldurmalıdır; seçenekler yüksekten düşüğe sıralanmalıdır.
3. THE Kalite_Seçici SHALL her seviye için yüksekliği (`level.height`) `"1080p"`, `"720p"`, `"480p"`, `"360p"` formatında göstermelidir; eğer yükseklik bilgisi yoksa `"Seviye N"` etiketi kullanılmalıdır.
4. THE Kalite_Seçici SHALL varsayılan olarak `"Otomatik"` etiketli bir seçenek içermelidir; bu seçenek `hls.currentLevel = -1` değerine karşılık gelmelidir (hls.js ABR modu).
5. WHEN kullanıcı bir kalite seviyesi seçtiğinde, THE Player SHALL `hls.currentLevel` değerini seçilen seviyenin indeksine atamalı ve dropdown'ı kapatmalıdır.
6. WHEN yalnızca bir HLS seviyesi mevcutsa, THE Kalite_Seçici SHALL butonun üzerinde `"Otomatik"` yazmalı ve dropdown açıldığında yalnızca tek seçeneği göstermelidir; buton gizlenmemelidir.
7. IF akış HLS değil embed ise (iframe modu), THE Player SHALL Kalite_Seçici butonunu `display: none` ile gizlemelidir.
8. THE Kalite_Seçici SHALL sunucu ve ses dropdown'larıyla aynı `.deck-dropdown-menu` CSS sınıfını ve kapatma davranışını (`closeAllDropdowns` metodu) paylaşmalıdır.

---

### Gereksinim 7: Genel Doğal Arayüz Dili

**Kullanıcı Hikayesi:** Bir kullanıcı olarak, sitenin tüm yazılarının yapay zeka çıktısı yerine doğal insan diliyle yazılmış gibi hissettirmesini istiyorum, böylece platform daha güvenilir ve samimi görünüyor.

#### Kabul Kriterleri

1. THE Platform SHALL `public/js/app.js` içindeki dil değiştirme toast mesajlarını güncellemelidir; `"Dil: Türkçe"` ve `"Language: English"` formatı kullanılmalıdır, emoji içermemelidir.
2. THE Platform SHALL `public/js/player.js` içindeki toast mesajlarını sadeleştirmelidir; `"Sunucuya bağlanılıyor: bee"` yerine `"bee sunucusuna geçildi"` gibi doğal cümle yapısı kullanılmalıdır.
3. THE Platform SHALL `public/js/player.js` içindeki hata mesajlarını kullanıcı dostu düzeltmelidir; `"Bu anime için aktif video sunucusu bulunamadı."` yerine `"Şu an aktif sunucu yok."` gibi kısa ve açık ifadeler kullanılmalıdır.
4. THE Platform SHALL `public/js/ui.js` içindeki `renderDetailsModal` fonksiyonundaki bölüm başlıklarını (`this.t('modal_synopsis')`, `this.t('modal_characters')`, `this.t('modal_recommendations')`) i18n anahtarlarından gelecek şekilde korumalı, ancak TR çevirilerini gözden geçirip sadeleştirmelidir.
5. THE Platform SHALL bölüm kenar çubuğu arama input'unun `placeholder` metnini `"Bölüm ara... (örn: 12)"` olarak korumalı; bu metin zaten yeterince doğaldır ve değiştirilmemelidir.
6. THE Platform SHALL `public/index.html` footer kısayollar listesindeki Türkçe açıklamaları kısaltmalıdır; `"[Boşluk] Oynat / Duraklat"` yeterlidir, ek açıklama gerekmez.
