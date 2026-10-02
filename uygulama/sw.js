/* Sıfırla — service worker (PWA).
   1) Çevrimdışı: uygulama kabuğu kurulumda önbelleğe alınır. Strateji
      STALE-WHILE-REVALIDATE'tir: yanıt ANINDA önbellekten gelir (internetsiz
      tam açılış), aynı anda arka planda ağdan tazelenir — yeni sürüm bir
      sonraki açılışta hazırdır (skipWaiting + clients.claim).
   2) Sürümlü önbellek: ad değişince eski önbellekler activate'te silinir.
   3) SW yalnızca KENDİ origin'inin GET isteklerini yönetir; dış çağrı yok.
   4) Bildirim gösterimi/tıklaması: kilit ekranı denemeleri için (garanti yok;
      güvenilir kaynak uygulama içindeki panodur). */

const ONBELLEK = "sifirla-v7"; // sürüm: her yayında artır — eskiler temizlenir
const KABUK = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/ikon-192.png",
  "./icons/ikon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon-180.png",
  "./icons/favicon-32.png",
  "./icons/favicon.svg",
  "./icons/splash-1170x2532.png",
  "./icons/splash-1179x2556.png",
  "./icons/splash-1290x2796.png",
  "./apple-touch-icon.png",
  "./ikon-192.png",
  "./ikon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(ONBELLEK)
      // Tek dosya patlarsa kurulum çökmesin: her kabuk dosyası ayrı denenir
      .then((c) => Promise.allSettled(KABUK.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((adlar) => Promise.all(adlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

/* Stale-while-revalidate: önbellek varsa ANINDA dön, arka planda tazele.
   Önbellekte yoksa ağdan al ve önbelleğe koy; ağ da yoksa gezinmelerde
   uygulama kabuğuna (index.html) düş. Sorgu dizisi (?widget=1, ?dev=1)
   önbellek eşleşmesinde yok sayılır. */
self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET" || new URL(istek.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(istek, { ignoreSearch: true }).then((onbellekten) => {
      const tazele = fetch(istek)
        .then((yanit) => {
          if (yanit && yanit.ok) {
            const kopya = yanit.clone();
            caches.open(ONBELLEK).then((c) => c.put(istek, kopya)).catch(() => { /* kota vb. */ });
          }
          return yanit;
        })
        .catch(() => null);
      if (onbellekten) {
        e.waitUntil(tazele); // arka planda güncelle; kullanıcı beklemez
        return onbellekten;
      }
      return tazele.then((yanit) =>
        yanit || (istek.mode === "navigate"
          ? caches.match("./index.html", { ignoreSearch: true })
          : Response.error())
      );
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) =>
      ws.length ? ws[0].focus() : self.clients.openWindow("./")
    )
  );
});
