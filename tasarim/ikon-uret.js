/*
 * Sıfırla — tüm ikon ve açılış (splash) görsellerini tek kaynaktan üretir.
 * Kaynak: tasarim/logo-ciz.js (SifirlaLogo.svg). Elle çizilmiş PNG yok;
 * logo değişirse bu betik yeniden çalıştırılır, çıktılar commit edilir.
 *
 *   node tasarim/ikon-uret.js
 *
 * Gereken: Playwright + Chromium (yalnızca geliştirme makinesinde; uygulama
 * paketine girmez, package.json bağımlılığı değildir).
 *
 * Açılış oranı: logo genişliği = 0.26 × uzun kenar. iOS (aspectFill) ve
 * Android (CENTER_CROP) splash'i ekranın uzun kenarına göre ölçekler; uygulama
 * içindeki giriş animasyonunun ilk karesi (GIRIS, --splash-oran) aynı oranı
 * kullanır — splash'ten animasyona geçiş piksel olarak kesintisizdir.
 */
"use strict";
const fs = require("fs");
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(process.env.PLAYWRIGHT_YOLU || "/opt/npm-tools/node_modules/playwright")); }
const L = require("./logo-ciz.js");

const KOK = path.join(__dirname, "..");
const ZEMIN = L.RENK.zemin;            // #0C1F3D — ikon, splash ve giriş animasyonu zemini
const SPLASH_ORAN = 0.26;

const yaz = (p) => { const t = path.join(KOK, p); fs.mkdirSync(path.dirname(t), { recursive: true }); return t; };

// PNG başlığından genişlik/yükseklik (IHDR: 16. bayttan itibaren iki 32-bit sayı)
function pngBoyut(dosya) {
  const b = fs.readFileSync(dosya);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

// Kare ikon: SVG tam tuvali doldurur
function kare(ops) { return L.svg(Object.assign({ zemin: "kare", etiket: false }, ops)); }

// Splash: düz lacivert zemin, logo ortada, genişlik = oran × uzun kenar
function splashHtml(w, h) {
  const lw = Math.round(SPLASH_ORAN * Math.max(w, h));
  const svg = L.svg({ etiket: false, id: "sp" });
  return `<html><body style="margin:0;width:${w}px;height:${h}px;background:${ZEMIN};display:flex;align-items:center;justify-content:center">` +
    `<div style="width:${lw}px">${svg.replace("<svg ", '<svg style="display:block;width:100%;height:auto;overflow:visible" ')}</div></body></html>`;
}

function ikonHtml(svg, n, seffaf) {
  return `<html><body style="margin:0;width:${n}px;height:${n}px;background:${seffaf ? "transparent" : ZEMIN}">` +
    svg.replace("<svg ", `<svg width="${n}" height="${n}" style="display:block" `) + "</body></html>";
}

async function main() {
  const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM_YOLU || undefined });
  const sayfa = await tarayici.newPage({ deviceScaleFactor: 1 });
  async function bas(html, w, h, dosya, seffaf) {
    await sayfa.setViewportSize({ width: w, height: h });
    await sayfa.setContent(html);
    await sayfa.screenshot({ path: yaz(dosya), omitBackground: !!seffaf, clip: { x: 0, y: 0, width: w, height: h } });
    console.log("✓", dosya, w + "×" + h);
  }
  const ikon = (svg, n, dosya, seffaf) => bas(ikonHtml(svg, n, seffaf), n, n, dosya, seffaf);

  // ---- iOS uygulama ikonu: açık + koyu + renklendirilmiş (iOS 18) ----
  const IOS = "ios/App/App/Assets.xcassets/AppIcon.appiconset/";
  await ikon(kare({ id: "ia" }), 1024, IOS + "AppIcon-512@2x.png");
  await ikon(kare({ id: "ik", mod: "koyu" }), 1024, IOS + "AppIcon-koyu.png", true);
  await ikon(kare({ id: "ir", mod: "renkli" }), 1024, IOS + "AppIcon-renkli.png");
  fs.writeFileSync(yaz(IOS + "Contents.json"), JSON.stringify({
    images: [
      { filename: "AppIcon-512@2x.png", idiom: "universal", platform: "ios", size: "1024x1024" },
      { appearances: [{ appearance: "luminosity", value: "dark" }], filename: "AppIcon-koyu.png", idiom: "universal", platform: "ios", size: "1024x1024" },
      { appearances: [{ appearance: "luminosity", value: "tinted" }], filename: "AppIcon-renkli.png", idiom: "universal", platform: "ios", size: "1024x1024" }
    ],
    info: { author: "xcode", version: 1 }
  }, null, 2) + "\n");

  // ---- iOS splash (açık/koyu aynı: lacivert) ----
  const SP = "ios/App/App/Assets.xcassets/Splash.imageset/";
  for (const ad of ["Default@1x~universal~anyany", "Default@2x~universal~anyany", "Default@3x~universal~anyany"]) {
    await bas(splashHtml(2732, 2732), 2732, 2732, SP + ad + ".png");
    fs.copyFileSync(yaz(SP + ad + ".png"), yaz(SP + ad + "-dark.png"));
  }
  for (const ad of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
    fs.copyFileSync(yaz(SP + "Default@1x~universal~anyany.png"), yaz(SP + ad));
  }

  // ---- PWA ----
  const PW = "uygulama/icons/";
  await ikon(kare({ id: "p5" }), 512, PW + "ikon-512.png");
  await ikon(kare({ id: "p1" }), 192, PW + "ikon-192.png");
  await ikon(kare({ id: "pa" }), 180, PW + "apple-touch-icon-180.png");
  // maskable: güvenli bölge daire çapı %80 → işaret ~%62 genişlikte
  await ikon(kare({ id: "m5", olcek: 0.62 }), 512, PW + "maskable-512.png");
  await ikon(kare({ id: "m1", olcek: 0.62 }), 192, PW + "maskable-192.png");
  // favicon: 16/32 px'de geniş hap incelir → kare zeminli küçük varyant, işaret daha büyük
  const fav = kare({ id: "fv", kucuk: true, olcek: 0.9 });
  await ikon(fav, 32, PW + "favicon-32.png");
  fs.writeFileSync(yaz(PW + "favicon.svg"), fav.replace(/var\(--logo-[a-z-]+,(#[0-9A-Fa-f]{3,8})\)/g, "$1") + "\n");
  for (const [w, h] of [[1170, 2532], [1179, 2556], [1290, 2796]]) await bas(splashHtml(w, h), w, h, PW + `splash-${w}x${h}.png`);
  fs.copyFileSync(yaz(PW + "ikon-192.png"), yaz("uygulama/ikon-192.png"));
  fs.copyFileSync(yaz(PW + "ikon-512.png"), yaz("uygulama/ikon-512.png"));
  fs.copyFileSync(yaz(PW + "apple-touch-icon-180.png"), yaz("uygulama/apple-touch-icon.png"));

  // ---- Android ----
  const RES = "android/app/src/main/res/";
  const yogunluk = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, n] of Object.entries(yogunluk)) {
    await ikon(kare({ id: "a" + d }), n, RES + `mipmap-${d}/ic_launcher.png`);
    await ikon(kare({ id: "r" + d, olcek: 0.68 }), n, RES + `mipmap-${d}/ic_launcher_round.png`);
    // uyarlanır ikon: ön katman %16.7 içeriden; güvenli daireye sığması için işaret %80
    await ikon(kare({ id: "f" + d, seffaf: true, olcek: 0.8 }), n, RES + `mipmap-${d}/ic_launcher_foreground.png`, true);
    await bas(`<html><body style="margin:0;background:${ZEMIN}"></body></html>`, n, n, RES + `mipmap-${d}/ic_launcher_background.png`);
  }
  const splashlar = fs.readdirSync(path.join(KOK, RES)).filter((d) => d.startsWith("drawable"))
    .filter((d) => fs.existsSync(path.join(KOK, RES, d, "splash.png")));
  for (const d of splashlar) {
    const boyut = pngBoyut(path.join(KOK, RES, d, "splash.png"));
    await bas(splashHtml(boyut[0], boyut[1]), boyut[0], boyut[1], RES + d + "/splash.png");
  }

  // ---- @capacitor/assets kaynakları (gelecekte o araç kullanılırsa aynı sonuç) ----
  await ikon(kare({ id: "s1" }), 1024, "assets/icon.png");
  await ikon(kare({ id: "s2", seffaf: true, olcek: 0.8 }), 1024, "assets/icon-foreground.png", true);
  await bas(`<html><body style="margin:0;background:${ZEMIN}"></body></html>`, 1024, 1024, "assets/icon-background.png");
  await bas(splashHtml(2732, 2732), 2732, 2732, "assets/splash.png");
  fs.copyFileSync(yaz("assets/splash.png"), yaz("assets/splash-dark.png"));

  await tarayici.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
