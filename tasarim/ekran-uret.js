/*
 * Sıfırla — tanıtım sitesi (ve ileride mağaza) için uygulama ekran görüntüleri.
 * Uygulamanın kendisi örnek veriyle açılır ve gerçek ekranlar çekilir; elle
 * çizilmiş sahte ekran yok. Örnek veri gerçekçi ama uydurma olduğu belli:
 * gerçek banka adı kullanılmaz.
 *
 *   node tasarim/ekran-uret.js            → assets/ekran-1..4.jpg (TR)
 *   node tasarim/ekran-uret.js en         → assets/ekran-1..4-en.jpg
 *
 * Gereken: Playwright + Chromium ve yerel sunucu (python3 -m http.server 8642).
 */
"use strict";
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(process.env.PLAYWRIGHT_YOLU || "/opt/npm-tools/node_modules/playwright")); }

const KOK = path.join(__dirname, "..");
const DIL = process.argv[2] === "en" ? "en" : "tr";
const EK = DIL === "en" ? "-en" : "";
const ADRES = process.env.ADRES || "http://localhost:8642/uygulama/";
const W = 390, H = 844; // iPhone 15/16 mantıksal boyutu; site kartı 360×780 ile aynı oran

function ornekVeri(ay, dil) {
  const ad = dil === "en"
    ? ["Credit card", "Overdraft account", "Personal loan", "Store card"]
    : ["Kredi kartı", "Esnek hesap", "İhtiyaç kredisi", "Mağaza kartı"];
  return {
    schemaVersion: 6, dil, paraBirimi: "TRY", tema: "dark", yontem: "avalanche", ekstra: 2500,
    ad: dil === "en" ? "Deniz" : "Deniz",
    referanslar: { kira: 15000, market: 8000, bilet: 450 },
    borclar: [
      { ad: ad[3], type: "revolving", balance: 0, annualRate: 45, payment: 800, initialBalance: 6500, payments: [{ tarih: ay + "-02", tutar: 1200 }], dueDay: 5 },
      { ad: ad[0], type: "revolving", balance: 38400, annualRate: 51, payment: 4900, initialBalance: 46000, payments: [{ tarih: ay + "-07", tutar: 3500 }], dueDay: 17 },
      { ad: ad[1], type: "revolving", balance: 14200, annualRate: 51, payment: 2900, initialBalance: 18000, payments: [{ tarih: ay + "-08", tutar: 1500 }], dueDay: 22, altTur: "kmh" },
      { ad: ad[2], type: "installment", balance: 27000, annualRate: 0, payment: 4500, initialBalance: 45000, payments: [], totalInstallments: 10, paidInstallments: 4, dueDay: 12 }
    ]
  };
}

async function main() {
  const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM_YOLU || undefined });
  const ctx = await tarayici.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: "dark" });
  const sayfa = await ctx.newPage();
  const ay = new Date().toISOString().slice(0, 7);
  await sayfa.addInitScript(([veri]) => {
    localStorage.setItem("borcPlanlayici.gorduByte", "1");
    localStorage.setItem("borcPlanlayici.ikiYolAn", "1");
    localStorage.setItem("borcPlanlayici.kurulumRed", "1");
    localStorage.setItem("borcPlanlayici.v1", JSON.stringify(veri));
  }, [ornekVeri(ay, DIL)]);
  await sayfa.goto(ADRES);
  await sayfa.waitForTimeout(1200);
  // Ekran görüntüsünde telefonun durum çubuğu payı + açılır pencereler kapalı
  await sayfa.addStyleTag({ content: "body{padding-top:calc(24px + 50px)!important} .kurulum-ipucu,#bildirimSerit{display:none!important}" });
  await sayfa.evaluate(() => document.querySelectorAll("[role=dialog]").forEach((x) => { x.hidden = true; }));

  const sekme = async (ad) => {
    await sayfa.evaluate((ad) => { const b = document.querySelector(`.alt-nav button[data-sekme="${ad}"]`); if (b) b.click(); }, ad);
    await sayfa.waitForTimeout(700);
    await sayfa.evaluate(() => document.querySelectorAll("[role=dialog]").forEach((x) => { x.hidden = true; }));
  };
  const kaydir = async (secici, pay) => {
    await sayfa.evaluate(([s, p]) => { const e = document.querySelector(s); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - p); }, [secici, pay]);
    await sayfa.waitForTimeout(1300); // sayaç animasyonları otursun
  };
  const cek = async (n) => {
    const dosya = path.join(KOK, "assets", `ekran-${n}${EK}.jpg`);
    await sayfa.screenshot({ path: dosya, type: "jpeg", quality: 86 });
    console.log("✓", path.relative(KOK, dosya));
  };

  await sekme("genel"); await kaydir("body", 0); await sayfa.waitForTimeout(600); await cek(1);   // ilerleme halkası + bu ay
  await sekme("plan"); await kaydir("#ikiYolKart", 70); await cek(2);                               // İki Yol
  await sekme("buay"); await kaydir("body", 0); await cek(3);                                        // Bu ay ne ödeyeceğim
  await sekme("genel"); await kaydir("#yolculuk", 140); await cek(4);                               // Kurtuluş yolculuğu
  await tarayici.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
