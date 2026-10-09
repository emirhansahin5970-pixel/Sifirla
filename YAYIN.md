# Sıfırla — yayın rehberi

Statik proje; build adımı yoktur. Dış çağrı, font, CDN, analitik, çerez veya
izleyici içermez. Tüm yollar relatiftir → GitHub Pages ile uyumludur.

## Depo yapısı (yayınlanan kök = `sifirla.app`)

| Yol | Amaç |
|-----|------|
| `index.html` | Tanıtım sayfası (TR + EN, açık/koyu tema) |
| `gizlilik.html` · `privacy.html` | Gizlilik politikası (TR / EN) |
| `veri-silme.html` · `data-deletion.html` | Veri silme rehberi — mağaza "veri silme URL'si" alanı için |
| `404.html` | Sayfa bulunamadı |
| `CNAME` | Özel alan adı: `sifirla.app` |
| `.nojekyll` | Jekyll işlemesini kapatır (nokta/alt çizgiyle başlayan yollar yenmesin) |
| `robots.txt` · `sitemap.xml` | Arama motoru |
| `assets/og.png` · `og.svg` | Paylaşım görseli (1200×630) ve kaynağı |
| `assets/ekran-placeholder.svg` | Ekran görüntüsü yer tutucusu |
| **`uygulama/`** | **PWA'nın tamamı → `sifirla.app/uygulama/`** |
| `uygulama/index.html` | Uygulama (tek dosya) |
| `uygulama/manifest.webmanifest` | `start_url "."`, `scope "./"` → `/uygulama/` |
| `uygulama/sw.js` | Service worker; scope `/uygulama/` |
| `uygulama/icons/` | 192 · 512 · maskable · apple-touch 180 · favicon · splash |

Uygulama kendi klasöründe kapalı bir ada: service worker scope'u `/uygulama/`
olduğu için tanıtım sitesini **kapsamaz** — site sayfaları hep ağdan taze gelir,
uygulama çevrimdışı çalışır.

## Doldurulmuş yer tutucular
- `ILETISIM_EPOSTA` → `destek@sifirla.app` (footer + gizlilik + veri silme sayfaları)
- `UYGULAMA_LINKI` → `./uygulama/` (hero'daki "Uygulamayı aç")

Kalan: `APP_STORE_LINKI` / `PLAY_STORE_LINKI` — mağaza linkleri henüz yok;
"Mağazadan indir" butonu pasif, `index.html` içinde yorum satırında işaretli.

## Gerçek ekran görüntüleri
`index.html` içindeki telefon çerçeveleri `assets/ekran-1..4.png` bekler; dosya
yoksa `assets/ekran-placeholder.svg`'ye düşer (konsola bir uyarı yazar, sayfa
bozulmaz). Çerçeve 320×680 oranındadır; bu orana yakın dikey görseller idealdir.

## Paylaşım görseli (og:image)
`assets/og.png` üretildi (1200×630, opak, alfa yok) — meta etiketleri buna
işaret eder. Sosyal platformlar çoğunlukla SVG og:image görüntülemez; `og.svg`
yalnızca kaynak dosyadır. Değiştirirsen PNG'yi yeniden üret (macOS, ek araç yok):

```bash
qlmanage -t -s 1200 -o /tmp/og assets/og.svg && sips -c 630 1200 /tmp/og/og.svg.png --out assets/og.png
```

Kırpma sonrası kenarlarda saydam bant kalmadığını doğrula (alfa min/max = 255).

## GitHub Pages
Settings → Pages → Source: **Deploy from a branch** → Branch: `main`,
Folder: **`/ (root)`** → Save. `CNAME` dosyası kökte olduğu için özel alan adı
kendiliğinden dolar. Ardından **Enforce HTTPS** kutusunu işaretle.

## Namecheap DNS — `sifirla.app` → GitHub Pages
Namecheap → Domain List → `sifirla.app` → **Manage** → **Advanced DNS**.
Mevcut çakışan A/CNAME/URL Redirect kayıtlarını sil, şunları ekle:

**Apex (kök) — 4 adet A kaydı:**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | Automatic |
| A | @ | 185.199.109.153 | Automatic |
| A | @ | 185.199.110.153 | Automatic |
| A | @ | 185.199.111.153 | Automatic |

İsteğe bağlı IPv6 (AAAA): `2606:50c0:8000::153`, `...8001::153`, `...8002::153`, `...8003::153`.

**www alt alanı — CNAME:**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | `<kullanıcı-adı>.github.io.` | Automatic |

Namecheap'in varsayılan "CNAME Record for www / URL Redirect" kaydını kaldır.

`.app` uzantısı HSTS preload listesindedir → site **yalnızca HTTPS** üzerinden
açılır; GitHub'ın otomatik Let's Encrypt sertifikası bunu karşılar.

## Her yayın öncesi
1. `uygulama/sw.js` içindeki `ONBELLEK` sürümünü artır (`sifirla-vN` → `vN+1`).
   Yapılmazsa mevcut kullanıcılar eski sürümde kalır.
2. Yerel test: `python3 -m http.server 8642` → `http://localhost:8642/uygulama/`
   Konsolda "motor öz-testleri: N/N geçti" satırını gör.
3. `git add -A && git commit && git push` → Pages 1–2 dakikada yayına alır.
4. **App Store paketi öncesi:** `uygulama/test-ayar.js` (test telefonu Pro anahtarı)
   SİLİNMİŞ olmalı, sonra `npx cap sync ios`. Uygulamada kırmızı "TEST · Pro"
   etiketi görünüyorsa paket GÖNDERİLMEZ.

## Yerel geliştirme
```bash
python3 -m http.server 8642
```
- Site: `http://localhost:8642/`
- Uygulama: `http://localhost:8642/uygulama/`
- Geliştirici modu: `http://localhost:8642/uygulama/?dev=1` (bilinen-cevap tablosu)
- Pro test kilidi: `?pro=1` — **yalnızca localhost'ta** çalışır, canlıda yoktur.
