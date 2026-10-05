/* Deja abrir el programa sin internet. Siempre pide primero la versión publicada, así los cambios
   llegan solos; sin conexión usa la última copia guardada. GitHub (api.github.com) nunca pasa por acá. */

var CACHE = "contratos-v3";
var ARCHIVOS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "vendor/docx.iife.js",
  "js/logos.js",
  "js/fuentes.js",
  "js/data.js",
  "js/firma-core.js",
  "js/contrato.js",
  "js/export-word.js",
  "js/paquete-firma.js",
  "js/link-firma.js",
  "js/sync.js",
  "js/importar-pdf.js",
  "js/app.js",
  "assets/logo-clareny.png",
  "assets/logo-graykids.png",
  "assets/icono-180.png",
  "assets/icono-192.png",
  "assets/icono-512.png",
  "assets/icono-512-maskable.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function guardada(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (r) {
    return r || (req.mode === "navigate" ? caches.match("index.html") : undefined);
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  var red = fetch(req, { cache: "no-cache" }).then(function (r) {
    if (r.ok) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copia); });
    }
    return r;
  });
  /* Con internet lento no se espera para siempre: a los 6 segundos se abre la copia guardada. */
  var espera = new Promise(function (ok, mal) {
    var t = setTimeout(mal, 6000);
    red.then(function (r) { clearTimeout(t); ok(r); }, function (err) { clearTimeout(t); mal(err); });
  });
  e.respondWith(espera.catch(function () {
    return guardada(req).then(function (r) { return r || red; });
  }));
});
