/* ==========================================================================
   ANIMERIA — I18N LOCALIZATION MODULE (TR / EN)
   Complete multi-language engine covering UI, Auth, Profile, Stats & Comments
   ========================================================================== */

const I18N_DICT = {
  tr: {
    brand_title: "ANIMERIA",
    nav_home: "Ana Sayfa",
    nav_trending: "Trendler",
    nav_top: "En İyiler",
    nav_browse: "Keşfet",
    nav_profile: "Profilim & İstatistikler",
    nav_my_list: "İzleme Listem",
    nav_import: "MAL & AniList İçe Aktar",
    nav_login: "Giriş Yap",
    nav_register: "Kayıt Ol",
    nav_logout: "Çıkış Yap",
    nav_search: "Anime Ara...",
    search_placeholder: "Anime Ara... (örn: Naruto, Solo Leveling)",
    btn_watch_now: "Hemen İzle",
    btn_details: "Detaylar",
    btn_watchlist: "Listeme Ekle",
    btn_in_watchlist: "Listemde",
    btn_trailer: "Fragman",
    btn_play_ep1: "1. Bölümü İzle",
    shelf_continue: "İzlemeye Devam Et",
    shelf_continue_tag: "Kaldığın Yerden",
    shelf_trending: "Trend Animeler",
    shelf_trending_tag: "Popüler",
    shelf_popular: "En Popüler Animeler",
    shelf_popular_tag: "En İyiler",
    shelf_top: "En Yüksek Puanlılar",
    shelf_top_tag: "Başyapıtlar",
    shelf_recent: "Yeni Çıkanlar",
    shelf_recent_tag: "Güncel",
    browse_title: "Keşfet",
    browse_tag: "Filtrele",
    genre_all: "Tümü",
    episodes: "Bölümler",
    search_episodes_placeholder: "Bölüm ara... (örn: 12)",
    drawer_bookmarks_title: "İzleme Listem",
    drawer_history_title: "İzleme Geçmişi",
    empty_bookmarks: "Listenizde henüz anime bulunmuyor.",
    empty_history: "İzleme geçmişiniz henüz boş.",
    server_hub_title: "Sunucular",
    subtitle_title: "Altyazı Seçimi",
    audio_title: "Ses Formatı",
    audio_sub: "Sub (Orijinal Ses)",
    audio_dub: "Dub (Dublaj)",
    skip_intro: "İntroyu Atla →",
    skip_outro: "Outroyu Atla →",
    sub_off: "Kapalı",
    sub_softsub: " (Gömülü / Softsub)",
    modal_synopsis: "Özet",
    modal_characters: "Karakterler & Seslendirmenler",
    modal_recommendations: "Önerilen Benzer Animeler",
    toast_bookmarked: "Listeme eklendi",
    toast_removed: "Listeden kaldırıldı",
    watch_order_title: "İzleme Sırası & Seri Kronolojisi",
    watch_order_current: "ŞU AN İZLENİYOR",
    watch_order_next: "SIRADA",
    watch_order_watched: "İZLENDİ",
    footer_desc: "Reklamsız ve tamamen ücretsiz anime izleme platformu. İletişim: <a href=\"https://fadimrak.xyz\" target=\"_blank\" style=\"color: #ffffff; text-decoration: underline;\">fadimrak.xyz</a>",

    // Auth Strings
    auth_title: "Giriş Yap & Kayıt Ol",
    auth_subtitle: "Anime yolculuğunu kaydet, istatistiklerini takip et.",
    auth_tab_login: "Giriş Yap",
    auth_tab_register: "Kayıt Ol",
    auth_username_label: "Kullanıcı Adı",
    auth_username_placeholder: "Kullanıcı adınız (örn: animekaşifi)",
    auth_email_label: "E-posta veya Kullanıcı Adı",
    auth_email_register_label: "E-posta Adresi",
    auth_email_placeholder: "ornek@animeria.com veya kullanıcı adı",
    auth_email_register_placeholder: "ornek@animeria.com",
    auth_password_label: "Şifre",
    auth_password_placeholder: "••••••••",
    auth_btn_login: "Giriş Yap",
    auth_btn_register: "Hesap Oluştur & Kayıt Ol",

    // Profile & Stats Strings
    profile_title: "Profilim & İzleme İstatistikleri",
    profile_edit_btn: "Profili Düzenle",
    profile_import_btn: "MAL / AniList İçe Aktar",
    profile_guest_title: "Misafir Kullanıcı",
    profile_guest_bio: "Anime yolculuğunu takip et ve listeni senkronize et.",
    stat_total_anime: "İzlenen Anime",
    stat_total_hours: "Saat",
    stat_total_days: "Gün Toplam İzleme",
    stat_total_episodes: "Toplam Bölüm",
    stat_average_score: "Ortalama Puan",
    analytics_breakdown_title: "İzleme Durumu Dağılımı",
    analytics_genres_title: "En Çok İzlenen Türler",
    status_all: "Tümü",
    status_watching: "İzleniyor",
    status_completed: "Tamamlandı",
    status_planning: "Planlananlar",
    status_paused: "Beklemede",
    status_dropped: "Bırakıldı",
    watchlist_search_placeholder: "Listemde ara...",
    btn_step_watch: "İzle",
    import_hub_title: "İzleme Listelerini İçe Aktar",
    import_hub_tag: "Entegrasyon & Senkronizasyon",
    import_anilist_title: "AniList'ten İçe Aktar",
    import_anilist_desc: "Tamamlanan, izlenen ve planlanan tüm listelerini 1 tıkla çek.",
    import_anilist_placeholder: "örn: animekaşifi",
    import_anilist_btn: "Listeyi Senkronize Et & İçe Aktar",
    import_mal_title: "MyAnimeList'ten İçe Aktar",
    import_mal_desc: "MAL anime puanlarını, bölüm sayılarını ve saatlerini aktar.",
    import_mal_placeholder: "örn: animefan",
    import_mal_btn: "MyAnimeList'ten İçe Aktar",

    // Image Changer Modal
    img_modal_title: "Görseli Güncelle",
    img_tab_url: "Görsel URL",
    img_tab_upload: "Dosya Yükle",
    img_tab_presets: "Hazır Seçenekler",
    img_url_placeholder: "https://... doğrudan görsel linki",
    img_upload_label: "Cihazınızdan bir resim seçin (PNG, JPG, WebP)",
    img_save_btn: "Görseli Kaydet",
    hover_change_avatar: "Avatarı Değiştir",
    hover_change_banner: "Bannerı Değiştir",

    // Comments & Spoiler Strings
    comments_header_title: "Bölüm Yorumları",
    comments_rule_title: "Topluluk & Spoiler Uyarısı:",
    comments_rule_desc: "Bölüm hakkında spoiler (olay örgüsü, sürpriz son vb.) içeren yorumları 'Spoiler içeriyor' seçeneğini işaretlemeden paylaşmak kesinlikle yasaktır. Kurala uymayanlar platformdan süresiz uzaklaştırılacaktır.",
    comments_input_placeholder: "Bu bölüm hakkında ne düşünüyorsun? Düşüncelerini paylaş...",
    comments_spoiler_checkbox: "Spoiler içeriyor (Spoiler Warning)",
    comments_post_btn: "Yorum Gönder",
    comments_login_prompt: "Yorum yapmak için giriş yapmalısınız.",
    comments_login_btn: "Giriş Yap & Yorum Yaz",
    comments_empty: "Bu bölüme henüz yorum yapılmamış. İlk yorumu sen yaz!",
    comments_spoiler_warning: "Bu yorum spoiler içermektedir.",
    comments_spoiler_reveal: "Görmek için tıkla",
    comments_spoiler_hint: "⚠️ Spoiler İçerik — Okumak için tıkla",
    comments_delete: "Sil",
    comments_like: "Beğen",
    pref_autoplay: "Otomatik Oynat",
    pref_autonext: "Otomatik Sonraki",
    pref_autoskip: "İntro Atla",
    time_just_now: "Az önce",
    time_minutes_ago: "dakika önce",
    time_hours_ago: "saat önce",
    time_days_ago: "gün önce",

    // DMCA Page
    dmca_badge: "Telif Hakkı & Yasal Bildirim",
    dmca_title: "DMCA Politikası",
    dmca_subtitle: "Animeria, üçüncü taraf telif haklarına saygı duyar. Bu sayfa, içerik kaldırma talepleri ve platformumuzun yasal statüsü hakkında bilgi içermektedir.",
    dmca_back_btn: "Ana Sayfaya Dön",
    dmca_main_title: "Animeria Herhangi Bir Video İçeriği Barındırmamaktadır",
    dmca_main_p1: "Animeria, kendi sunucularında hiçbir video dosyası, anime bölümü veya medya içeriği depolamaz, yüklemez ya da dağıtmaz. Platformumuz yalnızca bir <strong style=\"color: var(--text-primary);\">arama ve bağlantı motoru</strong> olarak işlev görmektedir.",
    dmca_main_p2: "Sitede gösterilen tüm video oynatıcılar; üçüncü taraf web sitelerinden alınan <strong style=\"color: var(--text-primary);\">embed (gömülü) bağlantılar</strong> aracılığıyla çalışır. Bu bağlantılar, ilgili içerikleri kendi altyapılarında barındıran bağımsız kaynaklara yönlendirir. Animeria bu kaynaklar üzerinde hiçbir kontrol sahibi değildir.",
    dmca_main_highlight: "Animeria, Digital Millennium Copyright Act (DMCA) kapsamında bir <strong>\"aracı hizmet sağlayıcı\"</strong> (intermediary/indexer) statüsündedir. Sunucularımızda depolanan ve telif hakkınızı ihlal ettiğini düşündüğünüz herhangi bir içerik bulunmamaktadır. Embed bağlantılar için ilgili üçüncü taraf platformlara başvurmanızı öneririz.",
    dmca_how_title: "Platform Yapısı Nasıl Çalışır?",
    dmca_how_li1: "Anime meta verileri (başlık, poster, açıklama, bölüm bilgisi) kamuya açık <strong style=\"color:var(--text-primary);\">AniList API</strong>'si üzerinden çekilmektedir.",
    dmca_how_li2: "Video oynatıcılar, bağımsız üçüncü taraf sitelerden elde edilen <strong style=\"color:var(--text-primary);\">embed URL'leri</strong> ile yüklenmektedir.",
    dmca_how_li3: "Animeria sunucuları hiçbir zaman video akışına aracılık etmez; kullanıcı tarayıcısı doğrudan kaynak siteyle iletişim kurar.",
    dmca_how_li4: "Platformumuzda kullanıcı tarafından yüklenen herhangi bir içerik bulunmamaktadır.",
    dmca_takedown_title: "Bağlantı Kaldırma Talebi",
    dmca_takedown_p: "Bir embed bağlantısının telif hakkınızı ihlal ettiğini düşünüyorsanız, aşağıdaki bilgileri içeren bir talep ile bize ulaşabilirsiniz:",
    dmca_takedown_li1: "Hak sahibi olduğunuzu kanıtlayan bilgi veya belge",
    dmca_takedown_li2: "İhlal içerdiğini düşündüğünüz bağlantının tam URL'si",
    dmca_takedown_li3: "Orijinal esere ait bilgi (yapımcı, yayın tarihi vb.)",
    dmca_takedown_li4: "İletişim bilgileriniz (ad, e-posta)",
    dmca_takedown_note: "Geçerli talepler 72 saat içinde değerlendirilerek ilgili bağlantı platformdan kaldırılır.",
    dmca_disclaimer_title: "Sorumluluk Reddi Beyanı",
    dmca_disclaimer_p1: "Animeria, üçüncü taraf sitelerde yer alan içeriklerin yasallığından, doğruluğundan veya telif hakkı durumundan sorumlu değildir. Embed bağlantılar yalnızca teknik bir yönlendirme işlevi görür.",
    dmca_disclaimer_p2: "İçeriklerin gerçek kaynağına yönelik telif hakkı taleplerinin doğrudan ilgili barındırma platformuna iletilmesi gerekmektedir.",
    dmca_disclaimer_p3: "Tüm anime isimleri, görseller ve markalar ilgili hak sahiplerine aittir. Animeria bu isimleri yalnızca tanımlama amacıyla kullanmaktadır.",
    dmca_contact_title: "İletişim",
    dmca_contact_p: "DMCA bildirimleri ve telif hakkıyla ilgili diğer talepler için aşağıdaki kanallardan bize ulaşabilirsiniz:",
    dmca_contact_website: "Web Sitesi",
    dmca_contact_response: "Yanıt Süresi",
    dmca_contact_response_val: "72 saat içinde",
    dmca_contact_lang: "Dil",
    dmca_contact_lang_val: "Türkçe / İngilizce",
    dmca_contact_subject: "Konu Başlığı",
    dmca_legal_title: "Yasal Dayanak",
    dmca_legal_p1: "Bu politika, Amerika Birleşik Devletleri'nin <strong style=\"color:var(--text-primary);\">Digital Millennium Copyright Act (DMCA) — 17 U.S.C. § 512</strong> hükümleri ve Avrupa Birliği'nin <strong style=\"color:var(--text-primary);\">Direktif 2001/29/EC</strong> (Telif Hakkı Direktifi) çerçevesinde hazırlanmıştır.",
    dmca_legal_p2: "Animeria, bir içerik barındırma platformu değil; yalnızca kamuya açık kaynaklara yönlendirme yapan bir dizinleme ve arama hizmetidir. Bu statü, ilgili yasalar kapsamında \"aracı hizmet sağlayıcı\" (safe harbor) korumalarından yararlanma hakkı doğurur.",
    dmca_last_updated: "Son güncelleme: Ağustos 2026 • Bu politika önceden bildirim yapılmaksızın güncellenebilir."
  },
  en: {
    brand_title: "ANIMERIA",
    nav_home: "Home",
    nav_trending: "Trending",
    nav_top: "Top Rated",
    nav_browse: "Browse",
    nav_profile: "My Profile & Stats",
    nav_my_list: "My Watchlist",
    nav_import: "Import MAL & AniList",
    nav_login: "Sign In",
    nav_register: "Sign Up",
    nav_logout: "Sign Out",
    nav_search: "Search anime...",
    search_placeholder: "Search anime... (e.g. Naruto, Solo Leveling)",
    btn_watch_now: "Watch Now",
    btn_details: "Details",
    btn_watchlist: "Add to List",
    btn_in_watchlist: "In My List",
    btn_trailer: "Trailer",
    btn_play_ep1: "Play Episode 1",
    shelf_continue: "Continue Watching",
    shelf_continue_tag: "Pick up where you left off",
    shelf_trending: "Trending Now",
    shelf_trending_tag: "Popular This Week",
    shelf_popular: "All-Time Popular",
    shelf_popular_tag: "Popular",
    shelf_top: "Top Rated",
    shelf_top_tag: "Masterpieces",
    shelf_recent: "Latest Releases",
    shelf_recent_tag: "Fresh",
    browse_title: "Browse",
    browse_tag: "Filters",
    genre_all: "All",
    episodes: "Episodes",
    search_episodes_placeholder: "Search episode... (e.g. 12)",
    drawer_bookmarks_title: "My Watchlist",
    drawer_history_title: "Watch History",
    empty_bookmarks: "Your watchlist is currently empty.",
    empty_history: "Your watch history is currently empty.",
    server_hub_title: "Servers",
    subtitle_title: "Subtitles",
    audio_title: "Audio Format",
    audio_sub: "SUB (Original Audio)",
    audio_dub: "DUB (Dubbed)",
    skip_intro: "Skip Intro →",
    skip_outro: "Skip Outro →",
    sub_off: "Off",
    sub_softsub: " (Embedded / Softsub)",
    modal_synopsis: "Synopsis",
    modal_characters: "Characters & Voice Actors",
    modal_recommendations: "Recommended Anime",
    toast_bookmarked: "Added to watchlist",
    toast_removed: "Removed from watchlist",
    watch_order_title: "Franchise & Watch Order Timeline",
    watch_order_current: "CURRENTLY WATCHING",
    watch_order_next: "NEXT",
    watch_order_watched: "COMPLETED",
    footer_desc: "Ad-free and completely free anime streaming platform. Contact: <a href=\"https://fadimrak.xyz\" target=\"_blank\" style=\"color: #ffffff; text-decoration: underline;\">fadimrak.xyz</a>",

    // Auth Strings
    auth_title: "Sign In & Register",
    auth_subtitle: "Track your anime journey and sync your statistics.",
    auth_tab_login: "Sign In",
    auth_tab_register: "Register",
    auth_username_label: "Username",
    auth_username_placeholder: "Your username...",
    auth_email_label: "Email or Username",
    auth_email_register_label: "Email Address",
    auth_email_placeholder: "user@animeria.com or username",
    auth_email_register_placeholder: "user@animeria.com",
    auth_password_label: "Password",
    auth_password_placeholder: "••••••••",
    auth_btn_login: "Sign In",
    auth_btn_register: "Create Account",

    // Profile & Stats Strings
    profile_title: "My Profile & Watch Statistics",
    profile_edit_btn: "Edit Profile",
    profile_import_btn: "Import MAL / AniList",
    profile_guest_title: "Guest User",
    profile_guest_bio: "Track your anime journey and synchronize your watchlist.",
    stat_total_anime: "Watched Anime",
    stat_total_hours: "Hours",
    stat_total_days: "Days Total Watched",
    stat_total_episodes: "Total Episodes",
    stat_average_score: "Average Score",
    analytics_breakdown_title: "Watch Status Breakdown",
    analytics_genres_title: "Top Favorite Genres",
    status_all: "All",
    status_watching: "Watching",
    status_completed: "Completed",
    status_planning: "Plan to Watch",
    status_paused: "On-Hold",
    status_dropped: "Dropped",
    watchlist_search_placeholder: "Search in list...",
    btn_step_watch: "Watch",
    import_hub_title: "Import Watchlists",
    import_hub_tag: "Integration & Sync",
    import_anilist_title: "Import from AniList",
    import_anilist_desc: "Fetch all completed, watching and planned anime in 1 click.",
    import_anilist_placeholder: "e.g. animeexplorer",
    import_anilist_btn: "Sync & Import Watchlist",
    import_mal_title: "Import from MyAnimeList",
    import_mal_desc: "Transfer your MAL scores, episode progress and watch time.",
    import_mal_placeholder: "e.g. animefan",
    import_mal_btn: "Import from MyAnimeList",

    // Image Changer Modal
    img_modal_title: "Update Image",
    img_tab_url: "Image URL",
    img_tab_upload: "Upload File",
    img_tab_presets: "Preset Gallery",
    img_url_placeholder: "https://... direct image link",
    img_upload_label: "Select an image from your device (PNG, JPG, WebP)",
    img_save_btn: "Save Image",
    hover_change_avatar: "Change Avatar",
    hover_change_banner: "Change Banner",

    // Comments & Spoiler Strings
    comments_header_title: "Episode Comments",
    comments_rule_title: "Community & Spoiler Notice:",
    comments_rule_desc: "Posting comments that contain spoilers without checking the 'Contains spoilers' box is strictly prohibited. Violators will be permanently banned.",
    comments_input_placeholder: "What did you think of this episode? Share your thoughts...",
    comments_spoiler_checkbox: "Contains spoilers",
    comments_post_btn: "Post Comment",
    comments_login_prompt: "You must be signed in to leave a comment.",
    comments_login_btn: "Sign In to Comment",
    comments_empty: "No comments on this episode yet. Be the first to comment!",
    comments_spoiler_warning: "This comment contains spoilers.",
    comments_spoiler_reveal: "Click to reveal",
    comments_spoiler_hint: "⚠️ Spoiler Content — Click to reveal",
    comments_delete: "Delete",
    comments_like: "Like",
    pref_autoplay: "Autoplay",
    pref_autonext: "Auto Next",
    pref_autoskip: "Auto Skip Intro",
    time_just_now: "Just now",
    time_minutes_ago: "minutes ago",
    time_hours_ago: "hours ago",
    time_days_ago: "days ago",

    // DMCA Page
    dmca_badge: "Copyright & Legal Notice",
    dmca_title: "DMCA Policy",
    dmca_subtitle: "Animeria respects the intellectual property rights of third parties. This page provides information on content removal requests and the platform's legal standing.",
    dmca_back_btn: "Back to Home",
    dmca_main_title: "Animeria Does Not Host Any Video Content",
    dmca_main_p1: "Animeria does not store, upload, or distribute any video files, anime episodes, or media content on its own servers. Our platform functions solely as a <strong style=\"color: var(--text-primary);\">search and link aggregation engine</strong>.",
    dmca_main_p2: "All video players displayed on this site operate via <strong style=\"color: var(--text-primary);\">embed links</strong> sourced from independent third-party websites. These links redirect to external sources that host the content on their own infrastructure. Animeria has no control over those sources and cannot be held responsible for their content.",
    dmca_main_highlight: "Animeria operates as an <strong>\"intermediary service provider\"</strong> (indexer) under the Digital Millennium Copyright Act (DMCA). No content that could infringe your copyright is stored on our servers. For embedded content, we recommend reaching out directly to the respective third-party hosting platform.",
    dmca_how_title: "How Does the Platform Work?",
    dmca_how_li1: "Anime metadata (titles, posters, descriptions, episode info) is fetched from the publicly available <strong style=\"color:var(--text-primary);\">AniList API</strong>.",
    dmca_how_li2: "Video players are loaded via <strong style=\"color:var(--text-primary);\">embed URLs</strong> obtained from independent third-party sites.",
    dmca_how_li3: "Animeria's servers never proxy video streams; the user's browser communicates directly with the source site.",
    dmca_how_li4: "No user-uploaded content exists on this platform.",
    dmca_takedown_title: "Link Removal Request",
    dmca_takedown_p: "If you believe an embedded link infringes your copyright, you may contact us with a request containing the following information:",
    dmca_takedown_li1: "Evidence or documentation proving you are the rights holder",
    dmca_takedown_li2: "The full URL of the link you believe to be infringing",
    dmca_takedown_li3: "Information about the original work (producer, release date, etc.)",
    dmca_takedown_li4: "Your contact information (name, email)",
    dmca_takedown_note: "Valid requests will be reviewed within 72 hours and the relevant link will be removed from the platform.",
    dmca_disclaimer_title: "Disclaimer",
    dmca_disclaimer_p1: "Animeria is not responsible for the legality, accuracy, or copyright status of content on third-party sites. Embedded links serve solely as technical redirects.",
    dmca_disclaimer_p2: "Copyright claims regarding the actual source of content must be directed to the relevant hosting platform. Animeria has no authority over those platforms.",
    dmca_disclaimer_p3: "All anime names, visuals, and trademarks belong to their respective rights holders. Animeria uses these names solely for identification purposes and makes no commercial claim.",
    dmca_contact_title: "Contact",
    dmca_contact_p: "For DMCA notices and other copyright-related requests, you can reach us through the following channels:",
    dmca_contact_website: "Website",
    dmca_contact_response: "Response Time",
    dmca_contact_response_val: "Within 72 hours",
    dmca_contact_lang: "Language",
    dmca_contact_lang_val: "Turkish / English",
    dmca_contact_subject: "Subject",
    dmca_legal_title: "Legal Basis",
    dmca_legal_p1: "This policy has been prepared in accordance with the provisions of the <strong style=\"color:var(--text-primary);\">Digital Millennium Copyright Act (DMCA) — 17 U.S.C. § 512</strong> of the United States and the European Union's <strong style=\"color:var(--text-primary);\">Directive 2001/29/EC</strong> (Copyright Directive).",
    dmca_legal_p2: "Animeria is not a content hosting platform; it is an indexing and search service that redirects to publicly available sources. This status gives rise to eligibility for \"safe harbor\" protections under applicable laws.",
    dmca_last_updated: "Last updated: August 2026 • This policy may be updated without prior notice."
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem("animeria_lang") || "tr";
  }

  t(key) {
    return I18N_DICT[this.currentLang]?.[key] || I18N_DICT["tr"]?.[key] || key;
  }

  setLanguage(lang) {
    if (!["tr", "en"].includes(lang)) return;
    this.currentLang = lang;
    localStorage.setItem("animeria_lang", lang);
    this.updateDomTexts();
    window.dispatchEvent(new CustomEvent("animeria:lang-changed", { detail: { lang } }));
  }

  updateDomTexts() {
    // Update data-i18n elements
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = this.t(key);
      if (val && typeof val === "string" && val.includes("<") && val.includes(">")) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    // Update data-i18n-placeholder elements
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = this.t(key);
    });

    // Update data-i18n-title elements
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      el.title = this.t(key);
    });

    // Update active state in language toggle button
    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
      langBtn.innerHTML = this.currentLang === "tr" 
        ? `<span style="font-weight: 800;">TR</span> <span style="opacity: 0.4;">/ EN</span>`
        : `<span style="opacity: 0.4;">TR /</span> <span style="font-weight: 800;">EN</span>`;
    }
  }
}

window.I18n = new I18nManager();
