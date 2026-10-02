# 1.1 Faz 0 — JS ↔ native köprü testi (Mac)

Bu ortamda Xcode yok; aşağıdaki adımlar Mac'te elle yapılır.
Her adımın **beklenen** sonucu yazılı. Uymayan adımı not et, gerisine devam et.

## Hazırlık

```bash
git fetch origin && git checkout surum-1-1   # ya da Faz 0 dalı
npm ci
npx cap sync ios
npx cap open ios
```

Safari → Ayarlar → Gelişmiş → "Geliştirici menüsünü göster" açık olmalı.
iPhone'da: Ayarlar → Safari → Gelişmiş → Web Denetçisi açık olmalı.

## A. Derleme

1. Xcode'da **Product → Clean Build Folder**, sonra **Build** (⌘B).
   - Beklenen: uyarı olabilir, **hata yok**.
   - Özellikle `SifirlaViewController.swift` içindeki
     `registerPluginInstance(SifirlaZekaPlugin())` derlenmeli.

## B. Köprü — simülatörde (herhangi bir iOS, Apple Intelligence gerekmez)

2. iPhone 16/17 simülatöründe çalıştır (⌘R).
   - Beklenen Xcode konsolu: `[SifirlaZeka] eklenti yuklendi` (bir kez).
   - Uygulama normal açılır, "Yazarak ekle" alanı **görünmez** (1.0 kilidi açık değil).
3. Safari → Geliştir → [Simülatör] → `localhost` sayfasını seç; konsolda:
   ```js
   Object.keys(Capacitor.Plugins)
   ```
   - Beklenen: listede **`SifirlaZeka`** var (Preferences, Haptics … ile birlikte).
4. ```js
   Capacitor.isPluginAvailable("SifirlaZeka")
   ```
   - Beklenen: `true`
5. ```js
   await ZEKA.kopruTesti()
   ```
   - Beklenen: `{ tamam: true, eklenti: "SifirlaZeka", yanki: "sifirla-…", ios: "Version 26.x …", frameworkVar: true }`
   - Xcode konsolunda: `[SifirlaZeka] kopruTesti yanki=sifirla-…`
6. ```js
   await ZEKA.hazirla("tr")
   ```
   - Beklenen: bir nesne döner (**hata fırlatmaz**). Simülatörde tipik olarak
     `{ kullanilabilir: false, sebep: "cihazUygunDegil" }` ya da Mac'in Apple
     Intelligence durumuna göre `hazir` / `appleIntelligenceKapali` / `modelHazirDegil`.
   - Xcode konsolunda: `[SifirlaZeka] durum=…`
   - `sebep: "kopruYok"` veya `"hata"` gelirse **köprü hâlâ kopuk** → bana konsol çıktısını gönder.
7. ```js
   ZEKA.acik(true)
   ```
   - Beklenen: **`false`** (SURUM_1_0_KAPALI kilidi; köprü çalışsa da arayüz açılmaz).

## C. Model çağrıları — Apple Intelligence açık Mac/iPhone'da (iOS 26+)

Adım 6 `kullanilabilir: true` döndüyse:

8. ```js
   await ZEKA.borcAyristir("Mavi kartımda 37.500 TL borç var, aylık faiz 4,25, asgari 9.300 lira, ayın 15'i son ödeme")
   ```
   - Beklenen: `tur: "krediKarti"`, `bakiye: 37500`, `faiz: 4.25`, `faizBirimi: "aylik"`,
     `odeme: 9300`, `sonOdemeGunu: 15`. **Cümlede olmayan hiçbir sayı yok.**
9. ```js
   await ZEKA.raporAnlat("Ay: Ekim. Bu ay ödenen tutar: 12000 TL. Borcun azalma miktarı: 9500 TL. Faize giden: 2500 TL.")
   ```
   - Beklenen: `{ tamam: true, metin: "…" }` (metindeki her sayı girdide geçer)
     ya da `{ tamam: false, sebep: "uydurmaRakam" | "zamanAsimi" }` — ikisi de doğru davranış.
10. Uçak modunu aç, 8'i tekrarla. Beklenen: aynı sonuç (tamamen cihaz içi).

## D. Gerçek iPhone (Faz 0'ın kapanışı)

11. Gerçek cihazda B.2–B.7'yi tekrarla (Safari → Geliştir → [iPhone adı]).
12. iPhone 15 Pro öncesi cihaz varsa: adım 6 → `sebep: "cihazUygunDegil"`, uygulama normal.
13. Uygulamayı kapat/aç: veri duruyor, `[SifirlaZeka] eklenti yuklendi` yine bir kez.

## E. Gerileme (değişmemesi gerekenler)

14. Konsolda `Sıfırla motor öz-testleri: 24/24 geçti`.
15. Borç ekle, ödeme kaydet, uygulamayı kapat/aç → veri kalıcı (Preferences).
16. Bildirimler → "Test bildirimi gönder" hâlâ çalışıyor.
17. Android: `npx cap sync android` + derleme; uygulama açılır, `await ZEKA.kopruTesti()`
    → `{ tamam: false, sebep: "kopruYok" }` (Android'de eklenti yok, beklenen).

## Bana geri bildir

- A–E'de her adım için ✅ / ❌; ❌ olanlarda konsol çıktısı (Safari + Xcode).
- Adım 6'nın tam çıktısı (hangi `sebep`).
