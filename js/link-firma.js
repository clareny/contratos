/* Link para firmar: sube el archivo para firmar, cifrado con AES-GCM, a un repositorio de GitHub Pages.
   La clave va solo en el # del link, que el navegador nunca envía al servidor.
   Lo abre siempre la misma página (firmar.html), que se publica una sola vez: el contrato cifrado se lee de
   raw.githubusercontent.com, que lo tiene apenas se sube. Así un link nuevo no espera a que GitHub Pages publique. */

var LS_LINK_TOKEN = "clareny_link_token_v1";
var PAGINA_FIRMA = "firmar.html";

function tokenLink() { try { return localStorage.getItem(LS_LINK_TOKEN) || ""; } catch (e) { return ""; } }
function guardarTokenLink(t) {
  try { if (t) localStorage.setItem(LS_LINK_TOKEN, t); else localStorage.removeItem(LS_LINK_TOKEN); } catch (e) {}
}

function datosLink(cfg) {
  var l = cfg.linkFirma || {};
  return {
    usuario: String(l.usuario || "").trim().replace(/^@/, ""),
    repo: String(l.repo || "").trim() || "firmas",
    token: tokenLink(),
  };
}
function linkConfigurado(cfg) { var d = datosLink(cfg); return !!(d.usuario && d.token); }

function b64DeBytes(bytes) {
  var s = "";
  for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64url(bytes) { return b64DeBytes(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function idAleatorio() { return b64url(crypto.getRandomValues(new Uint8Array(12))).replace(/[-_]/g, "x"); }

function apiRepo(d) { return "https://api.github.com/repos/" + encodeURIComponent(d.usuario) + "/" + encodeURIComponent(d.repo); }
function cabecerasGitHub(d) { return { Authorization: "Bearer " + d.token, Accept: "application/vnd.github+json", "Content-Type": "application/json" }; }
function urlPages(d) { return "https://" + d.usuario.toLowerCase() + ".github.io/" + d.repo + "/"; }

/* Nunca se sube nada al repositorio de una web con dominio propio (por ejemplo clareny.com).
   La dirección de GitHub Pages distingue mayúsculas: se usa el nombre exacto del repositorio («Firmas» ≠ «firmas»). */
function verificarRepoSoloFirmas(d) {
  var aparte = " Por seguridad el programa no sube nada ahí. Creá un repositorio aparte, solo para firmas (por ejemplo «firmas»).";
  var repo = {};
  return fetch(apiRepo(d), { headers: cabecerasGitHub(d) }).catch(sinConexion).then(respuestaGitHub).then(function (r) {
    repo = r;
    if (r.name) d.repo = r.name;
    if (d.repo.toLowerCase() === d.usuario.toLowerCase() + ".github.io") throw new Error("«" + d.repo + "» es el repositorio principal de tu cuenta." + aparte);
    return fetch(apiRepo(d) + "/pages", { headers: cabecerasGitHub(d) }).catch(sinConexion);
  }).then(function (r) {
    var base = { privado: !!repo.private, rama: repo.default_branch || "main" };
    if (r.status === 404) return Object.assign(base, { pages: repo.has_pages ? null : false });
    if (!r.ok) return Object.assign(base, { pages: repo.has_pages === false ? false : null });
    return r.json().then(function (p) { return Object.assign(base, { pages: true, cname: p.cname }); });
  }).then(function (info) {
    if (info.cname) throw new Error("El repositorio «" + d.repo + "» publica la web " + info.cname + "." + aparte);
    return fetch(urlPages(d) + "?v=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.url || ""; }, function () { return ""; }).then(function (final) {
      if (final && !/^https:\/\/[^/]+\.github\.io\//i.test(final)) throw new Error("Las páginas de «" + d.repo + "» se abren en " + final.split("/")[2] + "." + aparte);
      return info;
    });
  });
}

function respuestaGitHub(r) {
  if (r.ok) return r.status === 204 ? {} : r.json();
  return r.json().catch(function () { return {}; }).then(function (j) {
    var msg = r.status === 401 ? "El token no es válido o venció."
      : r.status === 403 ? "El token no tiene permiso para escribir en el repositorio (Contents: Read and write)."
      : r.status === 404 ? "No encuentro el repositorio. Revisá el usuario y el nombre del repositorio."
      : r.status === 409 || r.status === 422 ? "GitHub rechazó el archivo. Probá de nuevo en unos segundos."
      : "GitHub respondió con un error (" + r.status + ").";
    throw new Error(msg + (j && j.message ? " [" + j.message + "]" : ""));
  });
}
function sinConexion(e) {
  if (e && e.name === "TypeError") throw new Error("No hay conexión con GitHub. Revisá que tengas internet.");
  throw e;
}

function cifrarPaquete(html) {
  if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("Este navegador no permite cifrar. Abrí el programa con Chrome o Edge."));
  var clave = crypto.getRandomValues(new Uint8Array(16));
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.importKey("raw", clave, "AES-GCM", false, ["encrypt"]).then(function (k) {
    return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(html));
  }).then(function (buf) {
    return { clave: b64url(clave), iv: b64url(iv), datos: b64url(new Uint8Array(buf)) };
  });
}

/* Se ejecuta en el celular del cliente (se inserta como texto en firmar.html). El link es firmar.html?c=<id>#<clave>:
   el id va fuera del # porque si dos links solo difieren en el #, el navegador no recarga la página. */
function abrirLinkFirma() {
  var m = document.getElementById("m");
  function error(t) { m.innerHTML = t; }
  function bytes(b64) {
    var s = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }
  var origen = JSON.parse(document.getElementById("origen").textContent);
  var id = (location.search.match(/[?&]c=([A-Za-z0-9]+)/) || [])[1];
  var clave = location.hash.slice(1);
  if (!id || !clave) return error("Al link le falta una parte.<br>Pedí que te lo manden de nuevo y abrilo completo.");
  if (!window.crypto || !crypto.subtle || !window.fetch) return error("Este navegador no puede abrir el contrato.<br>Abrí el link con Safari o Chrome.");
  var k;
  try { k = bytes(clave); } catch (e) { return error("El link está incompleto.<br>Pedí que te lo manden de nuevo."); }
  function leer(url, opciones) {
    return fetch(url, opciones).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    });
  }
  /* Si raw.githubusercontent.com falla se prueba con la API de GitHub; si fallan las dos, se reintenta unos segundos. */
  function traer(intento) {
    return leer(origen.raw + id + ".txt?v=" + Date.now(), { cache: "no-store" }).catch(function () {
      return leer(origen.api + id + ".txt?ref=" + encodeURIComponent(origen.rama), { cache: "no-store", headers: { Accept: "application/vnd.github.raw" } });
    }).catch(function (e) {
      if (intento >= 3) throw e;
      return new Promise(function (ok) { setTimeout(ok, 2500); }).then(function () { return traer(intento + 1); });
    });
  }
  var descifrado = traer(1).then(function (txt) {
    var c = txt.trim().split(".");
    return crypto.subtle.importKey("raw", k, "AES-GCM", false, ["decrypt"]).then(function (key) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(c[0]) }, key, bytes(c[1]));
    });
  });
  /* document.open() solo reemplaza la página si esta ya terminó de cargar; si no, mezcla las dos. */
  var cargada = new Promise(function (ok) {
    if (document.readyState === "complete") ok(); else window.addEventListener("load", function () { setTimeout(ok, 0); });
  });
  Promise.all([descifrado, cargada]).then(function (r) {
    var html = new TextDecoder().decode(r[0]);
    document.open();
    document.write(html);
    document.close();
  }, function () {
    error("No se pudo abrir el contrato.<br>Revisá que tengas internet y tocá el link de nuevo. Si sigue sin abrir, pedí un link nuevo.");
  });
}

function htmlPaginaFirma(d, rama, alias) {
  var origen = {
    raw: "https://raw.githubusercontent.com/" + encodeURIComponent(d.usuario) + "/" + encodeURIComponent(d.repo) + "/" + rama.split("/").map(encodeURIComponent).join("/") + "/c/",
    api: apiRepo(d) + "/contents/c/",
    rama: rama,
  };
  return '<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer">' +
    "<title>Contrato para firmar · " + esc(alias) + "</title>" +
    "<style>body{margin:0;background:#07090b;color:#e8eef2;font:17px/1.5 -apple-system,'Segoe UI',Roboto,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center}</style>" +
    '</head><body><div id="m">Abriendo el contrato…</div>' +
    '<script id="origen" type="application/json">' + JSON.stringify(origen).replace(/</g, "\\u003c") + "</script>" +
    "<script>(" + abrirLinkFirma.toString() + ")();</script></body></html>";
}

function textoDeB64(b64) {
  var s = atob(String(b64).replace(/\s+/g, ""));
  var u = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return new TextDecoder().decode(u);
}

/* Solo se sube si falta o cambió. Si otro aparato la subió al mismo tiempo, GitHub rechaza la segunda: da igual. */
function asegurarPaginaFirma(d, rama, alias) {
  var html = htmlPaginaFirma(d, rama, alias);
  var url = apiRepo(d) + "/contents/" + PAGINA_FIRMA;
  return fetch(url + "?ref=" + encodeURIComponent(rama), { headers: cabecerasGitHub(d), cache: "no-store" }).catch(sinConexion).then(function (r) {
    return r.status === 404 ? null : respuestaGitHub(r);
  }).then(function (actual) {
    if (actual && actual.content && textoDeB64(actual.content) === html) return;
    return fetch(url, {
      method: "PUT",
      headers: cabecerasGitHub(d),
      body: JSON.stringify({ message: "Página para abrir los links de firma", content: b64DeBytes(new TextEncoder().encode(html)), sha: actual ? actual.sha : undefined, branch: rama }),
    }).catch(sinConexion).then(function (r) { return r.status === 409 || r.status === 422 ? {} : respuestaGitHub(r); });
  });
}

function subirLinkFirma(cfg, html) {
  var d = datosLink(cfg);
  var id = idAleatorio(), ruta = "c/" + id + ".txt", rama;
  return verificarRepoSoloFirmas(d).then(function (info) {
    rama = info.rama;
    return asegurarPaginaFirma(d, rama, cfg.productor.alias || "");
  }).then(function () { return cifrarPaquete(html); }).then(function (c) {
    return fetch(apiRepo(d) + "/contents/" + ruta, {
      method: "PUT",
      headers: cabecerasGitHub(d),
      body: JSON.stringify({ message: "Contrato para firmar", content: btoa(c.iv + "." + c.datos), branch: rama }),
    }).catch(sinConexion).then(respuestaGitHub).then(function (r) {
      return { ruta: ruta, sha: r.content && r.content.sha, url: urlPages(d) + PAGINA_FIRMA + "?c=" + id + "#" + c.clave, fecha: new Date().toISOString() };
    });
  });
}

function borrarLinkFirma(cfg, link) {
  var d = datosLink(cfg);
  return fetch(apiRepo(d) + "/contents/" + link.ruta, {
    method: "DELETE",
    headers: cabecerasGitHub(d),
    body: JSON.stringify({ message: "Se borra un link para firmar", sha: link.sha }),
  }).catch(sinConexion).then(function (r) { return r.status === 404 ? {} : respuestaGitHub(r); });
}

/* Solo la primera vez hay que esperar: GitHub Pages tarda alrededor de un minuto en publicar firmar.html. */
function esperarLinkPublicado(url, alAvanzar) {
  var base = url.split("#")[0];
  var intentos = 0, max = 40;
  return new Promise(function (resolver) {
    function probar() {
      intentos++;
      if (alAvanzar) alAvanzar(intentos);
      fetch(base + (base.indexOf("?") < 0 ? "?" : "&") + "v=" + Date.now(), { cache: "no-store" }).then(function (r) {
        if (r.ok) resolver(true); else siguiente();
      }, siguiente);
    }
    function siguiente() {
      if (intentos >= max) resolver(false); else setTimeout(probar, 5000);
    }
    probar();
  });
}

function probarLinkFirma(cfg) {
  var d = datosLink(cfg);
  if (!d.usuario) return Promise.reject(new Error("Falta tu usuario de GitHub."));
  if (!d.token) return Promise.reject(new Error("Falta guardar el token."));
  return verificarRepoSoloFirmas(d).then(function (info) {
    if (info.privado) throw new Error("El repositorio es privado. GitHub Pages gratis necesita que sea público (los contratos van cifrados igual).");
    if (info.pages === false) throw new Error("Falta activar GitHub Pages: en el repositorio, Settings → Pages → Branch: main → Save.");
    return asegurarPaginaFirma(d, info.rama, cfg.productor.alias || "");
  }).then(function () {
    return urlPages(d);
  });
}
