/*
 * Sıfırla — yeni tanıtım sitesi için uygulama ekranları (açık "Gümüş" tema).
 * Uygulamanın KENDİSİ örnek veriyle açılır ve gerçek ekranlar çekilir; sahte ekran yok.
 * Örnek veri uydurma olduğu belli: gerçek banka adı kullanılmaz.
 *
 *   node tasarim/site-ekran-uret.js       → assets/site/tr/1..6.jpg
 *   node tasarim/site-ekran-uret.js en    → assets/site/en/1..6.jpg
 *
 * Gereken: Playwright + Chromium, yerel sunucu (python3 -m http.server 8642).
 */
"use strict";
const fs = require("fs");
const path = require("path");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(process.env.PLAYWRIGHT_YOLU || "/opt/npm-tools/node_modules/playwright")); }

const KOK = path.join(__dirname, "..");
const DIL = process.argv[2] === "en" ? "en" : "tr";
const ADRES = process.env.ADRES || "http://localhost:8642/uygulama/";
const CIKIS = path.join(KOK, "assets", "site", DIL);
const W = 390, H = 844, OLCEK = 2;
const DURUM = 54; // durum çubuğu payı (site telefon çerçevesindeki ada bu alana oturur)

function ornekVeri(ay, dil) {
  const en = dil === "en", f = en ? 0.25 : 1, r = (x) => Math.round(x * f);
  const ad = en
    ? ["Credit card", "Line of credit", "Personal loan", "Store card"]
    : ["Kredi kartı", "Esnek hesap", "İhtiyaç kredisi", "Mağaza kartı"];
  const kartF = en ? 24 : 51, magazaF = en ? 27 : 45;
  return {
    schemaVersion: 6, dil, paraBirimi: en ? "USD" : "TRY", tema: "light", yontem: "avalanche", ekstra: r(2500), ad: "Deniz",
    denemeKarsilamaGoruldu: true, maasGunu: 15,
    ayarlar: en ? { vergiUygula: false } : undefined,
    yedek: { alindiMs: Date.now(), kartKapatildi: true, acilisHatirlatildi: true },
    referanslar: { kira: r(15000), market: r(8000), bilet: r(450) },
    borclar: [
      { ad: ad[3], type: "revolving", balance: 0, annualRate: magazaF, payment: r(800), initialBalance: r(6500), payments: [{ tarih: ay + "-02", tutar: r(1200) }], dueDay: 5 },
      { ad: ad[0], type: "revolving", balance: r(38400), annualRate: kartF, payment: r(4900), initialBalance: r(46000), payments: [{ tarih: ay + "-07", tutar: r(4900) }], dueDay: 17, altTur: "kart", eklenmeMs: Date.now() - 120 * 864e5 },
      { ad: ad[1], type: "revolving", balance: r(14200), annualRate: kartF, payment: r(2900), initialBalance: r(18000), payments: [{ tarih: ay + "-08", tutar: r(2900) }], dueDay: 22, altTur: "kmh", eklenmeMs: Date.now() - 120 * 864e5 },
      { ad: ad[2], type: "installment", balance: r(27000), annualRate: 0, payment: r(4500), initialBalance: r(45000), payments: [{ tarih: ay + "-12", tutar: r(4500) }], totalInstallments: 10, paidInstallments: 4, dueDay: 12, eklenmeMs: Date.now() - 120 * 864e5 }
    ]
  };
}

async function main() {
  fs.mkdirSync(CIKIS, { recursive: true });
  const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM_YOLU || undefined });
  const ctx = await tarayici.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: OLCEK, colorScheme: "light", reducedMotion: "reduce" });
  const s = await ctx.newPage();
  const ay = new Date().toISOString().slice(0, 7);
  await s.addInitScript(([veri]) => {
    localStorage.setItem("borcPlanlayici.gorduByte", "1");
    localStorage.setItem("borcPlanlayici.ikiYolAn", "1");
    localStorage.setItem("borcPlanlayici.kurulumRed", "1");
    localStorage.setItem("borcPlanlayici.v1", JSON.stringify(veri));
    const n = new Date(), k = (i) => { const d = new Date(n.getFullYear(), n.getMonth() - i, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
    const aylik = {}; [[5, 112000], [4, 106500], [3, 101200], [2, 95300], [1, 89900]].forEach(([i, v]) => { aylik[k(i)] = Math.round(v * (veri.paraBirimi === "USD" ? 0.25 : 1)); });
    localStorage.setItem("borcPlanlayici.rozet.v1", JSON.stringify({ aylik, checkin: {} }));
  }, [ornekVeri(ay, DIL)]);
  await s.goto(ADRES);
  await s.waitForTimeout(1300);
  await s.addStyleTag({ content: `body{padding-top:calc(10px + ${DURUM}px)!important} .kurulum-ipucu,#bildirimSerit{display:none!important}` });
  const kapat = () => s.evaluate(() => document.querySelectorAll("[role=dialog]").forEach((x) => { if (x.id !== "sihirbaz") x.hidden = true; }));
  await kapat();
  const sekme = async (ad) => {
    await s.evaluate((ad) => { const b = document.querySelector(`.alt-nav button[data-sekme="${ad}"]`); if (b) b.click(); }, ad);
    await s.waitForTimeout(700); await kapat();
  };
  const kaydir = async (q, p) => {
    await s.evaluate(([q, p]) => { const e = document.querySelector(q); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - p); }, [q, p]);
    await s.waitForTimeout(1400);
  };
  await s.evaluate(() => { window.aracAcTest = (id) => { const d = document.querySelector(`[data-arac-ac="${id}"]`); if (d && !document.getElementById(id).classList.contains("arac-acik")) d.click(); }; });
  let n = 0;
  const cek = async () => {
    n++;
    const dosya = path.join(CIKIS, n + ".jpg");
    await s.screenshot({ path: dosya, type: "jpeg", quality: 82 });
    console.log("✓", path.relative(KOK, dosya));
  };

  await sekme("genel"); await kaydir("body", 0); await s.waitForTimeout(600); await cek();           // 1 ana panel
  await sekme("genel"); await kaydir("#degisimKart", DURUM + 8); await cek();                        // 2 borç değişimi
  await sekme("plan"); await s.evaluate(() => aracAcTest("ikiYolKart")); await s.waitForTimeout(500);
  await kaydir("#ikiYolKart", DURUM + 8); await cek();                                                // 3 İki Yol
  await sekme("buay"); await kaydir("body", 0); await cek();                                          // 4 Bu Ay
  await sekme("plan"); await s.evaluate(() => aracAcTest("kdKart")); await s.waitForTimeout(500);
  for (const k of ["kahve", "kahve", "siparis", "siparis"]) { await s.click(`[data-kd-artir="${k}"]`).catch(() => {}); await s.waitForTimeout(200); }
  await kaydir("#kdKart", DURUM + 8); await cek();                                                    // 5 Küçük değişiklik
  await sekme("borclar"); await s.click("#sekme-borclar .borcEkleGit"); await s.waitForTimeout(900); await cek(); // 6 Borç ekle
  await tarayici.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
