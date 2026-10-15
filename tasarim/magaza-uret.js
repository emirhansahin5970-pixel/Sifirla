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
    ["Borcun ne zaman biter?", "Ne kadarını ödediğini ve borçsuz olacağın ayı tek bakışta gör."],
    ["Sadece asgari ödersen ne olur?", "İki yolu yan yana koy: kaç ay, ne kadar faiz, ne kadar fark."],
    ["Bu ay ne ödeyeceğin hazır", "Hangi borca ne kadar — plan her ay seni yönlendirir."],
    ["Borç borç kurtuluş yolu", "Hangisi ne zaman kapanacak, sıradaki hangisi — net."],
    ["Her ay raporun hazır", "Ne kadar ödedin, ne kadarı faize gitti, nasıl daha erken bitersin."],
    ["Verilerin telefonunda kalır", "Hesap yok, banka bağlantısı yok, izleme yok. Borç eklemek 30 saniye."]
  ],
  en: [
    ["When will your debt be gone?", "See how much you've paid and your debt-free month at a glance."],
    ["What if you only pay the minimum?", "Two paths side by side: how many months, how much interest."],
    ["This month's plan, ready", "Exactly how much to pay on each debt — every month."],
    ["Your payoff journey", "Which debt closes when, and what's up next."],
    ["Your monthly report", "What you paid, what went to interest, how to finish sooner."],
    ["Your data stays on your phone", "No account, no bank linking, no tracking. Add a debt in 30 seconds."]
  ]
}[DIL];

function ornekVeri(ay, dil) {
  const ad = dil === "en"
    ? ["Credit card", "Overdraft account", "Personal loan", "Store card"]
    : ["Kredi kartı", "Esnek hesap", "İhtiyaç kredisi", "Mağaza kartı"];
  return {
    schemaVersion: 6, dil, paraBirimi: "TRY", tema: "dark", yontem: "avalanche", ekstra: 2500, ad: "Deniz",
    referanslar: { kira: 15000, market: 8000, bilet: 450 },
    borclar: [
      { ad: ad[3], type: "revolving", balance: 0, annualRate: 45, payment: 800, initialBalance: 6500, payments: [{ tarih: ay + "-02", tutar: 1200 }], dueDay: 5 },
      { ad: ad[0], type: "revolving", balance: 38400, annualRate: 51, payment: 4900, initialBalance: 46000, payments: [{ tarih: ay + "-07", tutar: 3500 }], dueDay: 17 },
      { ad: ad[1], type: "revolving", balance: 14200, annualRate: 51, payment: 2900, initialBalance: 18000, payments: [{ tarih: ay + "-08", tutar: 1500 }], dueDay: 22, altTur: "kmh" },
      { ad: ad[2], type: "installment", balance: 27000, annualRate: 0, payment: 4500, initialBalance: 45000, payments: [], totalInstallments: 10, paidInstallments: 4, dueDay: 12 }
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
  const ham = [];
  const cek = async () => { const b = await s.screenshot(); ham.push(b); };

  await sekme("genel"); await kaydir("body", 0); await s.waitForTimeout(600); await cek();            // 1 ana panel
  await sekme("plan"); await kaydir("#ikiYolKart", DURUM_CUBUGU + 12); await cek();                    // 2 İki Yol
  await sekme("buay"); await kaydir("body", 0); await cek();                                           // 3 Bu Ay
  await sekme("genel"); await kaydir("#yolculuk", DURUM_CUBUGU + 70); await cek();                    // 4 Yolculuk
  await sekme("buay"); await s.click("#aylikRaporBtn"); await s.waitForTimeout(1800); await cek();     // 5 Aylık rapor
  await s.evaluate(() => { document.getElementById("raporOverlay").hidden = true; });
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
