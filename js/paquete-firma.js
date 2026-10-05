/* Genera un archivo HTML autónomo para que el cliente firme a distancia.
   El cliente lo abre en su navegador, firma, y descarga la copia firmada
   (que luego se importa en el programa o se guarda como PDF). */

var PAQUETE_UI_CSS = `
html, body { margin:0; background:#050505; color:#e8f1f5; font-family:"Segoe UI", Roboto, Arial, sans-serif; }
.ui-barra { position:sticky; top:0; z-index:10; display:flex; align-items:center; gap:12px; padding:10px 18px; background:rgba(5,5,5,.94); border-bottom:1px solid #1d2a30; backdrop-filter:blur(6px); }
.ui-barra img { height:34px; filter:invert(1); }
.ui-barra .tk { font-family:Tektur, Bahnschrift, sans-serif; letter-spacing:.2em; font-weight:700; color:#8feff2; }
.ui-barra .id { margin-left:auto; font-family:Tektur, Bahnschrift, sans-serif; font-size:12px; color:#9aa4ad; letter-spacing:.1em; }
.ui-caja { max-width:210mm; margin:16px auto; padding:14px 18px; border:1px solid #1d2a30; border-radius:12px; background:#0b1114; line-height:1.5; font-size:14px; }
.ui-caja h2 { font-family:Tektur, Bahnschrift, sans-serif; letter-spacing:.12em; font-size:15px; margin:0 0 8px; color:#72f6d2; }
.ui-ok { border-color:#2a7a64; background:#07201a; }
.ui-mal { border-color:#7a2a35; background:#2a0b10; }
.doc-wrap { padding:8px 0 20px; }
.doc { box-shadow:0 10px 40px rgba(0,0,0,.5); border-radius:4px; }
.ui-form label { display:block; font-size:12px; color:#9aa4ad; margin:10px 0 4px; letter-spacing:.04em; }
.ui-form input[type=text], .ui-form input[type=email], .ui-form select { width:100%; box-sizing:border-box; padding:10px 12px; border-radius:8px; border:1px solid #2a3a42; background:#050a0c; color:#fff; font-size:15px; }
.ui-check { display:flex; gap:10px; align-items:flex-start; margin:10px 0; font-size:14px; }
.ui-check input { margin-top:3px; width:18px; height:18px; accent-color:#1cdadd; }
.ui-pad { width:100%; height:190px; background:#fff; border-radius:10px; border:2px dashed #1cdadd; display:block; margin-top:6px; cursor:crosshair; }
.ui-botones { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }
.ui-btn { font-family:Tektur, Bahnschrift, sans-serif; letter-spacing:.1em; font-size:13px; padding:11px 16px; border-radius:999px; border:1px solid #2a3a42; background:#0f181c; color:#e8f1f5; cursor:pointer; text-decoration:none; display:inline-block; }
.ui-btn.primario { background:linear-gradient(90deg,#1cdadd,#72f6d2); color:#041414; border:0; font-weight:700; }
.ui-btn:disabled { opacity:.45; cursor:not-allowed; }
.ui-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 14px; }
.ui-oculto { display:none !important; }
@media screen and (max-width: 820px) {
  .doc { width:auto !important; min-height:0 !important; padding:18px 14px !important; margin:0 8px !important; }
  .doc-head { grid-template-columns:40px 1fr 40px !important; } .doc-head img { width:40px !important; height:40px !important; }
  .doc-head .marca { font-size:16pt !important; }
  .partes, .firmas, .ui-grid { grid-template-columns:1fr !important; }
  .doc-meta { grid-template-columns:1fr 1fr !important; }
  table.tbl { display:block; overflow-x:auto; }
  .ui-caja { margin:12px 8px; }
}
@media print {
  html, body { background:#fff; }
  .ui, .ui-barra, .ui-caja { display:none !important; }
  .doc { box-shadow:none; border-radius:0; }
  .doc-wrap { padding:0; }
}
`;

function etiquetaFirmante(f) {
  var quien = f.alias && f.nombre && String(f.alias).toLowerCase() !== String(f.nombre).toLowerCase()
    ? f.alias + " (" + f.nombre + ")"
    : (f.nombre || f.alias || "");
  return quien ? quien + " · " + f.rol : f.rol;
}

function mismoFirmante(a, f) {
  var n = String((a && a.nombre) || "").trim().toLowerCase();
  var art = String((a && a.artistico) || "").trim().toLowerCase();
  var fn = String((f && f.nombre) || "").trim().toLowerCase();
  var fa = String((f && f.alias) || "").trim().toLowerCase();
  if (n && (n === fn || n === fa)) return true;
  if (art && (art === fn || art === fa)) return true;
  return false;
}

function firmantesClientePaquete(st, cfg, firmas) {
  firmas = firmas || {};
  function libre(f) { return f && f.key !== "productor" && !(firmas[f.key] && firmas[f.key].fecha); }
  var lista = firmantes(st, cfg).filter(libre);
  var keys = {};
  lista.forEach(function (f) { keys[f.key] = true; });
  (st.artistas || []).forEach(function (a, i) {
    if (!(a.nombre || a.artistico)) return;
    if (st.tipoCliente === "individual" && i === 0) return;
    var key = "artista-" + i;
    if (keys[key] || (firmas[key] && firmas[key].fecha)) return;
    if (lista.some(function (f) { return mismoFirmante(a, f); })) return;
    lista.push({ key: key, rol: rolFirmanteArtista(st, a, i), nombre: a.nombre, alias: a.artistico, documento: a.documento, email: a.email, cargo: a.rol });
    keys[key] = true;
  });
  if (!lista.length) {
    var c = st.cliente || {};
    if (st.tipoCliente === "sello" && (c.representante || c.razon)) {
      lista.push({ key: "cliente", rol: "EL CLIENTE / SELLO", nombre: c.representante || c.razon, alias: c.razon, documento: c.repDocumento || c.documento, email: c.email, cargo: c.cargo });
    } else if (c.razon || c.artistico) {
      lista.push({ key: "cliente", rol: "EL CLIENTE / ARTISTA", nombre: c.razon || c.artistico, alias: c.artistico, documento: c.documento, email: c.email });
    }
  }
  return lista.filter(libre);
}

function htmlOpcionesFirmante(lista) {
  if (!lista.length) return '<option value="">No hay quién firmar — pedí una copia nueva</option>';
  var h = lista.length > 1 ? '<option value="">Elegí tu nombre</option>' : "";
  return h + lista.map(function (f) {
    return '<option value="' + esc(f.key) + '">' + esc(etiquetaFirmante(f)) + "</option>";
  }).join("");
}

function scriptPaquete() {
  var datos = JSON.parse(document.getElementById("datos-firma").textContent);
  var $ = function (id) { return document.getElementById(id); };
  var pad = null;

  function pendientes() {
    var lista = (datos.firmantes || []).filter(function (f) { return f.key !== "productor" && !(datos.firmas[f.key] && datos.firmas[f.key].fecha); });
    return lista.length ? lista : (datos.firmantes || []).filter(function (f) { return f.key !== "productor"; });
  }

  function verificar() {
    var actual = sha256(textoParaHash(document));
    var ok = actual === datos.hash;
    var caja = $("ui-integridad");
    caja.className = "ui-caja ui " + (ok ? "ui-ok" : "ui-mal");
    caja.innerHTML = ok
      ? "<b>✔ Documento íntegro.</b> El texto del contrato es exactamente el que emitió " + esc(datos.productor) + ". Código: <code>" + esc(datos.hash.slice(0, 16)) + "</code>"
      : "<b>✖ Atención:</b> el texto del contrato no coincide con el original emitido. No firmes y pedí una copia nueva.";
    var codigo = document.getElementById("codigo-doc");
    if (codigo) codigo.textContent = datos.hash;
    return ok;
  }

  function prepararFormulario() {
    var lista = pendientes();
    var sel = $("ui-firmante");
    var txt = $("ui-firmante-txt");
    if (sel && sel.tagName === "SELECT") {
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      if (!lista.length) {
        var vacioOp = document.createElement("option");
        vacioOp.value = "";
        vacioOp.textContent = "No hay quién firmar — pedí una copia nueva";
        sel.appendChild(vacioOp);
      } else {
        if (lista.length > 1) {
          var elige = document.createElement("option");
          elige.value = "";
          elige.textContent = "Elegí tu nombre";
          sel.appendChild(elige);
        }
        lista.forEach(function (f) {
          var o = document.createElement("option");
          o.value = f.key;
          o.textContent = f.rol + (f.nombre ? " — " + f.nombre : (f.alias ? " — " + f.alias : ""));
          sel.appendChild(o);
        });
      }
      sel.style.display = lista.length > 1 ? "" : (lista.length === 1 ? "none" : "");
    }
    if (txt) {
      txt.classList.toggle("ui-oculto", lista.length !== 1);
      txt.innerHTML = lista.length === 1 ? "Firmo como <b>" + esc(etiquetaFirmante(lista[0])) + "</b>" : "";
    }
    if (sel && lista.length === 1) sel.value = lista[0].key;
    $("ui-form").classList.toggle("ui-oculto", !lista.length);
    var aviso = $("ui-sin-firmante");
    if (aviso) aviso.classList.toggle("ui-oculto", !!lista.length);
    var algunaCliente = Object.keys(datos.firmas || {}).some(function (k) { return k !== "productor" && datos.firmas[k] && datos.firmas[k].fecha; });
    $("ui-listo").classList.toggle("ui-oculto", !algunaCliente);
    if (lista.length) cargarFirmante();
    if (pad) setTimeout(pad.ajustar, 0);
  }

  function cargarFirmante() {
    var key = $("ui-firmante").value;
    if (!key) {
      $("ui-nombre").value = "";
      $("ui-doc").value = "";
      $("ui-email").value = "";
      $("ui-acepto").checked = false;
      $("ui-datos").checked = false;
      if (pad) pad.limpiar();
      return;
    }
    var f = datos.firmantes.filter(function (x) { return x.key === key; })[0] || {};
    $("ui-nombre").value = f.nombre || "";
    $("ui-doc").value = f.documento || "";
    $("ui-email").value = f.email || "";
    $("ui-acepto").checked = false;
    $("ui-datos").checked = false;
    if (pad) pad.limpiar();
  }

  function firmar() {
    var key = $("ui-firmante").value;
    if (!key) return alert("Elegí tu nombre en «Firmo como» (si son dos artistas, cada uno elige el suyo).");
    var nombre = nombrePropio($("ui-nombre").value);
    var f = datos.firmantes.filter(function (x) { return x.key === key; })[0] || { key: key, rol: "EL CLIENTE / ARTISTA", nombre: nombre };
    $("ui-nombre").value = nombre;
    var doc = $("ui-doc").value.trim();
    var email = $("ui-email").value.trim();
    if (!nombre) return alert("Completá tu nombre legal.");
    if (!$("ui-acepto").checked || !$("ui-datos").checked) return alert("Tenés que marcar las dos casillas de aceptación para firmar.");
    if (!pad || pad.estaVacio()) return alert("Dibujá tu firma en el recuadro blanco.");
    if (!verificar()) return alert("El documento fue modificado. No se puede firmar.");
    var firma = { img: pad.imagen(), nombre: nombre, documento: doc, email: email, fecha: new Date().toISOString(), metodo: "remota", dispositivo: describirDispositivo(), hash: datos.hash };
    datos.firmas[key] = firma;
    ultimoFirmante = nombre.split(" ")[0];
    var box = document.querySelector('.firma-box[data-signer="' + key + '"]');
    if (box) box.outerHTML = renderFirmaBox(f, firma, datos.cfg);
    $("registro-firmas").innerHTML = renderRegistroFirmas({ firmas: datos.firmas }, datos.firmantes);
    $("datos-firma").textContent = JSON.stringify(datos).replace(/</g, "\\u003c");
    prepararFormulario();
    $("ui-listo").scrollIntoView({ behavior: "smooth" });
  }

  var ultimoFirmante = "";

  function archivoFirmado() {
    $("datos-firma").textContent = JSON.stringify(datos).replace(/</g, "\\u003c");
    var html = "<!doctype html>\n" + document.documentElement.outerHTML;
    var sufijo = ultimoFirmante ? "_" + ultimoFirmante.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") : "";
    return { blob: new Blob([html], { type: "text/html;charset=utf-8" }), nombre: "Contrato_" + datos.id + "_firmado" + sufijo + ".html" };
  }

  function descargar() {
    var f = archivoFirmado();
    var a = document.createElement("a");
    a.href = URL.createObjectURL(f.blob);
    a.download = f.nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function abrirWhatsApp() {
    var url = "https://wa.me/" + (datos.wa || "") + "?text=" + encodeURIComponent(datos.msgWa);
    window.open(url, "_blank");
  }

  function enviarWhatsApp() {
    var f = archivoFirmado();
    var archivo = null;
    try { archivo = new File([f.blob], f.nombre, { type: "text/html" }); } catch (e) {}
    if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      navigator.share({ files: [archivo], title: "Contrato " + datos.id + " firmado", text: datos.msgWa }).catch(function (e) {
        if (e && e.name !== "AbortError") { descargar(); abrirWhatsApp(); }
      });
      return;
    }
    descargar();
    alert("Se descargó el archivo firmado (" + f.nombre + ").\n\nAhora se abre WhatsApp: tocá el clip 📎 → Documento y adjuntá ese archivo desde Descargas.");
    abrirWhatsApp();
  }

  function iniciarUi() {
    verificar();
    pad = crearPadFirma($("ui-pad"));
    var sel = $("ui-firmante");
    if (sel && sel.addEventListener) sel.addEventListener("change", cargarFirmante);
    $("ui-limpiar").addEventListener("click", function () { pad.limpiar(); });
    $("ui-firmar").addEventListener("click", firmar);
    $("ui-descargar").addEventListener("click", descargar);
    if ($("ui-whatsapp")) $("ui-whatsapp").addEventListener("click", enviarWhatsApp);
    $("ui-pdf").addEventListener("click", function () { window.print(); });
    prepararFormulario();
    if ($("ui-sin-js")) $("ui-sin-js").classList.add("ui-oculto");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciarUi);
  else iniciarUi();
}

function generarPaqueteFirma(st, cfg, hash) {
  var fmt = conNombresFormateados(st, cfg);
  st = fmt.st; cfg = fmt.cfg;
  var firmasCopia = JSON.parse(JSON.stringify(st.firmas || {}));
  var lista = firmantes(st, cfg);
  var listaCliente = firmantesClientePaquete(st, cfg, firmasCopia);
  var datos = {
    id: st.id, hash: hash, productor: cfg.productor.alias,
    cfg: { productor: { ipi: cfg.productor.ipi, pro: cfg.productor.pro } },
    firmantes: listaCliente.length ? lista.filter(function (f) { return f.key === "productor"; }).concat(listaCliente) : lista,
    firmas: firmasCopia,
  };
  var p = cfg.productor;
  var wa = String(p.whatsapp || "").replace(/\D/g, "");
  var textoMsg = "Hola " + p.alias + ", ya firmé el contrato " + st.id + ". Te envío el archivo firmado.";
  var msg = encodeURIComponent(textoMsg);
  datos.wa = wa;
  datos.msgWa = textoMsg;
  var funciones = [nombrePropio, sha256, textoParaHash, crearPadFirma, describirDispositivo, fechaHoraLocal, esc, vacio, renderFirmaBox, renderRegistroFirmas, etiquetaFirmante]
    .map(function (f) { return f.toString(); }).join("\n\n");

  var h = "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\">";
  h += '<meta name="viewport" content="width=device-width, initial-scale=1">';
  h += "<title>Contrato " + esc(st.id) + " — " + esc(p.alias) + "</title>";
  h += "<style>" + (window.FUENTES_CSS || "") + CONTRATO_CSS + PAQUETE_UI_CSS + cssPagina(st, cfg) + "</style></head><body>";
  h += '<div class="ui-barra ui"><img src="' + LOGOS.clareny + '" alt=""><span class="tk">' + esc(p.alias) + '</span><span class="id">CONTRATO ' + esc(st.id) + "</span></div>";
  var linkPedir = wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hola " + p.alias + ", tengo iPhone y no puedo firmar el contrato " + st.id + ". ¿Me mandás el link para firmar?") : "";
  var sinJs = '<h2>EN ESTA VISTA NO SE PUEDE FIRMAR</h2>Si no podés escribir ni dibujar tu firma, estás en la <b>vista previa del iPhone</b> (WhatsApp o Archivos). Esa vista solo muestra el texto: no deja completar datos ni firmar.<br><br>' +
    "<b>Cómo firmar:</b><br>• Desde el <b>iPhone</b>: pedile a " + esc(p.alias) + " el <b>link para firmar</b>. Lo tocás, se abre en Safari y firmás con el dedo.<br>" +
    "• En una <b>computadora</b> o un celular <b>Android</b> con Chrome: abrí este mismo archivo y firmá ahí." +
    (linkPedir ? '<div class="ui-botones"><a class="ui-btn primario" style="background:#25d366;color:#04140a" href="' + esc(linkPedir) + '">PEDIR EL LINK POR WHATSAPP</a></div>' : "");
  h += '<div class="ui-caja ui"><h2>CONTRATO PARA FIRMAR</h2>1. Leé el contrato completo (desplazate hacia abajo).<br>2. Al final, completá tus datos y dibujá tu firma con el dedo o el mouse.<br>3. Tocá el botón verde para enviarle el contrato firmado a ' + esc(p.alias) + " por WhatsApp.</div>";
  h += '<div id="ui-integridad" class="ui-caja ui ui-mal">' + sinJs + "</div>";
  h += '<div class="doc-wrap">' + renderContrato(st, cfg) + "</div>";

  h += '<div id="ui-sin-js" class="ui-caja ui ui-mal">' + sinJs + "</div>";
  h += '<div id="ui-sin-firmante" class="ui-caja ui ui-mal ui-oculto">Este archivo no tiene un firmante del cliente. Pedile a ' + esc(p.alias) + " una copia nueva.</div>";
  h += '<div id="ui-form" class="ui-caja ui ui-form ui-oculto"><h2>FIRMAR ESTE CONTRATO</h2>';
  if (listaCliente.length === 1) {
    h += '<p id="ui-firmante-txt" style="margin:0 0 8px;font-size:15px">Firmo como <b>' + esc(etiquetaFirmante(listaCliente[0])) + "</b></p>";
    h += '<input type="hidden" id="ui-firmante" value="' + esc(listaCliente[0].key) + '">';
  } else {
    h += '<p id="ui-firmante-txt" class="ui-oculto" style="margin:0 0 8px;font-size:15px"></p>';
    h += '<label for="ui-firmante">Firmo como</label><select id="ui-firmante">' + htmlOpcionesFirmante(listaCliente) + "</select>";
    h += '<p style="color:#9aa4ad;font-size:13px;margin:6px 0 10px">Hay <b>' + listaCliente.length + " artistas</b>. Cada uno elige <b>su</b> nombre, firma, y le pasa este mismo archivo al otro (o te lo mandan los dos).</p>";
  }
  var f0 = listaCliente.length === 1 ? (listaCliente[0] || {}) : {};
  h += '<div class="ui-grid"><div><label for="ui-nombre">Nombre legal completo</label><input id="ui-nombre" type="text" autocomplete="name" value="' + esc(f0.nombre || "") + '"></div>';
  h += '<div><label for="ui-doc">Cédula / DNI (opcional)</label><input id="ui-doc" type="text" value="' + esc(f0.documento || "") + '"></div></div>';
  h += '<label for="ui-email">Email</label><input id="ui-email" type="email" autocomplete="email" value="' + esc(f0.email || "") + '">';
  h += '<label class="ui-check"><input id="ui-acepto" type="checkbox"><span>Leí el contrato completo, incluidos sus anexos, y acepto todos sus términos.</span></label>';
  h += '<label class="ui-check"><input id="ui-datos" type="checkbox"><span>Confirmo que los datos ingresados son míos y que esta firma electrónica tiene para mí el mismo valor que mi firma manuscrita.</span></label>';
  h += '<label>Tu firma</label><canvas id="ui-pad" class="ui-pad"></canvas>';
  h += '<div class="ui-botones"><button id="ui-limpiar" class="ui-btn" type="button">BORRAR</button><button id="ui-firmar" class="ui-btn primario" type="button">FIRMAR</button></div></div>';

  h += '<div id="ui-listo" class="ui-caja ui ui-ok ui-oculto"><h2>¡FIRMA REGISTRADA!</h2>Tocá <b>ENVIAR FIRMADO POR WHATSAPP</b>: se abre WhatsApp con el archivo listo, elegí el chat de ' + esc(p.alias) + " y enviá. Guardá también una copia para vos.";
  h += '<div class="ui-botones">';
  if (wa) h += '<button id="ui-whatsapp" class="ui-btn primario" type="button" style="background:#25d366;color:#04140a">ENVIAR FIRMADO POR WHATSAPP</button>';
  h += '<button id="ui-descargar" class="ui-btn' + (wa ? "" : " primario") + '" type="button">DESCARGAR COPIA FIRMADA</button>';
  h += '<button id="ui-pdf" class="ui-btn" type="button">GUARDAR COMO PDF</button>';
  if (p.email) h += '<a class="ui-btn" href="mailto:' + esc(p.email) + "?subject=" + encodeURIComponent("Contrato " + st.id + " firmado") + "&body=" + msg + '">ENVIAR POR EMAIL</a>';
  h += "</div></div>";

  h += '<script type="application/json" id="datos-firma">' + JSON.stringify(datos).replace(/</g, "\\u003c") + "</script>";
  h += "<script>" + funciones + "\n\n(" + scriptPaquete.toString() + ")();</script>";
  h += "</body></html>";
  return h;
}

/* Lee un contrato firmado (HTML devuelto por el cliente) y devuelve sus firmas. */
function leerPaqueteFirmado(textoHtml) {
  var doc = new DOMParser().parseFromString(textoHtml, "text/html");
  var nodo = doc.getElementById("datos-firma");
  if (!nodo) throw new Error("El archivo no es un contrato generado por este programa.");
  var datos = JSON.parse(nodo.textContent);
  datos.hashActual = sha256(textoParaHash(doc));
  return datos;
}
