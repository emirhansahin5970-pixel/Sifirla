/*
 * Sıfırla logosu — tek kaynak SVG üreticisi.
 *
 * Geometri, onaylanan 2048 px görselden ölçülüp temizlendi; tüm koordinatlar
 * işaretin merkezine (0,0) göre. Hap 1584×680, "0" ile yuva iç kenara eşit
 * (43) uzaklıkta, tuş tam ortada, yuvanın sol ucu tuşun köşesiyle eş merkezli
 * (33 boşluk) bir yayla kesilir. Renkler CSS değişkenine bağlı; değişken
 * tanımlı değilse ölçülen değerlere düşer.
 *
 *   SifirlaLogo.svg({ zemin, kucuk, tek, mod, boyut, id })
 *     zemin : "kare" (uygulama ikonu, köşesiz, kenara taşan lacivert)
 *             "hap"  (zeminsiz ama hap içi lacivert dolu — Gümüş tema)
 *             yok    (zeminsiz sembol)
 *     kucuk : 29–48 px için sadeleştirilmiş çizgiler (iç çizgi + tuş kabartması yok)
 *     tek   : tek renk siluet (Android bildirim / iOS renklendirilmiş maske), renk=currentColor
 *     seffaf: kare tuval ama zemin çizilmez (Android ön katmanı)
 *     mod   : "koyu" (iOS koyu ikon: şeffaf zemin), "renkli" (iOS tinted: gri tonlu)
 *     olcek : işaretin kare içindeki genişlik oranı (varsayılan 0.773 = görseldeki oran)
 */
(function (kok) {
  "use strict";

  var G = {
    tuval: 2048,
    hap: { w: 1584, h: 680, bant: 52, ic: 8 },          // dış hap, gümüş bant, koyu iç çizgi
    sifir: { cx: -496, rx: 201, ry: 240, irx: 98, iry: 156 },
    tus: { yari: 207, r: 78, yuz: 29, yr: 50 },          // 414 kare, iç yüz 29 içeride
    ok: { kalin: 44, yari: 123.5, kol: 80 },
    yuva: { ust: 240, bant: 44, sag: 697, bosluk: 33 }
  };

  var RENK = {
    zemin: "#0C1F3D",
    gumusKenar: "#9C9DA0",
    gumusOrta: "#E6E7E9",
    gumusIc: "#6B6C70",
    gumusAlt: "#97989A",
    gumusUst: "#DEDFE1",
    sampanyaKenar: "#D3B48E",
    sampanyaOrta: "#FBE4BF"
  };

  function v(ad, yedek) { return "var(--logo-" + ad + "," + yedek + ")"; }

  // Süper-elips benzeri "0": yazı karakterinin hafif köşeli ovali (ölçümde
  // saf elipsten ~%4 dolgun). k = 0.60 (elips için 0.5523).
  function oval(cx, rx, ry, ters) {
    var k = 0.60, kx = rx * k, ky = ry * k;
    var d = "M" + cx + "," + (-ry) +
      "C" + (cx + kx) + "," + (-ry) + " " + (cx + rx) + "," + (-ky) + " " + (cx + rx) + ",0" +
      "C" + (cx + rx) + "," + ky + " " + (cx + kx) + "," + ry + " " + cx + "," + ry +
      "C" + (cx - kx) + "," + ry + " " + (cx - rx) + "," + ky + " " + (cx - rx) + ",0" +
      "C" + (cx - rx) + "," + (-ky) + " " + (cx - kx) + "," + (-ry) + " " + cx + "," + (-ry) + "Z";
    if (!ters) return d;
    // iç boşluk ters yönde çizilir (evenodd'a gerek kalmasın)
    return "M" + cx + "," + (-ry) +
      "C" + (cx - kx) + "," + (-ry) + " " + (cx - rx) + "," + (-ky) + " " + (cx - rx) + ",0" +
      "C" + (cx - rx) + "," + ky + " " + (cx - kx) + "," + ry + " " + cx + "," + ry +
      "C" + (cx + kx) + "," + ry + " " + (cx + rx) + "," + ky + " " + (cx + rx) + ",0" +
      "C" + (cx + rx) + "," + (-ky) + " " + (cx + kx) + "," + (-ry) + " " + cx + "," + (-ry) + "Z";
  }

  function yuvarDik(x, y, w, h, r) {
    return "M" + (x + r) + "," + y + "H" + (x + w - r) + "A" + r + "," + r + " 0 0 1 " + (x + w) + "," + (y + r) +
      "V" + (y + h - r) + "A" + r + "," + r + " 0 0 1 " + (x + w - r) + "," + (y + h) +
      "H" + (x + r) + "A" + r + "," + r + " 0 0 1 " + x + "," + (y + h - r) +
      "V" + (y + r) + "A" + r + "," + r + " 0 0 1 " + (x + r) + "," + y + "Z";
  }

  function yol(o) {
    var s = o.kucuk ? 1.25 : 1;                         // küçükte çizgiler kalınlaşır
    var hap = G.hap, bant = hap.bant * s;
    var y = G.yuva, yb = y.bant * s;
    var t = G.tus, ok = G.ok;
    var r = {};

    // Hap bandı (dış − iç), tek parça dolgu
    var dw = hap.w / 2, dh = hap.h / 2;
    r.hapDis = yuvarDik(-dw, -dh, hap.w, hap.h, dh);
    r.hapIc = yuvarDik(-dw + bant, -dh + bant, hap.w - 2 * bant, hap.h - 2 * bant, dh - bant);
    r.hapBant = r.hapDis + " " + tersYon(-dw + bant, -dh + bant, hap.w - 2 * bant, hap.h - 2 * bant, dh - bant);
    var ic = hap.ic;
    r.hapCizgi = yuvarDik(-dw + bant, -dh + bant, hap.w - 2 * bant, hap.h - 2 * bant, dh - bant) + " " +
      tersYon(-dw + bant + ic, -dh + bant + ic, hap.w - 2 * (bant + ic), hap.h - 2 * (bant + ic), dh - bant - ic);

    // "0"
    var z = G.sifir, zi = o.kucuk ? { rx: z.irx - 14, ry: z.iry - 12 } : { rx: z.irx, ry: z.iry };
    r.sifir = oval(z.cx, z.rx, z.ry) + " " + oval(z.cx, zi.rx, zi.ry, true);

    // Tuş
    r.tus = yuvarDik(-t.yari, -t.yari, 2 * t.yari, 2 * t.yari, t.r);
    r.tusYuz = yuvarDik(-t.yari + t.yuz, -t.yari + t.yuz, 2 * (t.yari - t.yuz), 2 * (t.yari - t.yuz), t.yr);

    // ← ok: 45° kollu, sivri (miter) uç, kesik (butt) bitiş; tuşa göre tam ortalı
    var kk = ok.kalin * (o.kucuk ? 1.2 : 1), ap = -ok.yari + kk / 2 * Math.SQRT2;
    r.okKalin = kk;
    r.ok = "M" + (ap + ok.kol) + "," + (-ok.kol) + "L" + ap + ",0L" + (ap + ok.kol) + "," + ok.kol +
      "M" + ap + ",0H" + ok.yari;

    // Yuva: sağda yarım daire, solda tuşun sağ köşesiyle eş merkezli yayla kesilmiş bant
    var cx = y.sag - y.ust, R = y.ust, ri = y.ust - yb;
    var kc = t.yari - t.r, KR = t.r + y.bosluk;           // tuş köşesi merkezi (kc,±kc), kesme yarıçapı
    var xUst = kc + Math.sqrt(Math.max(0, KR * KR - (R - kc) * (R - kc)));
    var xAlt = kc + Math.sqrt(Math.max(0, KR * KR - (ri - kc) * (ri - kc)));
    var f = function (n) { return Math.round(n * 10) / 10; };
    r.yuva = "M" + f(xUst) + "," + (-R) + "H" + cx + "A" + R + "," + R + " 0 0 1 " + cx + "," + R +
      "H" + f(xUst) + "A" + KR + "," + KR + " 0 0 0 " + f(xAlt) + "," + ri +
      "H" + cx + "A" + ri + "," + ri + " 0 0 0 " + cx + "," + (-ri) +
      "H" + f(xAlt) + "A" + KR + "," + KR + " 0 0 0 " + f(xUst) + "," + (-R) + "Z";
    return r;
  }

  function tersYon(x, y, w, h, r) {
    return "M" + (x + r) + "," + y + "A" + r + "," + r + " 0 0 0 " + x + "," + (y + r) +
      "V" + (y + h - r) + "A" + r + "," + r + " 0 0 0 " + (x + r) + "," + (y + h) +
      "H" + (x + w - r) + "A" + r + "," + r + " 0 0 0 " + (x + w) + "," + (y + h - r) +
      "V" + (y + r) + "A" + r + "," + r + " 0 0 0 " + (x + w - r) + "," + y + "Z";
  }

  var sayac = 0;

  function svg(o) {
    o = o || {};
    var id = o.id || ("sl" + (++sayac));
    var p = yol(o);
    var kare = o.zemin === "kare";
    var olcek = o.olcek || 0.773;                        // görseldeki 1582/2048
    var genislik = G.hap.w;
    // Kare: 2048 tuval, işaret ortada; değilse işarete sıkı viewBox
    var vb, donus = "";
    if (kare) {
      var k = genislik / olcek;                          // tuval kenarı (işaret birimi)
      vb = (-k / 2) + " " + (-k / 2) + " " + k + " " + k;
    } else {
      var p2 = 6;
      vb = (-G.hap.w / 2 - p2) + " " + (-G.hap.h / 2 - p2) + " " + (G.hap.w + 2 * p2) + " " + (G.hap.h + 2 * p2);
    }
    var etiket = o.etiket === false ? ' aria-hidden="true"' : ' role="img" aria-label="' + (o.etiket || "Sıfırla") + '"';
    var boyut = o.boyut ? ' width="' + o.boyut + '" height="' + (kare ? o.boyut : Math.round(o.boyut * (G.hap.h + 12) / (G.hap.w + 12))) + '"' : "";
    var bas = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' + boyut + etiket + (o.sinif ? ' class="' + o.sinif + '"' : "") + ">";

    if (o.tek) {
      // Tek renk siluet: hap bandı, "0", tuş (ok oyulmuş), yuva. Saydam zemin.
      var mid = id + "m";
      var g = '<defs><mask id="' + mid + '" maskUnits="userSpaceOnUse" x="-1200" y="-1200" width="2400" height="2400">' +
        '<rect x="-1200" y="-1200" width="2400" height="2400" fill="#fff"/>' +
        '<path d="' + p.ok + '" fill="none" stroke="#000" stroke-width="' + p.okKalin + '" stroke-linejoin="miter" stroke-miterlimit="4"/></mask></defs>' +
        '<g fill="currentColor">' + (kare && o.tekZemin ? '<rect x="-2000" y="-2000" width="4000" height="4000" fill="' + o.tekZemin + '"/>' : "") +
        '<path d="' + p.hapBant + '"/><path d="' + p.sifir + '"/>' +
        '<path d="' + p.tus + '" mask="url(#' + mid + ')"/><path d="' + p.yuva + '"/></g>';
      return bas + g + "</svg>";
    }

    var renkli = o.mod === "renkli";                    // iOS tinted: gri tonlu
    var c = renkli ? {
      zemin: "#000", ge: "#8A8A8A", go: "#F2F2F2", gi: "#4A4A4A", ga: "#7A7A7A", gu: "#E0E0E0",
      se: "#BDBDBD", so: "#FFFFFF", ok: "#000"
    } : {
      zemin: v("zemin", RENK.zemin), ge: v("gumus-kenar", RENK.gumusKenar), go: v("gumus-orta", RENK.gumusOrta),
      gi: v("gumus-ic", RENK.gumusIc), ga: v("gumus-alt", RENK.gumusAlt), gu: v("gumus-ust", RENK.gumusUst),
      se: v("sampanya-kenar", RENK.sampanyaKenar), so: v("sampanya-orta", RENK.sampanyaOrta),
      ok: v("ok", RENK.zemin)
    };
    if (o.mod === "koyu") c.ok = "#0B0B0D";

    function dogru(ad, a, b, x1, x2, tepe) {
      return '<linearGradient id="' + id + ad + '" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="0" x2="' + x2 + '" y2="0">' +
        '<stop offset="0" style="stop-color:' + a + '"/><stop offset="' + (tepe || 0.5) + '" style="stop-color:' + b + '"/>' +
        '<stop offset="1" style="stop-color:' + a + '"/></linearGradient>';
    }
    var t = G.tus, z = G.sifir, y = G.yuva;
    var defs = "<defs>" +
      dogru("h", c.ge, c.go, -G.hap.w / 2, G.hap.w / 2, 0.52) +
      dogru("s", c.se, c.so, z.cx - z.rx, z.cx + z.rx, 0.47) +
      dogru("t", c.ge, c.go, -t.yari + t.yuz, t.yari - t.yuz, 0.5) +
      dogru("y", c.ge, c.go, 129, y.sag, 0.6) +
      '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" style="stop-color:' + c.gu + '"/><stop offset="0.5" style="stop-color:' + c.go + '"/><stop offset="1" style="stop-color:' + c.ga + '"/></linearGradient>' +
      "</defs>";

    var govde = "";
    if (kare && o.mod !== "koyu" && !o.seffaf) govde += '<rect x="-2000" y="-2000" width="4000" height="4000" style="fill:' + c.zemin + '"/>';
    if (o.zemin === "hap") govde += '<path d="' + p.hapDis + '" style="fill:' + c.zemin + '"/>';
    govde += '<path d="' + p.hapBant + '" fill="url(#' + id + 'h)"/>';
    if (!o.kucuk) govde += '<path d="' + p.hapCizgi + '" style="fill:' + c.gi + '"/>';
    govde += '<path class="logo-sifir" d="' + p.sifir + '" fill="url(#' + id + 's)"/>';
    govde += '<g class="logo-tus">';
    if (o.kucuk) {
      govde += '<path d="' + p.tus + '" fill="url(#' + id + 't)"/>';
    } else {
      govde += '<path d="' + p.tus + '" fill="url(#' + id + 'r)"/>' +
        '<path d="' + p.tusYuz + '" fill="url(#' + id + 't)"/>';
    }
    govde += '<path class="logo-ok" d="' + p.ok + '" fill="none" style="stroke:' + c.ok + '" stroke-width="' + p.okKalin + '" stroke-linejoin="miter" stroke-miterlimit="4"/></g>';
    govde += '<path class="logo-yuva" d="' + p.yuva + '" fill="url(#' + id + 'y)"/>';
    return bas + defs + govde + "</svg>";
  }

  kok.SifirlaLogo = { svg: svg, yol: yol, G: G, RENK: RENK };
  if (typeof module !== "undefined") module.exports = kok.SifirlaLogo;
})(typeof window !== "undefined" ? window : globalThis);
