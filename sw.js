/* Sıfırla — isteğe bağlı service worker.
   1) Çevrimdışı önbellek: uygulama kabuğu kurulumda önbelleğe alınır; istekler
      önce ağdan denenir (güncellemeler hemen yansır), ağ yoksa önbellekten döner.
   2) Bildirim gösterimi ve bildirime tıklayınca uygulamayı öne getirme.
   Zamanlanmış/arka plan bildirim GARANTİSİ VERMEZ; sayfa kapalıyken tarayıcı
   bu dosyayı istediği an durdurabilir. Güvenilir kaynak uygulama içindeki panodur. */

const ONBELLEK = "borc-plani-v2"; // v2: Sıfırla markası — ikonlar/manifest değişti
const KABUK = [
  "./",
  "./index.html",
  "./borc-plani.html",
  "./manifest.webmanifest",
  "./ikon-192.png",
  "./ikon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(ONBELLEK)
      .then((c) => c.addAll(KABUK))
      .catch(() => { /* önbellek kurulamazsa uygulama yine de ağdan çalışır */ })
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

/* Ağ-öncelikli: başarılı yanıt önbelleğe kopyalanır; ağ yoksa önbellekten dön.
   Sorgu dizisi (?widget=1, ?dev=1) önbellek eşleşmesinde yok sayılır. */
self.addEventListener("fetch", (e) => {
  const istek = e.request;
  if (istek.method !== "GET" || new URL(istek.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(istek)
      .then((yanit) => {
        if (yanit && yanit.ok) {
          const kopya = yanit.clone();
          caches.open(ONBELLEK).then((c) => c.put(istek, kopya)).catch(() => { /* kota vb. */ });
        }
        return yanit;
      })
      .catch(() =>
        caches.match(istek, { ignoreSearch: true }).then(
          (o) => o || (istek.mode === "navigate" ? caches.match("./borc-plani.html") : Response.error())
        )
      )
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) =>
      ws.length ? ws[0].focus() : self.clients.openWindow("./borc-plani.html")
    )
  );
});
