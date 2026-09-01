# Sıfırla — tanıtım sitesi (`site/`)

Statik, tek dosyalık sayfalardan oluşan tanıtım sitesi. Build adımı yoktur;
dosyalar doğrudan tarayıcıda açılınca çalışır. Dış çağrı, font, CDN, analitik,
çerez veya izleyici içermez. Tüm yollar relatiftir → GitHub Pages ile uyumludur.

## Dosyalar
| Dosya | Amaç |
|-------|------|
| `index.html` | Tanıtım sayfası (TR + EN, açık/koyu tema) |
| `gizlilik.html` | Gizlilik politikası (TR) |
| `privacy.html` | Gizlilik politikası (EN) |
| `veri-silme.html` | Veri silme rehberi (TR) — mağaza "veri silme URL'si" alanı için |
| `data-deletion.html` | Veri silme rehberi (EN) |
| `404.html` | Sayfa bulunamadı |
| `CNAME` | Özel alan adı: `sifirla.app` |
| `robots.txt` · `sitemap.xml` | Arama motoru |
| `assets/ekran-1..4.svg` | Ekran görüntüsü **yer tutucuları** |
| `assets/og.svg` | Paylaşım görseli kaynağı (1200×630) |
| `assets/og.png` | Paylaşım görseli (1200×630, `og.svg`'den üretildi) |

## Doldurulması gereken yer tutucular
Tüm dosyalarda büyük harfle, aranabilir biçimde bırakıldı:

- `ILETISIM_EPOSTA` — iletişim e-posta adresi (footer + gizlilik + veri silme sayfaları)
- `UYGULAMA_LINKI` — yayınlanan uygulamanın (borc-plani.html) URL'si; hero'daki
  "Uygulamayı aç" butonu buraya gider
- `APP_STORE_LINKI` / `PLAY_STORE_LINKI` — mağaza linkleri (henüz yok; "Mağazadan
  indir" butonu şimdilik pasif, `index.html` içinde yorum satırında işaretli)

Hepsini bulmak için: `grep -rn "ILETISIM_EPOSTA\|UYGULAMA_LINKI\|APP_STORE_LINKI\|PLAY_STORE_LINKI" site/`

## Gerçek ekran görüntüleri
`assets/ekran-1..4.svg` dosyaları zarif yer tutuculardır. Gerçek görselleri
koymak için iki yol:
1. **En kolay:** `ekran-1.svg` … `ekran-4.svg` dosyalarının içeriğini gerçek
   ekran görüntüsüyle değiştir (PNG'yi `ekran-1.png` olarak kaydedip
   `index.html`'deki `src="assets/ekran-1.svg"` → `src="assets/ekran-1.png"` yap).
2. Telefon çerçevesi 320×680 oranındadır; bu orana yakın dikey görseller idealdir.

## Paylaşım görseli (og:image)
`assets/og.png` **üretildi** (1200×630, opak, alfa yok) — meta etiketleri buna
işaret eder. Sosyal platformlar çoğunlukla SVG og:image görüntülemez, bu yüzden
PNG şart; `og.svg` yalnızca kaynak dosyadır.

`og.svg`'yi değiştirirsen PNG'yi yeniden üret. macOS'ta ek araç kurmadan
(Quick Look kare tuval üretir, ortadan kırpılır):

```bash
qlmanage -t -s 1200 -o /tmp/og site/assets/og.svg && sips -c 630 1200 /tmp/og/og.svg.png --out site/assets/og.png
```

Kırpma sonrası kenarlarda saydam bant kalmadığını doğrula (alfa min/max = 255).
Araç kurabiliyorsan `rsvg-convert -w 1200 -h 630 assets/og.svg -o assets/og.png`
veya `inkscape assets/og.svg --export-type=png -w 1200 -h 630` da olur.

## GitHub Pages'te yayına alma
GitHub Pages yalnızca deponun **kökünden** veya **`/docs`** klasöründen yayın
yapar; rastgele bir `site/` klasöründen doğrudan yayınlamaz. Üç seçenek:

**A) `/docs` yöntemi (en basit):** `site/` klasörünü `docs/` olarak yeniden
adlandır → GitHub deposu → Settings → Pages → "Deploy from a branch" → Branch:
`main`, Folder: `/docs` → Save. `CNAME` zaten içeride olduğundan alan adı otomatik ayarlanır.

**B) GitHub Actions ile `site/`'ı yayınla:** `.github/workflows/pages.yml` ekle,
`actions/upload-pages-artifact` ile `path: site` yükle, `actions/deploy-pages`
ile yayınla. Settings → Pages → Source: "GitHub Actions" seç.

**C) Ayrı yayın dalı:** `site/` içeriğini bir `gh-pages` dalının köküne kopyala
ve Pages kaynağını o dal olarak ayarla.

Yayından sonra Settings → Pages'te **"Enforce HTTPS"** kutusunu işaretle.

## Namecheap'te `sifirla.app` → GitHub Pages DNS
Namecheap → Domain List → `sifirla.app` → **Manage** → **Advanced DNS**.
Mevcut çakışan A/CNAME kayıtlarını sil, şunları ekle:

**Apex (kök) alan için — 4 adet A kaydı (GitHub Pages IP'leri):**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | Automatic |
| A | @ | 185.199.109.153 | Automatic |
| A | @ | 185.199.110.153 | Automatic |
| A | @ | 185.199.111.153 | Automatic |

İsteğe bağlı IPv6 (AAAA): `2606:50c0:8000::153`, `...8001::153`, `...8002::153`, `...8003::153`.

**www alt alanı için — CNAME:**
| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | `<kullanıcı-adı>.github.io.` | Automatic |

(Not: Namecheap'in varsayılan "CNAME Record for www / URL Redirect" kaydını kaldır.)

Sonra GitHub → Settings → Pages → **Custom domain**: `sifirla.app` yazıp Save et
(zaten `CNAME` dosyası bunu ayarlar). DNS yayılması birkaç dakika–24 saat sürebilir;
ardından "Enforce HTTPS" aktifleşir.

`.app` uzantısı HSTS preload listesindedir → site **yalnızca HTTPS** üzerinden
açılır; GitHub'ın otomatik Let's Encrypt sertifikası bunu karşılar.
