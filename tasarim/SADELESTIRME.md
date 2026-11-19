# Sıfırla — Sadeleştirme tasarımı (19 Kasım 2026)

## Sorun
Özellikler tek tek doğru ama hepsi ayrı kartlar olarak alt alta dizildi:
Genel'de 12 kart, Plan'da 17 kart. Aynı bilgi (borç ne durumda?) beş farklı
görselle anlatılıyor (halka, geri sayım, zaman makinesi, yolculuk, değişim
grafiği). Borçla bunalmış biri için bu, ikinci bir yük.

## İlke
**Her sekme tek bir soruya cevap verir. Ekranda yalnızca o sorunun cevabı
durur; geri kalan her şey "Araçlar"da, istenince açılır.** Özellik silinmez,
yeri belli olur.

| Sekme   | Soru                    | Görünür olanlar |
|---------|-------------------------|-----------------|
| Genel   | Nasıl gidiyorum?        | Tek uyarı şeridi · Halka · Sıradaki adımın · Borcun nasıl değişiyor · (ay sonunda) Karne |
| Bu Ay   | Bu ay ne yapmalıyım?    | Bu ayın özeti · Ödeme listesi · Maaş günü · Kumbara · Zor ay yardımı · Check-in |
| Borçlar | Neyim var?              | Liste + borç detayı (harcama, eşitle, hareketler) — değişmedi |
| Plan    | Nasıl kapatırım?        | Ödeme yöntemin (Sıfırla önersin / Kendi planım) · Ödeme planı · Plan özeti · Ödeme takvimi · **Araçlar** |
| Daha    | Ayarlar                 | Ayarlar · **Hatırlatmalar** (Genel'den taşındı) · Faiz/vergi · Yedek · … |

## Genel = tek panel
1. **Uyarı şeridi:** en önemli tek uyarı görünür; varsa "+N uyarı daha" ile açılır.
2. **Halka:** ilerleme (değişmedi).
3. **Sıradaki adımın:** bugün yapman gereken tek şey + Öde; altında tek satır
   "Ödeme planın: Sıfırla önerisi / kendi tutarların · Değiştir".
4. **Borcun nasıl değişiyor:** sağlık puanı + bu ay eridi/büyüdü + grafik + tek uyarı.
   Ayrıntılı döküm kapalı ("Bu ayın dökümü"), borç büyüdüyse açık gelir.
5. **Karne:** yalnız ayın son 2 / ilk 7 günü.

Genel'den çıkanlar → Plan › Araçlar: Önlenen faizin karşılığı, Zaman makinesi,
Kurtuluş yolculuğu, Küçük değişiklik, Hamleler. Geri sayım yalnız widget modunda.

## Plan › Araçlar
Kart yığını yerine **döşeme ızgarası** (2 sütun). Bir döşemeye dokununca yalnız
o araç açılır, diğeri kapanır. Uygulanamayan araç (ör. tek borçta yapılandırma)
döşemede görünmez.

Araçlar: Hamleler · Küçük değişiklik · İki Yol · Hedef · Yöntem karşılaştırma ·
Şunu yaparsan · Yapılandırma · Tasarruf modu · Faiz sızıntısı · Erime eğrisi ·
Ya kartı kesersem · Kurtuluş yolculuğu · Zaman makinesi · Önlenen faizin
karşılığı · Ödeme serisi · Rozetler · Başarı kartı.

## Teknik
- Bölümler yerinden taşınır; kimlikler (id) değişmez → çizim kodu aynen çalışır.
- Araçlar: `#aracAlan > .arac` — `.arac-acik` olmayan gizli; döşemeler
  `aracIzgaraCiz()` ile her çizimde yeniden üretilir (yalnız `hidden` olmayanlar).
- Kumbara kendi kartına (`#kumbaraKart`) ayrılır, Bu Ay'a gider.
- Widget modu bozulmaz: `#geriSayimKart` Genel'de kalır, normalde CSS ile gizli.
