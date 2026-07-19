# Sıfırla

*Borcunu sıfırla.* Tamamen çevrimdışı, sunucusuz, tek HTML dosyalık borç kapatma
planlayıcısı (TR/EN).

Borçlarını gir (kredi kartı/KMH veya taksitli kredi); deterministik simülasyon
motoru **kartopu** (en küçük bakiye önce) ve **çığ** (en yüksek faiz önce)
stratejilerini ay ay simüle eder — aylık bileşik faiz, opsiyonel KKDF+BSMV,
biten borcun ödemesi bütçeye devrolur.

## İlkeler

- **Verin cihazından çıkmaz.** Tüm veri `localStorage`'dadır; hiçbir dış çağrı,
  CDN, font veya görsel yoktur.
- **Dürüstlük:** yapılamayan şey vaat edilmez (bildirimler yalnızca sayfa
  açıkken garanti edilir).
- Gerçek AI yoktur; öneriler kural tabanlıdır.

## Kullanım

`borc-plani.html` dosyasını tarayıcıda aç — hepsi bu. PWA olarak da kurulabilir
(ana ekrana ekle → çevrimdışı çalışır).

Geliştirme için:

```bash
python3 -m http.server 8642
# http://localhost:8642/borc-plani.html  (localhost'ta canlı yenileme açıktır)
```

- `?widget=1` — tam ekran geri sayım modu
- `?dev=1` — bilinen-cevap doğrulama tablosu

## Testler

Motor öz-testleri sayfadaki "Daha" sekmesinden veya başsız olarak
`.claude/agents/test-runner.md` içindeki Node komutuyla çalıştırılır.
