/*
 * Sıfırla — App Store ekran görüntüleri (6.9" iPhone, 1320×2868).
 *
 *   node tasarim/magaza-uret.js        → magaza/tr/01..06.png
 *   node tasarim/magaza-uret.js en     → magaza/en/01..06.png
 *
 * İki aşama:
 *  1) Uygulamanın KENDİSİ örnek veriyle açılır, iPhone 16 Pro Max mantıksal
 *     boyutunda (440×956, 3x) gerçek ekranlar çekilir — sahte ekran yok.
 *  2) Her ekran, marka zemininde başlık + telefon çerçevesi içine yerleştirilir.
 * Örnek veri uydurma olduğu belli: gerçek banka adı kullanılmaz.
 * Gereken: Playwright + Chromium, Inter yazı tipi, yerel sunucu (python3 -m http.server 8642).
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
const CIKIS = path.join(KOK, "magaza", DIL);
const W = 440, H = 956, OLCEK = 3;             // iPhone 16 Pro Max mantıksal ekranı
const GW = 1320, GH = 2868;                     // App Store 6.9" görsel boyutu
const DURUM_CUBUGU = 62;                        // Dynamic Island payı (mantıksal px)

const METIN = {
  tr: [
    ["Borcun ne zaman biter?", "Ne kadarını ödediğini, borçsuz olacağın ayı ve sıradaki adımını tek bakışta gör."],
    ["Borcun eriyor mu, büyüyor mu?", "Ödeme, faiz ve harcama tek grafikte. Sağlık puanın her gün güncel."],
    ["Sadece asgari ödersen ne olur?", "İki yolu yan yana koy: kaç ay, ne kadar faiz, ne kadar fark."],
    ["Bu ay ne ödeyeceğin hazır", "Hangi borca ne kadar, maaşından önce gelen vadeler — hepsi bir ekranda."],
    ["Kahveden kıs, borcun erisin", "Küçük değişikliklerin borcunu kaç ay erken bitirdiğini gör."],
    ["Verilerin telefonunda kalır", "Hesap yok, banka bağlantısı yok, izleme yok. Tamamen ücretsiz."]
  ],
  en: [
    ["When will your debt be gone?", "See what you've paid, your debt-free month and your next step at a glance."],
    ["Is your debt melting or growing?", "Payments, interest and spending in one chart. Your health score, updated daily."],
    ["What if you only pay the minimum?", "Two paths side by side: how many months, how much interest."],
    ["This month's plan, ready", "How much to pay on each debt, and due dates before payday — one screen."],
    ["Skip a coffee, melt your debt", "See how many months small changes take off your debt."],
    ["Your data stays on your phone", "No account, no bank linking, no tracking. Completely free."]
  ]
}[DIL];

function ornekVeri(ay, dil) {
  // TR: Türk lirası ve TR faizleri; EN: ABD doları, ABD'ye uygun tutar ve faizler (uydurma örnek)
  const en = dil === "en", f = en ? 0.25 : 1, r = (x) => Math.round(x * f);
  const ad = en
    ? ["Credit card", "Line of credit", "Personal loan", "Store card"]
    : ["Kredi kartı", "Esnek hesap", "İhtiyaç kredisi", "Mağaza kartı"];
  const kartF = en ? 24 : 51, magazaF = en ? 27 : 45;
  return {
    schemaVersion: 6, dil, paraBirimi: en ? "USD" : "TRY", tema: "dark", yontem: "avalanche", ekstra: r(2500), ad: "Deniz",
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

// Telefon durum çubuğu (saat + sinyal + pil), ekranın üstüne çizilir
const DURUM_SVG = `<div style="position:absolute;left:0;right:0;top:0;height:${DURUM_CUBUGU}px;background:linear-gradient(#0A1220 70%,rgba(10,18,32,.0));display:flex;align-items:center;justify-content:space-between;padding:0 38px 0 50px;font:600 17px/1 Inter,system-ui;color:#fff;z-index:5">
  <span>9:41</span>
  <span style="display:flex;gap:7px;align-items:center">
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5l2.4-2.9a3.6 3.6 0 0 0-4.8 0z M8 2.2c2.4 0 4.6.9 6.2 2.5l1.3-1.5A10.6 10.6 0 0 0 8 0 10.6 10.6 0 0 0 .5 3.2l1.3 1.5A8.6 8.6 0 0 1 8 2.2z M8 5.9c1.4 0 2.7.5 3.7 1.4l1.3-1.5A7.6 7.6 0 0 0 8 3.9a7.6 7.6 0 0 0-5 1.9l1.3 1.5c1-.9 2.3-1.4 3.7-1.4z" fill="#fff"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" opacity=".45"/><rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/><rect x="24.5" y="4.5" width="1.6" height="4" rx=".8" fill="#fff" opacity=".45"/></svg>
  </span></div>`;

async function main() {
  fs.mkdirSync(CIKIS, { recursive: true });
  const tarayici = await chromium.launch({ executablePath: process.env.CHROMIUM_YOLU || undefined });

  // ---- 1) Gerçek uygulama ekranları ----
  const ctx = await tarayici.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: OLCEK, colorScheme: "dark" });
  const s = await ctx.newPage();
  const ay = new Date().toISOString().slice(0, 7);
  await s.addInitScript(([veri]) => {
    localStorage.setItem("borcPlanlayici.gorduByte", "1");
    localStorage.setItem("borcPlanlayici.ikiYolAn", "1");
    localStorage.setItem("borcPlanlayici.kurulumRed", "1");
    localStorage.setItem("borcPlanlayici.v1", JSON.stringify(veri));
    // Geçmiş aylar (grafik için): toplam borç her ay biraz eriyor
    const n = new Date(), k = (i) => { const d = new Date(n.getFullYear(), n.getMonth() - i, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
    const aylik = {}; [[5, 112000], [4, 106500], [3, 101200], [2, 95300], [1, 89900]].forEach(([i, v]) => { aylik[k(i)] = Math.round(v * (veri.paraBirimi === "USD" ? 0.25 : 1)); });
    localStorage.setItem("borcPlanlayici.rozet.v1", JSON.stringify({ aylik, checkin: {} }));
  }, [ornekVeri(ay, DIL)]);
  await s.goto(ADRES);
  await s.waitForTimeout(1300);
  await s.addStyleTag({ content: `body{padding-top:calc(16px + ${DURUM_CUBUGU}px)!important} .kurulum-ipucu,#bildirimSerit{display:none!important}` });
  const kapat = () => s.evaluate(() => document.querySelectorAll("[role=dialog]").forEach((x) => { if (x.id !== "raporOverlay" && x.id !== "sihirbaz") x.hidden = true; }));
  await kapat();
  const sekme = async (ad) => {
    await s.evaluate((ad) => { const b = document.querySelector(`.alt-nav button[data-sekme="${ad}"]`); if (b) b.click(); }, ad);
    await s.waitForTimeout(700); await kapat();
  };
  const kaydir = async (secici, pay) => {
    await s.evaluate(([q, p]) => { const e = document.querySelector(q); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - p); }, [secici, pay]);
    await s.waitForTimeout(1400);
  };
  await s.evaluate(() => { window.aracAcTest = (id) => { const d = document.querySelector(`[data-arac-ac="${id}"]`); if (d && !document.getElementById(id).classList.contains("arac-acik")) d.click(); }; });
  const ham = [];
  const cek = async () => { const b = await s.screenshot(); ham.push(b); };

  await sekme("genel"); await kaydir("body", 0); await s.waitForTimeout(600); await cek();            // 1 ana panel
  await sekme("genel"); await kaydir("#degisimKart", DURUM_CUBUGU + 12); await cek();                 // 2 borç değişimi
  await sekme("plan"); await s.evaluate(() => aracAcTest("ikiYolKart")); await s.waitForTimeout(500);
  await kaydir("#ikiYolKart", DURUM_CUBUGU + 12); await cek();                                         // 3 İki Yol
  await sekme("buay"); await kaydir("body", 0); await cek();                                           // 4 Bu Ay
  await sekme("plan"); await s.evaluate(() => aracAcTest("kdKart")); await s.waitForTimeout(500);
  for (const k of ["siparis", "siparis", "taksi", "taksi"]) { await s.click(`[data-kd-artir="${k}"]`).catch(() => {}); await s.waitForTimeout(200); }
  await kaydir("#kdKart", DURUM_CUBUGU + 12); await cek();                                             // 5 Küçük değişiklik
  await sekme("borclar"); await s.click("#sekme-borclar .borcEkleGit"); await s.waitForTimeout(900); await cek(); // 6 Borç ekle
  await ctx.close();

  // ---- 2) Mağaza karesi: zemin + başlık + telefon çerçevesi ----
  const sayfa = await tarayici.newPage({ viewport: { width: GW, height: GH }, deviceScaleFactor: 1 });
  const CW = 900;                                    // ekran genişliği (çerçeve içi)
  const CH = Math.round(CW * H / W);
  for (let i = 0; i < ham.length; i++) {
    const [baslik, alt] = METIN[i];
    const img = "data:image/png;base64," + ham[i].toString("base64");
    const html = `<html><head><style>
      *{box-sizing:border-box} body{margin:0;width:${GW}px;height:${GH}px;overflow:hidden;font-family:Inter,"Inter Display",system-ui,sans-serif;
        background:radial-gradient(80% 45% at 20% 8%,#1C3866 0%,transparent 70%),radial-gradient(70% 40% at 95% 98%,#2B2A58 0%,transparent 70%),#0C1F3D;color:#EEF2F7}
      .ust{position:absolute;left:0;right:0;top:150px;text-align:center;padding:0 110px}
      h1{margin:0;font-size:98px;font-weight:800;letter-spacing:-0.03em;line-height:1.06}
      p{margin:30px auto 0;max-width:1060px;font-size:44px;line-height:1.38;color:#AEC0D6;font-weight:500}
      .tel{position:absolute;left:50%;top:${GH - CH - 52 - 96}px;transform:translateX(-50%);width:${CW + 52}px;height:${CH + 52}px;border-radius:136px;
        background:linear-gradient(145deg,#9A9CA1,#E6E7E9 35%,#7D7F84 70%,#C9CACD);padding:26px;box-shadow:0 60px 120px -30px rgba(0,0,0,.65)}
      .ekran{position:relative;width:${CW}px;height:${CH}px;border-radius:112px;overflow:hidden;background:#0A1220}
      .ekran img{display:block;width:100%;height:100%}
      .ada{position:absolute;top:30px;left:50%;transform:translateX(-50%);width:258px;height:76px;border-radius:38px;background:#000;z-index:6}
      .durum{position:absolute;inset:0 0 auto 0;transform:scale(${CW / W});transform-origin:0 0;width:${W}px}
    </style></head><body>
      <div class="ust"><h1>${baslik}</h1><p>${alt}</p></div>
      <div class="tel"><div class="ekran"><img src="${img}"><div class="durum">${DURUM_SVG}</div><div class="ada"></div></div></div>
    </body></html>`;
    await sayfa.setContent(html);
    await sayfa.waitForTimeout(150);
    const dosya = path.join(CIKIS, String(i + 1).padStart(2, "0") + ".png");
    await sayfa.screenshot({ path: dosya, clip: { x: 0, y: 0, width: GW, height: GH } });
    console.log("✓", path.relative(KOK, dosya));
  }
  await tarayici.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
