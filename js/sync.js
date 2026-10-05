/* Sincronización entre aparatos (compu y celular). Cada contrato se guarda como un archivo cifrado con
   AES-GCM en un repositorio PRIVADO de GitHub. La clave sale de una frase que se escribe una vez en cada
   aparato: GitHub solo recibe datos cifrados. Usa el usuario y el token de link-firma.js. */

var LS_SYNC = "clareny_sync_v1";
var syncEnCurso = null, syncOtraVez = false, timerSync = null;
var ultimoEstadoSync = { texto: "", mal: false, error: "" };

function leerEstadoSync() { try { return JSON.parse(localStorage.getItem(LS_SYNC)) || {}; } catch (e) { return {}; } }
function escribirEstadoSync(e) { try { localStorage.setItem(LS_SYNC, JSON.stringify(e)); } catch (x) {} }

function datosSync(cfg) {
  var d = datosLink(cfg);
  return { usuario: d.usuario, token: d.token, repo: String((cfg.sync && cfg.sync.repo) || "").trim() || "contratos-datos" };
}
function syncActiva() { var d = datosSync(cfg); return !!(leerEstadoSync().clave && d.usuario && d.token); }

function bytesDeB64(b64) {
  var s = atob(String(b64).replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/"));
  var u = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}

function derivarClave(frase, sal) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(frase), "PBKDF2", false, ["deriveKey"]).then(function (base) {
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: sal, iterations: 210000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  });
}
function claveGuardada() { return crypto.subtle.importKey("raw", bytesDeB64(leerEstadoSync().clave), "AES-GCM", false, ["encrypt", "decrypt"]); }

function cifrarTexto(key, texto) {
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(texto)).then(function (buf) {
    return JSON.stringify({ v: 1, iv: b64url(iv), datos: b64url(new Uint8Array(buf)) });
  });
}
function descifrarTexto(key, envoltorio) {
  var o = JSON.parse(envoltorio);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytesDeB64(o.iv) }, key, bytesDeB64(o.datos)).then(function (buf) { return new TextDecoder().decode(buf); });
}

/* "modificado" cambia con solo abrir un contrato: no cuenta como cambio. */
function huellaSync(obj) {
  var copia = Object.assign({}, obj);
  delete copia.modificado;
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(copia))).then(function (b) { return b64url(new Uint8Array(b)); });
}

function rutaContrato(id) { return "contratos/" + String(id).replace(/[^A-Za-z0-9._-]+/g, "_") + ".json"; }

function esContratoVacio(c) {
  if (!c || (c.firmas && Object.keys(c.firmas).length)) return false;
  var cl = c.cliente || {};
  if (c.proyecto || cl.razon || cl.artistico || (c.tracks || []).length) return false;
  return !(c.artistas || []).some(function (a) { return a.nombre || a.artistico; });
}

/* ---------- GitHub ---------- */

function pedirGitHub(d, ruta, metodo, cuerpo) {
  return fetch(apiRepo(d) + ruta, { method: metodo || "GET", headers: cabecerasGitHub(d), body: cuerpo ? JSON.stringify(cuerpo) : undefined, cache: "no-store" }).catch(sinConexion);
}

function revisarRepoDatos(d) {
  if (!d.usuario || !d.token) return Promise.reject(new Error("Primero completá tu usuario de GitHub y guardá el token."));
  if (d.repo.toLowerCase() === datosLink(cfg).repo.toLowerCase()) return Promise.reject(new Error("El repositorio de datos tiene que ser distinto del de los links para firmar."));
  return pedirGitHub(d, "").then(function (r) {
    if (r.status === 404) throw new Error("No encuentro el repositorio privado «" + d.repo + "». Revisá que exista y que el token tenga acceso a él (Only select repositories → " + d.repo + ").");
    return respuestaGitHub(r);
  }).then(function (repo) {
    if (!repo.private) throw new Error("El repositorio «" + d.repo + "» es público. Para tus contratos tiene que ser PRIVADO (Settings → General → Change visibility → Private).");
    return repo.default_branch || "main";
  });
}

function leerArbol(d, rama) {
  return pedirGitHub(d, "/git/trees/" + encodeURIComponent(rama) + "?recursive=1").then(function (r) {
    if (r.status === 409 || r.status === 404) return {};
    return respuestaGitHub(r).then(function (t) {
      var m = {};
      (t.tree || []).forEach(function (x) { if (x.type === "blob") m[x.path] = x.sha; });
      return m;
    });
  });
}

function leerArchivo(d, sha) {
  return pedirGitHub(d, "/git/blobs/" + sha).then(respuestaGitHub).then(function (b) { return new TextDecoder().decode(bytesDeB64(b.content)); });
}

/* Devuelve el sha nuevo, o null si el archivo cambió en GitHub mientras tanto (se reintenta en la próxima vuelta). */
function escribirArchivo(d, ruta, texto, sha) {
  var cuerpo = { message: "Sincronización", content: b64DeBytes(new TextEncoder().encode(texto)) };
  if (sha) cuerpo.sha = sha;
  return pedirGitHub(d, "/contents/" + ruta, "PUT", cuerpo).then(function (r) {
    if (r.status === 409 || r.status === 422) return null;
    return respuestaGitHub(r).then(function (j) { return j.content.sha; });
  });
}

function borrarArchivo(d, ruta, sha) {
  return pedirGitHub(d, "/contents/" + ruta, "DELETE", { message: "Contrato eliminado", sha: sha }).then(function (r) {
    if (r.status === 404 || r.status === 409 || r.status === 422) return null;
    return respuestaGitHub(r);
  });
}

/* ---------- activar ---------- */

function activarSync(frase) {
  var d = datosSync(cfg);
  if (!frase || frase.length < 8) return Promise.reject(new Error("La clave tiene que tener al menos 8 caracteres."));
  if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("Este navegador no permite cifrar. Usá Chrome, Edge o Safari actualizados."));
  return revisarRepoDatos(d).then(function (rama) { return leerArbol(d, rama); }).then(function (arbol) {
    if (arbol["cifrado.json"]) {
      return leerArchivo(d, arbol["cifrado.json"]).then(function (txt) {
        var info = JSON.parse(txt);
        return derivarClave(frase, bytesDeB64(info.sal)).then(function (key) {
          return descifrarTexto(key, info.prueba).then(function () { return key; }, function () {
            throw new Error("La clave no coincide con la que usaste en el otro aparato.");
          });
        });
      });
    }
    var sal = crypto.getRandomValues(new Uint8Array(16));
    return derivarClave(frase, sal).then(function (key) {
      return cifrarTexto(key, "clareny").then(function (prueba) {
        return escribirArchivo(d, "cifrado.json", JSON.stringify({ v: 1, sal: b64url(sal), prueba: prueba }), null).then(function () { return key; });
      });
    });
  }).then(function (key) {
    return crypto.subtle.exportKey("raw", key);
  }).then(function (raw) {
    escribirEstadoSync({ clave: b64url(new Uint8Array(raw)), shas: {}, huellas: {} });
    return sincronizar();
  });
}

function desactivarSync() { try { localStorage.removeItem(LS_SYNC); } catch (e) {} mostrarEstadoSync("", false); }

/* ---------- sincronizar ---------- */

function horaCorta() { return new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }); }

function mostrarEstadoSync(texto, mal, error) {
  ultimoEstadoSync = { texto: texto, mal: !!mal, error: error || "" };
  var el = document.getElementById("estado-sync");
  if (!el) return;
  el.textContent = texto;
  el.className = "estado-sync" + (mal ? " mal" : "");
  el.title = error || "";
}

function programarSync(ms) {
  if (!syncActiva()) return;
  clearTimeout(timerSync);
  /* Espera a que dejes de escribir: cada subida queda en el historial de GitHub. */
  timerSync = setTimeout(function () { timerSync = null; sincronizar(); }, ms == null ? 15000 : ms);
}

function sincronizar() {
  if (!syncActiva()) return Promise.resolve({ ok: false, cambios: 0 });
  if (syncEnCurso) { syncOtraVez = true; return syncEnCurso; }
  mostrarEstadoSync("Sincronizando…");
  syncEnCurso = pasoSync().then(function (cambios) {
    mostrarEstadoSync("Sincronizado " + horaCorta());
    return { ok: true, cambios: cambios };
  }, function (e) {
    var sinRed = /conexión/.test(e.message);
    mostrarEstadoSync(sinRed ? "Sin internet: se sincroniza después" : "No se pudo sincronizar", !sinRed, e.message);
    return { ok: false, cambios: 0, error: e.message };
  }).then(function (r) {
    syncEnCurso = null;
    if (syncOtraVez) { syncOtraVez = false; programarSync(1500); }
    return r;
  });
  return syncEnCurso;
}

function pasoSync() {
  var d = datosSync(cfg), e = leerEstadoSync();
  e.shas = e.shas || {};
  e.huellas = e.huellas || {};
  var key, arbol, loc = {}, cambios = 0, tocados = { actual: false, config: false, otros: false };
  var borrarRemotos = true, borrarLocales = true;

  function marcar(ruta, sha, h) { e.shas[ruta] = sha; e.huellas[ruta] = h; escribirEstadoSync(e); }
  function olvidar(ruta) { delete e.shas[ruta]; delete e.huellas[ruta]; escribirEstadoSync(e); }

  /* Si el usuario editó mientras se sincronizaba, no se pisa: se resuelve en la próxima vuelta. */
  function sigueIgual(l) {
    return huellaSync(l.config ? cfg : contratos[l.id] || {}).then(function (h) {
      if (h !== l.h) syncOtraVez = true;
      return h === l.h;
    });
  }

  function bajar(sha) {
    return leerArchivo(d, sha).then(function (txt) {
      return descifrarTexto(key, txt).catch(function () { throw new Error("No pude descifrar los datos de GitHub: la clave de este aparato no es la misma que la del otro. Desactivá y activá con la clave correcta."); });
    }).then(function (json) {
      var obj = JSON.parse(json);
      return huellaSync(obj).then(function (h) { return { obj: obj, h: h }; });
    });
  }

  function subir(ruta, obj, sha) {
    var copia = JSON.parse(JSON.stringify(obj));
    return huellaSync(copia).then(function (h) {
      return cifrarTexto(key, JSON.stringify(copia)).then(function (txt) { return escribirArchivo(d, ruta, txt, sha); }).then(function (nuevo) {
        if (!nuevo) { syncOtraVez = true; return; }
        marcar(ruta, nuevo, h);
        cambios++;
      });
    });
  }

  function ponerLocal(obj) {
    if (st && st.id === obj.id) { st = obj; tocados.actual = true; } else tocados.otros = true;
    contratos[obj.id] = obj;
    delete eliminados[obj.id];
  }

  function aplicarConfig(rem) {
    var contador = cfg.contador || {}, link = cfg.linkFirma, repoSync = cfg.sync;
    cfg = rem;
    cfg.contador = cfg.contador || {};
    Object.keys(contador).forEach(function (a) { if ((contador[a] || 0) > (cfg.contador[a] || 0)) cfg.contador[a] = contador[a]; });
    /* Sin usuario o repositorio este aparato dejaría de sincronizar: si al otro le faltan, quedan los de acá. */
    if (!(cfg.linkFirma && cfg.linkFirma.usuario) && link && link.usuario) cfg.linkFirma = link;
    if (!(cfg.sync && cfg.sync.repo) && repoSync && repoSync.repo) cfg.sync = repoSync;
    normalizarConfig();
    tocados.config = true;
  }

  function aplicar(ruta, l, rem, sha) {
    return (l ? sigueIgual(l) : Promise.resolve(true)).then(function (ok) {
      if (!ok) return;
      if (ruta === "config.json") aplicarConfig(rem.obj);
      else if (rem.obj && rem.obj.id) ponerLocal(rem.obj);
      marcar(ruta, sha, rem.h);
      cambios++;
    });
  }

  function idLibre(id) {
    var m = String(id).match(/^(.*?)(\d+)$/);
    var base = m ? m[1] : id + "-", n = m ? Number(m[2]) : 1, ancho = m ? m[2].length : 1, nuevo;
    do { n++; nuevo = base + ("000000" + n).slice(-Math.max(ancho, String(n).length)); } while (contratos[nuevo] || arbol[rutaContrato(nuevo)]);
    return nuevo;
  }

  function unirFirmas(gana, pierde) {
    var u = JSON.parse(JSON.stringify(gana));
    u.firmas = u.firmas || {};
    Object.keys(pierde.firmas || {}).forEach(function (k) {
      var f = pierde.firmas[k];
      if (f && f.fecha && !(u.firmas[k] && u.firmas[k].fecha)) u.firmas[k] = f;
    });
    return u;
  }

  function resolver(ruta) {
    var l = loc[ruta], remSha = arbol[ruta], base = e.huellas[ruta], conocido = e.shas[ruta];
    var esConfig = ruta === "config.json";
    var remCambio = !!remSha && remSha !== conocido;
    var locCambio = !!l && l.h !== base;

    if (l && remSha) {
      if (!remCambio && !locCambio) return Promise.resolve();
      if (!remCambio) return subir(ruta, l.obj, remSha);
      return bajar(remSha).then(function (rem) {
        if (rem.h === l.h) return marcar(ruta, remSha, rem.h);
        if (!locCambio || esConfig) return aplicar(ruta, l, rem, remSha);
        if (!base) {
          /* El mismo número se creó en los dos aparatos. */
          if (esContratoVacio(l.obj)) return aplicar(ruta, l, rem, remSha);
          return sigueIgual(l).then(function (ok) {
            if (!ok) return;
            var viejo = l.id, nuevo = idLibre(viejo);
            l.obj.id = nuevo;
            delete contratos[viejo];
            contratos[nuevo] = l.obj;
            if (st === l.obj) tocados.actual = true;
            syncOtraVez = true;
            return aplicar(ruta, null, rem, remSha);
          });
        }
        var remGana = (rem.obj.modificado || "") > (l.obj.modificado || "");
        var unido = remGana ? unirFirmas(rem.obj, l.obj) : unirFirmas(l.obj, rem.obj);
        return sigueIgual(l).then(function (ok) {
          if (!ok) return;
          ponerLocal(unido);
          cambios++;
          return subir(ruta, unido, remSha);
        });
      });
    }
    if (l && !remSha) {
      if (conocido && !locCambio && !esConfig && borrarLocales) {
        return sigueIgual(l).then(function (ok) {
          if (!ok) return;
          delete contratos[l.id];
          eliminados[l.id] = true;
          if (st && st.id === l.id) { st = null; tocados.actual = true; } else tocados.otros = true;
          olvidar(ruta);
          cambios++;
        });
      }
      if (!conocido && !esConfig && esContratoVacio(l.obj)) return Promise.resolve();
      return subir(ruta, l.obj, null);
    }
    if (!l && remSha) {
      if (base && !remCambio && borrarRemotos) return borrarArchivo(d, ruta, remSha).then(function () { olvidar(ruta); cambios++; });
      return bajar(remSha).then(function (rem) { return aplicar(ruta, null, rem, remSha); });
    }
    olvidar(ruta);
    return Promise.resolve();
  }

  return claveGuardada().then(function (k) { key = k; return revisarRepoDatos(d); })
    .then(function (rama) { return leerArbol(d, rama); })
    .then(function (a) {
      arbol = a;
      /* Sin cifrado.json el repositorio se vació o se recreó: seguir borraría los contratos de este aparato. */
      if (!arbol["cifrado.json"] && Object.keys(e.shas).length) throw new Error("El repositorio «" + d.repo + "» está vacío o cambió. Desactivá y volvé a activar la sincronización.");
      var ids = Object.keys(contratos);
      return Promise.all(ids.map(function (id) {
        return huellaSync(contratos[id]).then(function (h) { loc[rutaContrato(id)] = { obj: contratos[id], h: h, id: id }; });
      }).concat([huellaSync(cfg).then(function (h) { loc["config.json"] = { obj: cfg, h: h, config: true }; })]));
    })
    .then(function () {
      var remotos = Object.keys(arbol).filter(function (r) { return /^contratos\//.test(r) && !loc[r] && e.huellas[r] && arbol[r] === e.shas[r]; });
      var locales = Object.keys(loc).filter(function (r) { return !loc[r].config && !arbol[r] && e.shas[r] && loc[r].h === e.huellas[r]; });
      if (remotos.length >= 3) borrarRemotos = confirm("Borraste " + remotos.length + " contratos en este aparato. ¿Borrarlos también en tus otros aparatos? (Si tocás Cancelar, vuelven a aparecer acá.)");
      if (locales.length >= 3) borrarLocales = confirm("En otro aparato se borraron " + locales.length + " contratos. ¿Borrarlos también acá? (Si tocás Cancelar, se vuelven a subir.)");
    })
    .then(function () {
      var rutas = { "config.json": 1 };
      Object.keys(arbol).forEach(function (r) { if (/^contratos\/.+\.json$/.test(r)) rutas[r] = 1; });
      Object.keys(loc).forEach(function (r) { rutas[r] = 1; });
      Object.keys(e.huellas).forEach(function (r) { rutas[r] = 1; });
      /* La configuración primero: trae el contador de números de contrato del otro aparato. */
      var lista = Object.keys(rutas).sort(function (a, b) { return (a === "config.json" ? 0 : 1) - (b === "config.json" ? 0 : 1); });
      return lista.reduce(function (p, ruta) { return p.then(function () { return resolver(ruta); }); }, Promise.resolve());
    })
    .then(function () { terminar(); return cambios; }, function (err) { terminar(); throw err; });

  function terminar() {
    if (!tocados.actual && !tocados.config && !tocados.otros) return;
    if (!st) { var resto = Object.keys(contratos); st = resto.length ? contratos[resto[0]] : null; }
    if (!st) { st = nuevoContrato(); contratos[st.id] = st; }
    migrarRegalias();
    try {
      localStorage.setItem(LS_CONFIG, JSON.stringify(cfg));
      localStorage.setItem(LS_CONTRATOS, JSON.stringify(contratos));
      localStorage.setItem(LS_ACTUAL, st.id);
    } catch (x) {}
    if (tocados.actual || tocados.config) renderTodo();
  }
}
