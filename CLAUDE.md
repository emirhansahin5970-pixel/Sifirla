# Sıfırla

Borç kapatma planlayıcısı. **Çevrimdışı, sunucusuz, tüm veri cihazda kalır.**
Gizlilik ana ilkedir — pazarlama cümlesi değil, mimari kısıt. Hedef kitle:
Türkiye öncelikli, global ikincil (arayüz TR + EN).

Canlı: **https://sifirla.app** (GitHub Pages, `main` dalı, kökten yayın)

---

## Yapı

```
/                      → tanıtım sitesi (sifirla.app)
├─ index.html            tanıtım sayfası (TR + EN, açık/koyu tema)
├─ gizlilik · privacy · veri-silme · data-deletion · 404
├─ CNAME · .nojekyll · robots.txt · sitemap.xml
├─ assets/               og.png (1200×630) + ekran görüntüsü yer tutucuları
├─ uygulama/           → PWA, sifirla.app/uygulama/
│  ├─ index.html         UYGULAMANIN TAMAMI — tek dosya, ~9000 satır
│  ├─ manifest.webmanifest   start_url "." , scope "./"
│  ├─ sw.js              service worker, scope /uygulama/ (siteyi kapsamaz)
│  └─ icons/             192 · 512 · maskable · apple-touch · favicon · splash
├─ ios/                → Capacitor iOS projesi (Xcode, SPM)
├─ android/            → Capacitor Android projesi (Gradle)
├─ capacitor.config.json   appId app.sifirla · webDir "uygulama"
└─ YAYIN.md            yayın ve DNS rehberi
```

**Uygulama tek dosyadır.** Paketleyici (bundler), derleme adımı, framework yok.
`uygulama/index.html` doğrudan tarayıcıda açılır ve aynı dosya Capacitor ile
native pakete girer. Bu kasıtlıdır; bozmayın.

---

## Mimari — üç katman

`uygulama/index.html` içinde sırayla:

**1. MOTOR (`ENGINE`)** — saf hesaplama. Kartopu/çığ simülasyonu, aylık bileşik
faiz (revolving), taksitli sabit ödeme, KKDF/BSMV, `MAX_AY = 600`. İç faiz
birimi **yıllık nominal %**. DOM'a dokunmaz, depoya dokunmaz.
24 öz-test + `?dev=1` altında 6 senaryoluk elle hesaplanmış bilinen-cevap tablosu.

**2. DEPOLAMA (`DEPO` → `STORAGE`)** — iki katman:
- `DEPO`: senkron yüzlü soyutlama. **Native'de** `@capacitor/preferences`
  (iOS UserDefaults / Android SharedPreferences), **web'de** `localStorage`.
  Preferences asenkron olduğu için açılışta tüm anahtarlar belleğe okunur;
  okumalar senkron döner, yazmalar hem belleğe hem Preferences'a gider.
  Böylece 34 çağrı yerinin hiçbiri değişmedi.
- `STORAGE`: `borcPlanlayici.v1` anahtarı, **`schemaVersion` + `migrate()`**.
  Güncel şema **v5**. Eski sürüm yeni şemaya taşınır; bilinmeyen/gelecek
  sürümde veri **SİLİNMEZ** (`.gelecek` / `.bozuk` kopyaları alınır).

**3. ARAYÜZ (`ARAYUZ`)** — DOM, biçimlendirme, olaylar. IIFE değil: native'de
depo hazır olmadan başlamaz (dosya sonundaki açılış sırası).

Yardımcı modüller: `NATIF` (Capacitor köprüsü), `ZEKA` (yapay zeka, 1.0'da kapalı).

---

## Değişmez kurallar

Bunlar tercih değil, kısıt. Değiştirmeden önce sor.

- **Motor mantığı bozulmaz.** Hesaplama değişikliği öz-testlerle birlikte gelir.
  `selfTest()` 24/24 geçmeden hiçbir değişiklik kabul edilmez.
- **Hesap asla yapay zekada yapılmaz.** Model yalnızca (a) kullanıcının yazdığı
  cümleden alan çıkarır, (b) motorun hesapladığı sayıları cümleye döker.
- **Uydurma rakam yok.** Modelin döndürdüğü her sayı girdide geçiyor mu diye
  sınanır; geçmiyorsa alan boş bırakılır. Rapor anlatımında uydurma rakam
  varsa özet atılır, kural tabanlı şablona düşülür.
- **Dış çağrı yok.** Analitik, çerez, izleyici, CDN, dış font — hiçbiri.
  Gizlilik etiketi "Veri Toplanmıyor" olarak kalabilmeli.
- **`?pro=1` ve dev kısayolları canlıda ve native'de çalışmaz.**
  `yerelOrtamMi()` önce `DEPO.NATIVE`'i eler (Capacitor "localhost" hostname'i
  kullandığı için bu şart), sonra tam eşleşen yerel adlara bakar.
- **`prefers-reduced-motion`** her animasyonda gözetilir.
- **`Intl` ile `tr-TR`** biçimlendirme; para/tarih elle formatlanmaz.
- **360px** dar ekranda test edilmeden değişiklik bitmez.
- **Feragatname** her hesaplama yüzeyinde görünür kalır (finansal tavsiye değil).
- **Metin değişikliği TR + EN birlikte** yapılır (`SOZLUK`).
- **Her yayın öncesi** `uygulama/sw.js` içindeki `ONBELLEK` sürümü artırılır
  (şu an `sifirla-v7`), yoksa mevcut kullanıcılar eski dosyada kalır.

---

## Tamamlananlar

- **Motor:** 24 öz-test + 6 bilinen-cevap senaryosu; kartopu/çığ, bileşik faiz,
  taksit, KKDF/BSMV.
- **Sağlamlık:** girdi doğrulama (yumuşak onaylar, ilk hatalı alana odak),
  bozuk/gelecek-sürüm veri yedeklemesi, içe aktarma doğrulaması + geri alma,
  iki adımlı kalıcı sıfırlama, `tutarlilikKontrol()` bekçisi.
- **Özellikler:** ödeme kaydı + geçmiş, rehber Plan sekmesi (yöntem seçimi,
  senaryolar, ödeme takvimi), aylık rapor + paylaşılabilir PNG kart, ödeme
  serisi ısı haritası, rozetler, check-in, yedekleme (isteğe bağlı şifreli).
- **PWA:** manifest, service worker (stale-while-revalidate, sürümlü önbellek),
  10 ikon varlığı, safe-area, splash, "ana ekrana ekle" ipucu, çevrimdışı
  tam açılış (gerçek testle doğrulandı).
- **P0 güvenlik:** `?pro=1` açığı kapatıldı, `setPro()` tek yazma kapısı,
  yedek hatırlatma sistemi, "yakında" dili tutarlandı.
- **Yayın:** `sifirla.app` canlı, HTTPS zorunlu, `www` yönlendirmesi,
  `destek@` e-posta yönlendirmesi.
- **Capacitor:** iOS (simülatörde çalıştı, veri UserDefaults'ta doğrulandı) +
  Android (APK derlendi). Yerel bildirimler, haptics, durum çubuğu, Android
  geri tuşu, klavye.

---

## Kararlar

- **1.0 App Store'a ÜCRETSİZ ve yapay zekasız çıkacak.** Mağaza içi satın alma
  yok, Pro kilidi kapalı, ücretsiz borç sınırı uygulanmıyor
  (`PRO_SATIN_ALINABILIR = false`).
- **Yapay zeka 1.1'de gelecek, hibrit olarak:** cihazda Apple'ın modeli varsa
  (iOS 26+, Apple Intelligence açık, dil destekli) o kullanılır; yoksa güvenli
  bir bulut proxy'sine düşülür. Hibrit tasarımın gizlilik sonuçları 1.1'de
  ayrıca ele alınacak — bulut yolu açılırsa gizlilik politikası ve mağaza
  gizlilik etiketi güncellenmek zorunda.
- **Pro abonelik + ücretsiz deneme** 1.1 ile birlikte.
- **Jev kullanılmayacak.**

---

## Yarım kalanlar

- **Apple yapay zeka köprüsü — 1.1 Faz 0'da düzeltildi, Mac'te doğrulanmayı
  bekliyor.** Kök neden: Capacitor 8'de `bridge.registerPluginType(...)`,
  `autoRegisterPlugins` true iken (varsayılan) **hiçbir şey yapmadan döner**;
  eklenti hiç kaydedilmiyordu. Çözüm: `SifirlaViewController.capacitorDidLoad`
  içinde `registerPluginInstance(SifirlaZekaPlugin())`. Capacitor böylece
  `Capacitor.Plugins.SifirlaZeka` vekilini kendisi enjekte eder — npm paketi
  ya da `registerPlugin` gerekmez. JS tarafı (`ZEKA`) bu vekili kullanır.
  Teşhis: Web Inspector konsolunda `await ZEKA.kopruTesti()` (modelden
  bağımsız yankı). Test listesi: `ios/KOPRU-TEST.md`.
  Özellikler hâlâ **gizli** — `SURUM_1_0_KAPALI = true` 1.1'in güvenlik ve
  gizlilik fazları bitene kadar kalır.
- **Gerçek iPhone testi yapılmadı.** Titreşim ve planlı bildirimin gerçekten
  gelmesi hiç doğrulanmadı (simülatörde mümkün değil). Uygulamada bunun için
  "Test bildirimi gönder" düğmesi var (2 dakika sonrasına kurar).
- **Android gerçek cihazda/emulatörde çalıştırılmadı** — yalnızca APK derlendi.
- **Site ekran görüntüleri yok:** `assets/ekran-1..4.png` eksik, sayfa yer
  tutucuya düşüyor.
- **Mağaza linkleri boş:** `APP_STORE_LINKI` / `PLAY_STORE_LINKI`.

---

## Sıradaki işler

> 1.1 çalışmaları `surum-1-1` dalında; `main`'e dokunulmaz.

1. **Gerçek iPhone testi** — titreşim, bildirim izni, planlı bildirimin
   gelişi, çevrimdışı açılış, veri kalıcılığı, klavye, Dynamic Island.
2. **App Store ekran görüntüleri** (6.9" ve 6.5") + bunlardan 4 tanesi siteye.
   Örnek veri gerçekçi ama uydurma olduğu belli olmalı; gerçek banka adı
   kullanılmaz.
3. **App Store 1.0 gönderimi** — ücretsiz, yapay zekasız.
4. **1.1** — yapay zeka (hibrit), güvenlik katmanları, Pro abonelik + deneme.

---

## Çalışma alışkanlıkları

```bash
# Yerel sunucu
python3 -m http.server 8642
#   site      → http://localhost:8642/
#   uygulama  → http://localhost:8642/uygulama/
#   dev modu  → http://localhost:8642/uygulama/?dev=1   (bilinen-cevap tablosu)

# Native'e aktar (uygulama/index.html her değişikliğinden sonra)
npx cap sync

# iOS / Android aç
npx cap open ios
npx cap open android
```

- Her değişiklik tarayıcıda **360px dahil** canlı test edilir.
- Motor öz-testleri konsolda: `Sıfırla motor öz-testleri: 24/24 geçti`.
- Service worker `ignoreSearch` kullandığı için yerel testte eski dosya
  servis edilebilir; şüphelenince service worker'ı kaldırıp önbelleği temizle.
- Native tarafta JS konsolu os_log'a köprülenmez; teşhis için Safari Web
  Inspector gerekir.

---

## Depo kuralları

Bu depo **herkese açık**. Hiçbir dosyaya kişisel e-posta, gerçek ad, token,
şifre, imzalama anahtarı veya özel veri yazılmaz. Tek istisna, kamuya açık
iletişim adresi olan `destek@sifirla.app`'tir.
