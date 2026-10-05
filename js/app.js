/* Programa de contratos CLARENY / GRAYKIDS RECORDS. */

var LS_CONFIG = "clareny_config_v1";
var LS_CONTRATOS = "clareny_contratos_v1";
var LS_ACTUAL = "clareny_actual_v1";

var cfg, st, contratos;
var tabActual = "contrato";
var hashActual = "";
var zoom = 0;

var MONEDAS = ["USD", "UYU", "EUR", "PEN", "ARS", "MXN", "CLP", "COP", "BRL"];
var ROLES = ["Artista / Autor", "Artista", "Autor / Compositor", "Intérprete", "Productor invitado", "Sello", "Otro"];
var FORMAS_PAGO = ["Transferencia bancaria", "PayPal", "Mercado Pago", "Efectivo", "Transferencia bancaria / PayPal", "Prex / Mi Dinero", "Western Union"];

var TABS = [
  ["contrato", "Contrato"],
  ["cliente", "Cliente y artistas"],
  ["servicios", "Servicios y montos"],
  ["plazos", "Plazos y pagos"],
  ["clausulas", "Cláusulas"],
  ["firmas", "Firmas"],
  ["config", "Mis datos"],
  ["guia", "Guía de firma"],
];

/* ---------- utilidades ---------- */

function clonar(o) { return JSON.parse(JSON.stringify(o)); }
function hoyISO() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function $(id) { return document.getElementById(id); }

function obtener(obj, ruta) {
  return ruta.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
}
function asignar(obj, ruta, valor) {
  var partes = ruta.split(".");
  var o = obj;
  for (var i = 0; i < partes.length - 1; i++) {
    if (o[partes[i]] == null) o[partes[i]] = /^\d+$/.test(partes[i + 1]) ? [] : {};
    o = o[partes[i]];
  }
  o[partes[partes.length - 1]] = valor;
}
function raiz(ruta) { return ruta.indexOf("cfg:") === 0 ? { obj: cfg, ruta: ruta.slice(4) } : { obj: st, ruta: ruta }; }
function valor(ruta) { var r = raiz(ruta); var v = obtener(r.obj, r.ruta); return v == null ? "" : v; }

function toast(msg) {
  var t = $("toast");
  t.textContent = msg;
  t.classList.add("ver");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(function () { t.classList.remove("ver"); }, 2600);
}

function descargarBlob(blob, nombre) {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

function nombreArchivo() {
  var cli = nombreCliente(st) || "cliente";
  var limpio = function (s) { return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9-]+/g, "_").replace(/^_|_$/g, ""); };
  return "Contrato_" + limpio(st.id) + "_" + limpio(cli);
}

/* ---------- campos de formulario ---------- */

function campo(etq, ruta, o) {
  o = o || {};
  var v = valor(ruta);
  var attrs = ' data-k="' + ruta + '"' + (o.re ? ' data-re="1"' : "") + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + (o.list ? ' list="' + o.list + '"' : "");
  var control;
  if (o.tipo === "area") control = "<textarea" + attrs + ' rows="' + (o.filas || 3) + '">' + esc(v) + "</textarea>";
  else if (o.opciones) {
    control = "<select" + attrs + ">" + o.opciones.map(function (op) {
      var val = Array.isArray(op) ? op[0] : op, txt = Array.isArray(op) ? op[1] : op;
      return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? " selected" : "") + ">" + esc(txt) + "</option>";
    }).join("") + "</select>";
  } else control = '<input type="' + (o.tipo || "text") + '"' + attrs + ' value="' + esc(v) + '"' + (o.tipo === "number" ? ' step="' + (o.step || "any") + '" min="' + (o.min != null ? o.min : 0) + '"' : "") + ">";
  return '<label class="f' + (o.cls ? " " + o.cls : "") + '"><span>' + etq + "</span>" + control + "</label>";
}

function check(etq, ruta, o) {
  o = o || {};
  return '<label class="chk' + (o.cls ? " " + o.cls : "") + '"><input type="checkbox" data-k="' + ruta + '"' + (o.re ? ' data-re="1"' : "") + (valor(ruta) ? " checked" : "") + "><span>" + etq + "</span></label>";
}

function opciones(ruta, mapa, descripciones) {
  var v = valor(ruta);
  return '<div class="opciones">' + Object.keys(mapa).map(function (k) {
    var nombre = typeof mapa[k] === "string" ? mapa[k] : mapa[k].nombre;
    var desc = descripciones ? descripciones[k] : typeof mapa[k] === "object" ? mapa[k].detalle : "";
    return '<button type="button" class="opcion' + (v === k ? " sel" : "") + '" data-opcion="' + ruta + '" data-valor="' + k + '"><b>' + esc(nombre) + "</b>" + (desc ? "<small>" + esc(desc) + "</small>" : "") + "</button>";
  }).join("") + "</div>";
}

function opcionesChicas(ruta, mapa) {
  var v = valor(ruta);
  return '<div class="opciones-chicas">' + Object.keys(mapa).map(function (k) {
    return '<button type="button" class="opcion-chica' + (v === k ? " sel" : "") + '" data-opcion="' + ruta + '" data-valor="' + k + '">' + esc(mapa[k]) + "</button>";
  }).join("") + "</div>";
}

/* ---------- estado y guardado ---------- */

function nuevoTrack(servicioId, titular) {
  var s = servicioPorId(cfg, servicioId || "remake");
  var tr = { titulo: "", servicio: s.id, servicioNombre: "", cantidad: 1, precio: s.precio || 0, revisiones: s.revisiones, stems: !!s.stems && s.id === "stems", titular: titular || "", entrega: "", estado: "Pendiente",
    precioModo: Number(s.precio) > 0 ? "precio" : "cotizar", gratis: false };
  return completarEntrega(tr);
}

function completarPrecio(tr, firmado) {
  if (firmado || tr.precioModo) {
    if (tr.precioModo) tr.gratis = tr.precioModo === "gratis";
    return tr;
  }
  if (tr.gratis) tr.precioModo = "gratis";
  else if (!(Number(tr.precio) > 0)) tr.precioModo = "cotizar";
  else tr.precioModo = "precio";
  tr.gratis = tr.precioModo === "gratis";
  return tr;
}

function completarEntrega(tr) {
  if (!tr.entregable) tr.entregable = entregaDefecto(cfg, tr.servicio);
  if (!tr.formato) tr.formato = tr.servicio === "stems" ? "wav24" : "wav16";
  if (tr.mp3 == null) tr.mp3 = tr.servicio !== "stems" && tr.servicio !== "grabacion";
  if (tr.stemsPrecio == null) tr.stemsPrecio = 0;
  if (tr.entregaNota == null) tr.entregaNota = "";
  return tr;
}

function nuevoArtista(comp) {
  return { nombre: "", artistico: "", documento: "", rol: "Artista / Autor", email: "", comp: comp || 0, ipi: "", sociedad: "", editorial: "", firma: true };
}

var SOCIEDADES = ["BMI", "ASCAP", "SESAC", "AGADU", "SADAIC", "APDAYC", "SACM", "SGAE", "SCD", "SAYCO", "UBC", "ECAD"];

function siguienteId() {
  var anio = String(new Date().getFullYear());
  var n = (cfg.contador[anio] || 0) + 1;
  var id;
  do {
    id = (cfg.prefijoId || "WFH") + "-" + anio + "-" + ("00" + n).slice(-3);
    n++;
  } while (contratos[id]);
  cfg.contador[anio] = n - 1;
  return id;
}

function nuevoContrato() {
  var base = cfg.clausulas && cfg.clausulas.length ? cfg.clausulas : CLAUSULAS_BASE;
  var cond = cfg.condiciones || DEFAULT_CONFIG.condiciones;
  var comp = cond.compProductor === "si" ? Math.min(100, Math.max(0, Number(cond.productorComp) || 0)) : 0;
  var c = {
    id: siguienteId(), version: "1.0", fecha: hoyISO(), titulo: "", proyecto: "", tiposTrabajoV1: true, tipoTrabajo: "auto",
    tipoCliente: "individual", modalidad: "unidad", activacion: "cancion", moneda: cfg.monedaDefecto || "USD",
    cliente: { razon: "", artistico: "", documento: "", representante: "", cargo: "", repDocumento: "", email: "", telefono: "", domicilio: "" },
    artistas: [nuevoArtista(Math.round((100 - comp) * 100) / 100)], productorComp: comp, compProductor: comp > 0 ? "si" : "no",
    regalias: cond.regalias === "puntos" ? "puntos" : "no", puntosPct: Number(cond.puntosPct) || 3, puntosPeriodo: cond.puntosPeriodo || "semestral",
    tracks: [], precioPaquete: 0, descuento: 0, anticipoPct: 50,
    plazoNum: 2, plazoUnidad: "semanas", custodiaDias: 90, recuperacion: "", stemsTarifa: "", formaPago: "Transferencia bancaria / PayPal",
    observaciones: "", condicionEspecial: "", ley: "la República Oriental del Uruguay", jurisdiccion: "Montevideo, Uruguay",
    clausulas: clonar(base).map(function (c) { c.incluir = c.incluir || "auto"; return c; }),
    entregaV2: true, tiposV2: true, bmi200: true, detalleV2: true, masterV2: true, colabTerceros: false, anexoEmail: true, partesV2: true, partesV3: true, resumenDerechos: true, nombresV1: true, artisticosV1: true, claridadV1: true, guiaArtistas: true, repartoMasterV1: true, alcanceV1: true, colNombreV1: true, formatoObraV1: true, formatoObra: "sencillo", saldoPlazoV1: true, saldoPlazoNum: 5, saldoPlazoUnidad: "habiles", derechosPistaV1: true,
    trabajoPrevio: false, anticipoPagado: false, anticipoFechaPago: "", saldoPagado: false, saldoFechaPago: "", productorEditorial: "", distribuidora: "", leyAutor: LEY_AUTOR_URUGUAY, firmas: {}, creado: new Date().toISOString(), modificado: new Date().toISOString(),
  };
  asegurarPlazoSaldoEnClausula(c.clausulas);
  asegurarRepartoPorPistaEnClausula(c.clausulas);
  return c;
}

function cargar() {
  try { cfg = JSON.parse(localStorage.getItem(LS_CONFIG)); } catch (e) { cfg = null; }
  if (!cfg) cfg = clonar(DEFAULT_CONFIG);
  normalizarConfig();
  try { contratos = JSON.parse(localStorage.getItem(LS_CONTRATOS)) || {}; } catch (e) { contratos = {}; }
  migrarRegalias();
  var actual = localStorage.getItem(LS_ACTUAL);
  st = actual && contratos[actual] ? contratos[actual] : null;
  if (!st) { st = nuevoContrato(); contratos[st.id] = st; }
}

function normalizarConfig() {
  cfg.productor = Object.assign(clonar(DEFAULT_CONFIG.productor), cfg.productor || {});
  cfg.contador = cfg.contador || {};
  cfg.condiciones = Object.assign(clonar(DEFAULT_CONFIG.condiciones), cfg.condiciones || {});
  if (!cfg.servicios || !cfg.servicios.length) cfg.servicios = clonar(DEFAULT_CONFIG.servicios);
  for (var i = DEFAULT_CONFIG.servicios.length - 1; i >= 0; i--) {
    var s = DEFAULT_CONFIG.servicios[i];
    if (cfg.servicios.some(function (x) { return x.id === s.id; })) continue;
    var antes = DEFAULT_CONFIG.servicios[i + 1];
    var j = antes ? cfg.servicios.map(function (x) { return x.id; }).indexOf(antes.id) : -1;
    cfg.servicios.splice(j >= 0 ? j : cfg.servicios.length, 0, clonar(s));
  }
}

/* Agrega la cláusula de regalías a contratos y plantillas creados antes de que existiera.
   Los contratos con firmas no se tocan: cambiar su texto invalidaría el código de verificación. */
function insertarClausulaRegalias(lista) {
  if (!lista || lista.some(function (c) { return c.id === "c22"; })) return;
  var base = CLAUSULAS_BASE.filter(function (c) { return c.id === "c22"; })[0];
  var nueva = Object.assign(clonar(base), { incluir: "auto" });
  var i = lista.map(function (c) { return c.id; }).indexOf("c6");
  lista.splice(i >= 0 ? i + 1 : lista.length, 0, nueva);
}

/* Reemplaza la cláusula de entrega anterior (solo WAV + MP3) por la que remite al "Formato de entrega". */
function actualizarClausulaEntrega(lista) {
  var nueva = CLAUSULAS_BASE.filter(function (c) { return c.id === "c11"; })[0];
  (lista || []).forEach(function (c) {
    if (c.id === "c11" && /^Salvo que el Anexo B indique algo diferente, la entrega base comprende/.test(c.texto || "")) c.texto = nueva.texto;
  });
}

/* Agrega a la cláusula de composición el párrafo del sistema 200 %, si todavía no lo tiene. */
function actualizarClausulaBMI(lista) {
  var base = CLAUSULAS_BASE.filter(function (c) { return c.id === "c6"; })[0];
  var parrafo = base.texto.slice(base.texto.indexOf("**Registro en sistema 200%:**"));
  (lista || []).forEach(function (c) {
    if (c.id === "c6" && (c.texto || "").indexOf("sistema 200%") < 0) c.texto = (c.texto || "").replace(/\s+$/, "") + "\n\n" + parrafo;
  });
}

var PARRAFO_COMPOSICION_ANTERIOR = "**Regalías de la composición:** cada autor percibirá directamente de su sociedad de gestión colectiva las regalías autorales (ejecución pública, reproducción mecánica y demás) en la proporción consignada en el Anexo A. La cesión del Master no transfiere ni reduce la participación autoral de ninguna de las partes. Las partes registrarán la obra con esos mismos porcentajes y se facilitarán los datos necesarios para ello (nombre legal, IPI y sociedad de gestión).";

function actualizarParrafoComposicion(lista) {
  var base = CLAUSULAS_BASE.filter(function (c) { return c.id === "c22"; })[0].texto;
  var nuevo = base.slice(base.indexOf("**Regalías de la composición"), base.indexOf("\n\n**Editorial"));
  (lista || []).forEach(function (c) {
    if (c.id === "c22" && c.texto) c.texto = c.texto.replace(PARRAFO_COMPOSICION_ANTERIOR, nuevo);
  });
}

function agregarParrafoLeyAutor(lista) {
  var base = CLAUSULAS_BASE.filter(function (c) { return c.id === "c21"; })[0].texto;
  var parrafo = base.slice(base.indexOf("En materia de derechos de autor"), base.indexOf("\n\nLas partes procurarán"));
  (lista || []).forEach(function (c) {
    if (c.id !== "c21" || !c.texto || c.texto.indexOf("{{ley_autor}}") >= 0) return;
    var i = c.texto.indexOf("\n\nLas partes procurarán");
    c.texto = i >= 0 ? c.texto.slice(0, i) + "\n\n" + parrafo + c.texto.slice(i) : c.texto.replace(/\s+$/, "") + "\n\n" + parrafo;
  });
}

/* Cláusulas de alcance (c23) y de registro de regalías (c24), y la constancia de pagos en la de pago (c4). */
function agregarClausulasClaridad(lista) {
  if (!lista) return;
  [["c23", "c2"], ["c24", "c22"]].forEach(function (par) {
    if (lista.some(function (c) { return c.id === par[0]; })) return;
    var nueva = Object.assign(clonar(CLAUSULAS_BASE.filter(function (c) { return c.id === par[0]; })[0]), { incluir: "auto" });
    var i = lista.map(function (c) { return c.id; }).indexOf(par[1]);
    lista.splice(i >= 0 ? i + 1 : lista.length, 0, nueva);
  });
  lista.forEach(function (c) {
    if (c.id === "c4" && c.texto && c.texto.indexOf("{{estado_pago}}") < 0) c.texto = c.texto.replace(/\s+$/, "") + "\n\n{{estado_pago}}";
  });
}

/* Inserta el plazo del saldo en la cláusula de pago. Vacío si ya está pagado. Nunca en contratos firmados. */
function asegurarPlazoSaldoEnClausula(lista) {
  (lista || []).forEach(function (c) {
    if (c.id !== "c4" || !c.texto || c.texto.indexOf("{{plazo_saldo}}") >= 0) return;
    if (c.texto.indexOf("{{estado_pago}}") >= 0) c.texto = c.texto.replace("{{estado_pago}}", "{{plazo_saldo}}\n\n{{estado_pago}}");
    else c.texto = c.texto.replace(/\s+$/, "") + "\n\n{{plazo_saldo}}";
  });
}

/* Master y composición por canción. Vacío si todas usan el criterio general. Nunca en contratos firmados. */
function asegurarRepartoPorPistaEnClausula(lista) {
  (lista || []).forEach(function (c) {
    if (c.id !== "c22" || !c.texto || c.texto.indexOf("{{reparto_por_pista}}") >= 0) return;
    c.texto = c.texto.replace(/\s+$/, "") + "\n\n{{reparto_por_pista}}";
  });
}

/* La cláusula de registro nombra la sociedad y la editorial del productor solo si recibe composición. */
function actualizarClausulaRegistro(lista) {
  (lista || []).forEach(function (c) {
    if (c.id !== "c24" || !c.texto) return;
    c.texto = c.texto.replace(" EL PRODUCTOR lo hace a través de {{pro}} (IPI {{ipi}}).", "{{registro_pro_productor}}")
      .replace(" EL PRODUCTOR lo hace a través de {{editorial_productor}}.", "{{registro_editorial_productor}}");
  });
}

/* Producción vs. servicio de audio: cláusulas c25/c26, condiciones "produccion" y placeholders de créditos y porcentajes. */
var PARRAFO_VOCES_ARTISTA = CLAUSULAS_BASE.filter(function (c) { return c.id === "c13"; })[0].texto.split("\n\n").pop();

function actualizarClausulasTipoTrabajo(lista) {
  if (!lista) return;
  lista.forEach(function (c) {
    if (!c.texto) return;
    if (c.id === "c23") c.texto = c.texto.replace(PORCENTAJES_OBRA, "{{porcentajes_obra}}");
    if (c.id === "c16") c.texto = c.texto.replace(CREDITOS_PRODUCCION, "{{creditos}}");
    if (["c5", "c6", "c22", "c24"].indexOf(c.id) >= 0 && c.cond === "siempre") c.cond = "produccion";
    if (c.id === "c13" && c.texto.indexOf("Voces grabadas por el artista") < 0) c.texto = c.texto.replace(/\s+$/, "") + "\n\n" + PARRAFO_VOCES_ARTISTA;
  });
  ["c26", "c25"].forEach(function (id) {
    if (lista.some(function (c) { return c.id === id; })) return;
    var nueva = Object.assign(clonar(CLAUSULAS_BASE.filter(function (c) { return c.id === id; })[0]), { incluir: "auto" });
    var i = lista.map(function (c) { return c.id; }).indexOf("c4");
    lista.splice(i >= 0 ? i + 1 : lista.length, 0, nueva);
  });
}

/* Catálogo con precios y "derechos": primero se congelan los textos de los contratos firmados, después se actualiza
   solo lo que sigue igual al valor anterior (lo que editaste en "Mis datos" se respeta). */
function migrarCatalogo() {
  Object.keys(contratos).forEach(function (k) {
    var c = contratos[k];
    if (Object.keys(c.firmas || {}).length) congelarTextosServicios(c, cfg);
  });
  cfg.servicios.forEach(function (s) {
    var base = DEFAULT_CONFIG.servicios.filter(function (x) { return x.id === s.id; })[0];
    if (!base) return;
    var antes = SERVICIOS_ANTERIORES[s.id] || {};
    Object.keys(antes).forEach(function (campo) { if (s[campo] === antes[campo]) s[campo] = base[campo]; });
    if (!s.derechos) s.derechos = base.derechos;
    if (!(Number(s.precio) > 0) && base.precio > 0) { s.precio = base.precio; s.moneda = base.moneda; }
  });
  cfg.servicios.forEach(function (s) { if (!s.moneda) s.moneda = cfg.monedaDefecto || "USD"; });
}

function rellenarIncluyeCatalogo() {
  cfg.servicios.forEach(function (s) {
    var base = DEFAULT_CONFIG.servicios.filter(function (x) { return x.id === s.id; })[0];
    if (!base) return;
    if (!(s.incluye != null && String(s.incluye).trim() !== "") && base.incluye) s.incluye = base.incluye;
  });
}

function migrarAlcance() {
  Object.keys(contratos).forEach(function (k) {
    var c = contratos[k];
    if (Object.keys(c.firmas || {}).length) {
      congelarTextosServicios(c, cfg);
      (c.tracks || []).forEach(function (t) { if (t.noIncluyeFijo == null) t.noIncluyeFijo = ""; });
    } else c.alcanceV1 = true;
  });
  cfg.servicios.forEach(function (s) {
    var base = DEFAULT_CONFIG.servicios.filter(function (x) { return x.id === s.id; })[0];
    if (!base) return;
    if (INCLUYE_ANTERIOR[s.id] != null && s.incluye === INCLUYE_ANTERIOR[s.id]) s.incluye = base.incluye;
    if (!(s.noIncluye != null && String(s.noIncluye).trim() !== "") && base.noIncluye) s.noIncluye = base.noIncluye;
  });
}

function migrarRegalias() {
  if (!cfg.migCatalogoV2) migrarCatalogo();
  cfg.migCatalogoV2 = true;
  if (!cfg.migCatalogoIncluye) rellenarIncluyeCatalogo();
  cfg.migCatalogoIncluye = true;
  if (!cfg.migAlcanceV1) migrarAlcance();
  cfg.migAlcanceV1 = true;
  if (cfg.clausulas && !cfg.migTipoTrabajo) actualizarClausulasTipoTrabajo(cfg.clausulas);
  cfg.migTipoTrabajo = true;
  actualizarClausulaRegistro(cfg.clausulas);
  if (cfg.clausulas && cfg.clausulas.length && !cfg.migClaridad) agregarClausulasClaridad(cfg.clausulas);
  cfg.migClaridad = true;
  if (cfg.clausulas && !cfg.migComposicion) actualizarParrafoComposicion(cfg.clausulas);
  cfg.migComposicion = true;
  if (cfg.clausulas && !cfg.migLeyAutor) agregarParrafoLeyAutor(cfg.clausulas);
  cfg.migLeyAutor = true;
  if (cfg.clausulas && cfg.clausulas.length && !cfg.migRegalias) insertarClausulaRegalias(cfg.clausulas);
  cfg.migRegalias = true;
  if (cfg.clausulas && !cfg.migEntrega) actualizarClausulaEntrega(cfg.clausulas);
  cfg.migEntrega = true;
  if (cfg.clausulas && !cfg.migBMI) actualizarClausulaBMI(cfg.clausulas);
  cfg.migBMI = true;
  var mezcla = servicioPorId(cfg, "mezcla");
  if (!cfg.migMezclaVocal && mezcla.id === "mezcla" && mezcla.unidad === "canción") {
    Object.keys(contratos).forEach(function (k) {
      var c = contratos[k];
      if (!Object.keys(c.firmas || {}).length) return;
      (c.tracks || []).forEach(function (tr) { if (tr.servicio === "mezcla" && !tr.unidad) tr.unidad = "canción"; });
    });
    mezcla.unidad = "vocal";
    mezcla.sinTitulo = true;
  }
  cfg.migMezclaVocal = true;
  var editorialAnterior = !cfg.migEditorial && cfg.productor && cfg.productor.editorial === "ONErpm Publishing";
  if (editorialAnterior) cfg.productor.editorial = "Symphonic Latin";
  cfg.migEditorial = true;
  var editorialSymphonic = !cfg.migBeatStars && cfg.productor && cfg.productor.editorial === "Symphonic Latin";
  if (editorialSymphonic) cfg.productor.editorial = "BeatStars Publishing";
  cfg.migBeatStars = true;
  Object.keys(contratos).forEach(function (k) {
    var c = contratos[k];
    var firmado = Object.keys(c.firmas || {}).length > 0;
    if (editorialAnterior && firmado && c.bmi200 && !c.productorEditorial) c.productorEditorial = "ONErpm Publishing";
    if (editorialSymphonic && firmado && c.bmi200 && !c.productorEditorial) c.productorEditorial = "Symphonic Latin";
    if (!c.regalias) {
      c.regalias = "no"; c.puntosPct = 3; c.puntosPeriodo = "semestral";
      if (!firmado) insertarClausulaRegalias(c.clausulas);
    }
    if (!c.compProductor) c.compProductor = Number(c.productorComp) > 0 ? "si" : "no";
    if (!c.tiposV2 && !firmado) c.tiposV2 = true;
    if (!firmado && c.resumenDerechos) c.repartoMasterV1 = true;
    if (!firmado) actualizarParrafoComposicion(c.clausulas);
    if (!firmado) c.detalleV2 = true;
    if (!firmado && !c.masterV2) { c.masterV2 = true; c.colabTerceros = false; }
    if (!firmado && !c.nombresV1) {
      (c.artistas || []).forEach(function (a) { if (a.nombre) a.nombre = nombrePropio(a.nombre); });
      if (c.cliente) {
        if (c.cliente.razon && c.tipoCliente !== "sello") c.cliente.razon = nombrePropio(c.cliente.razon);
        if (c.cliente.representante) c.cliente.representante = nombrePropio(c.cliente.representante);
      }
      c.nombresV1 = true;
    }
    if (!firmado && !c.artisticosV1) {
      (c.artistas || []).forEach(function (a) { if (a.artistico) a.artistico = nombreArtistico(a.artistico); });
      if (c.cliente && c.cliente.artistico && c.tipoCliente !== "sello") c.cliente.artistico = nombreArtistico(c.cliente.artistico);
      c.artisticosV1 = true;
    }
    if (!firmado) { c.anexoEmail = true; c.partesV2 = true; c.partesV3 = true; c.resumenDerechos = true; }
    if (!firmado && !c.claridadV1) {
      agregarClausulasClaridad(c.clausulas);
      c.claridadV1 = true;
      c.guiaArtistas = true;
    }
    if (!firmado) actualizarClausulaRegistro(c.clausulas);
    if (!firmado && c.leyAutor == null) {
      c.leyAutor = LEY_AUTOR_URUGUAY;
      agregarParrafoLeyAutor(c.clausulas);
    }
    if (!c.bmi200 && !firmado) {
      c.bmi200 = true;
      actualizarClausulaBMI(c.clausulas);
    }
    if (!c.entregaV2 && !firmado) {
      c.entregaV2 = true;
      (c.tracks || []).forEach(completarEntrega);
      actualizarClausulaEntrega(c.clausulas);
    }
    if (!firmado && !c.tiposTrabajoV1) {
      actualizarClausulasTipoTrabajo(c.clausulas);
      c.tiposTrabajoV1 = true;
      c.tipoTrabajo = c.tipoTrabajo || "auto";
      if (c.titulo === TIPOS_TRABAJO.produccion.titulo) c.titulo = "";
    }
    if (!firmado) (c.tracks || []).forEach(function (t) { completarPrecio(t, false); });
    if (!firmado) c.colNombreV1 = true;
    if (!firmado) c.formatoObraV1 = true;
    if (!firmado) (c.artistas || []).forEach(function (a) { if (a.firma == null) a.firma = true; });
    if (!firmado) {
      c.saldoPlazoV1 = true;
      if (!(Number(c.saldoPlazoNum) > 0)) c.saldoPlazoNum = 5;
      if (!c.saldoPlazoUnidad) c.saldoPlazoUnidad = "habiles";
      asegurarPlazoSaldoEnClausula(c.clausulas);
    }
    if (!firmado) {
      c.derechosPistaV1 = true;
      asegurarRepartoPorPistaEnClausula(c.clausulas);
    }
  });
  if (cfg.clausulas) asegurarPlazoSaldoEnClausula(cfg.clausulas);
  if (cfg.clausulas) asegurarRepartoPorPistaEnClausula(cfg.clausulas);
}

var eliminados = {};

function guardar() {
  st.modificado = new Date().toISOString();
  Object.keys(contratos).forEach(function (k) {
    if (contratos[k] === st && k !== st.id) { delete contratos[k]; eliminados[k] = true; }
  });
  contratos[st.id] = st;
  /* Si el programa está abierto en otra pestaña, no pisar los contratos que creó allí. */
  try {
    var enDisco = JSON.parse(localStorage.getItem(LS_CONTRATOS)) || {};
    Object.keys(enDisco).forEach(function (k) { if (!contratos[k] && !eliminados[k]) contratos[k] = enDisco[k]; });
  } catch (e) { /* almacenamiento ilegible: se reescribe con lo que hay en memoria */ }
  try {
    localStorage.setItem(LS_CONFIG, JSON.stringify(cfg));
    localStorage.setItem(LS_CONTRATOS, JSON.stringify(contratos));
    localStorage.setItem(LS_ACTUAL, st.id);
    $("estado-texto").textContent = "Guardado " + new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
    programarSync();
  } catch (e) {
    $("estado-texto").textContent = "¡No se pudo guardar! Hacé una copia de seguridad.";
  }
}

var timerCambio;
function alCambiar(inmediato) {
  if (st.tipoCliente === "individual") {
    if (!st.artistas.length) st.artistas.push(nuevoArtista(100));
    var a = st.artistas[0], c = st.cliente;
    a.nombre = c.razon; a.artistico = c.artistico; a.documento = c.documento; a.email = c.email;
  }
  clearTimeout(timerCambio);
  timerCambio = setTimeout(function () { guardar(); renderVista(); actualizarCalculos(); }, inmediato ? 0 : 220);
}

function clasePildora(tr) {
  var m = modoPrecio(tr);
  if (m === "cotizar") return "cotizar";
  if (m === "pagado") return "pagado";
  return "on";
}
function textoPildora(tr, mon) {
  var m = modoPrecio(tr);
  if (m === "cotizar") return "A cotizar";
  if (m === "gratis") return "FREE";
  var p = formatoMoneda(subtotalTrack(tr), mon);
  return m === "pagado" ? p + " · pagado" : p;
}

function campoPrecio(tr, i, s) {
  var firmado = Object.keys(st.firmas || {}).length > 0;
  completarPrecio(tr, firmado);
  var modo = modoPrecio(tr);
  if (firmado) {
    var etqF = "Precio por " + esc(s.unidad) + " (" + esc(st.moneda) + ")";
    if (modo === "gratis") return '<div class="f precio-destacado"><span>' + etqF + '</span><div class="free-pill">FREE · sin costo</div></div>';
    if (modo === "cotizar") return '<div class="f precio-destacado"><span>' + etqF + '</span><div class="free-pill cotizar">A cotizar</div></div>';
    return '<div class="f precio-destacado"><span>' + etqF + (modo === "pagado" ? " · ya cobrado" : "") + "</span>" +
      '<input type="number" step="0.01" min="0" data-k="tracks.' + i + '.precio" value="' + esc(valor("tracks." + i + ".precio")) + '"></div>';
  }
  var h = '<div class="span3 opciones-precio"><span class="sub-tit">¿Cómo cobrás este servicio?</span>';
  h += opciones("tracks." + i + ".precioModo", {
    precio: "Con precio",
    pagado: "Ya pagado",
    cotizar: "A cotizar",
    gratis: "Gratis",
  }, {
    precio: "Entra en el total. El cliente firma el monto.",
    pagado: "Ya lo cobraste. Deja constancia (sirve si firmás después).",
    cotizar: "Todavía no hay precio. El cliente puede firmar el alcance igual.",
    gratis: "Sin costo.",
  });
  if (modo === "gratis") h += '<div class="f precio-destacado"><span>Precio</span><div class="free-pill">FREE · sin costo</div></div>';
  else if (modo === "cotizar") h += '<div class="f precio-destacado"><span>Precio</span><div class="free-pill cotizar">A cotizar · no suma al total</div></div>';
  else {
    var etq = "Precio por " + esc(s.unidad) + " (" + esc(st.moneda) + ")" + (modo === "pagado" ? " · ya cobrado" : "");
    h += '<div class="f precio-destacado"><span>' + etq + "</span>" +
      '<input type="number" step="0.01" min="0" data-k="tracks.' + i + '.precio" value="' + esc(valor("tracks." + i + ".precio")) + '"></div>';
  }
  h += "</div>";
  return h;
}

/* Datos que pide cada servicio en clareny.com: sesión, género, tonalidad, enfoque y referencias. */
function bloqueDetalleServicio(tr, i) {
  var c = camposServicio(tr.servicio);
  var r = "tracks." + i + ".";
  var deCatalogo = incluyeServicio(cfg, { servicio: tr.servicio });
  var noCatalogo = noIncluyeServicio(cfg, { servicio: tr.servicio });
  var h = '<div class="sub-bloque"><span class="sub-tit">Paquete · qué incluye y qué no</span>';
  h += bloquePaquete(tr);
  h += '<div class="grid3">';
  if (tr.incluyeFijo == null) {
    h += campo("Qué incluye (Anexo B; podés personalizarlo para este cliente)", r + "incluye", { tipo: "area", filas: 3, cls: "span3", ph: deCatalogo ? "Del catálogo: " + deCatalogo : "Ítems separados por ;  — ej: Custom beat; Mezcla vocal; Master" });
    h += campo("Qué no incluye", r + "noIncluye", { tipo: "area", filas: 2, cls: "span3", ph: noCatalogo ? "Del catálogo: " + noCatalogo : "Ej: Grabación; Stems (adicional)" });
  }
  if (c.sesion) h += campo("Sesión", r + "sesion", { opciones: [["", "Sin definir"]].concat(Object.keys(SESIONES).map(function (k) { return [k, SESIONES[k]]; })), cls: "span3" });
  if (c.genero) {
    h += campo("Género", r + "genero", { list: "lista-generos", ph: "Elegí el género" });
    h += campo("Tonalidad · nota", r + "nota", { opciones: [["", "—"]].concat(NOTAS.map(function (n) { return [n, n]; })) });
    h += campo("Mayor / menor", r + "modo", { opciones: [["menor", "menor"], ["mayor", "mayor"]] });
  }
  if (c.enfoque) {
    h += '<div class="f span3"><span>Enfoque de la edición</span><div style="display:flex;gap:12px;flex-wrap:wrap">' +
      Object.keys(ENFOQUES_EDICION).map(function (k) { return check(ENFOQUES_EDICION[k], r + "enfoque." + k); }).join("") + "</div></div>";
  }
  h += campo("Referencias / mood", r + "referencias", { cls: "span3", ph: "Referencias, mood, cómo lo querés sentir…" });
  h += "</div></div>";
  if (c.genero) h += '<datalist id="lista-generos">' + GENEROS.map(function (g) { return '<option value="' + esc(g) + '">'; }).join("") + "</datalist>";
  return h;
}

function bloquePaquete(tr) {
  var inc = listaItems(incluyeServicio(cfg, tr)), no = listaItems(noIncluyeServicio(cfg, tr));
  if (!inc.length && !no.length) return "";
  var h = '<div class="paquete-alcance">';
  if (inc.length) h += '<div class="paq si"><span>Incluye</span><ul>' + inc.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
  if (no.length) h += '<div class="paq no"><span>No incluye</span><ul>' + no.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
  return h + "</div>";
}

var GRUPOS_CATALOGO = [
  ["produccion", "Producción · creás la canción (puede haber derechos de autor)"],
  ["audio", "Voces, mezcla y master · servicio técnico, sin derechos de autor"],
  ["extra", "Extras y personalizados"],
];

function grupoCatalogo(s) { return creaObra(s) ? "produccion" : s.grupo === "audio" ? "audio" : "extra"; }

function bannerTipoTrabajo() {
  if (!st.tiposTrabajoV1) return "";
  var tipo = tipoTrabajo(st, cfg), T = TIPOS_TRABAJO[tipo];
  var porque = st.tipoTrabajo === "produccion" || st.tipoTrabajo === "servicio" ? "elegido a mano en la pestaña “Contrato”"
    : !st.tracks.length ? "todavía no agregaste servicios" : tipo === "servicio" ? "solo hay servicios técnicos" : "hay un beat o una producción";
  return '<div class="aviso tipo-trabajo ' + tipo + '"><b>Tipo de trabajo: ' + esc(T.nombre) + "</b> · " + esc(porque) + "<br><small>" + esc(T.detalle) + "</small></div>";
}

function bannerDerechosPista() {
  if (!st.derechosPistaV1 || esServicio(st, cfg)) return "";
  var n = pistasConObra(st, cfg).length;
  if (!n) return "";
  if (n === 1) return '<div class="aviso info">En esta canción podés pactar el Master y la composición por separado: por ejemplo 0 % del Master y sí un % del beat, o un pedazo del Master y 0 % de composición.</div>';
  return '<div class="aviso info">Cada remake puede tener su propio % de Master y de composición. No se mezclan: en un tema te podés quedar un pedazo del Master y en otro <b>0 % del Master</b> pero sí el beat.</div>';
}

function bloqueDerechosPista(tr, i) {
  if (!st.derechosPistaV1 || esServicio(st, cfg) || !creaObra(servicioPorId(cfg, tr.servicio))) return "";
  if (!Object.keys(st.firmas || {}).length) {
    if (!tr.masterModo) tr.masterModo = "hereda";
    if (!tr.compModo) tr.compModo = "hereda";
  }
  var alias = cfg.productor.alias || "EL PRODUCTOR";
  var art = nombreTitularCorto(st);
  var mm = masterModoPista(tr);
  var cm = compModoPista(tr);
  var h = '<div class="sub-bloque bloque-derechos-pista">';
  h += '<span class="sub-tit">Derechos de esta canción · Master y composición son independientes</span>';
  h += '<p class="ayuda">El criterio general está en Cliente y artistas. Acá cambiás <b>solo este tema</b>.</p>';
  h += '<span class="mini-lbl">Master en este tema</span>';
  h += opciones("tracks." + i + ".masterModo", {
    hereda: "Igual que el contrato",
    no: "Nada del Master (0 %)",
    puntos: "Sí, un % del Master"
  }, {
    hereda: st.regalias === "puntos" ? ("Usás el " + String(st.puntosPct).replace(".", ",") + " % general.") : "Criterio general: 0 % del Master.",
    no: "Este remake es 100 % del artista. Vos cobrás solo el precio.",
    puntos: "Te quedás con un pedazo de este Master. El resto es del artista."
  });
  if (mm === "puntos") {
    h += '<div class="grid3" style="margin-top:8px">' + campo("Tu % del Master en este tema", "tracks." + i + ".puntosPct", { tipo: "number", step: "0.5", cls: "campo-pct" });
    h += '<div class="f span2"><span>Rápido</span><div style="display:flex;gap:4px;flex-wrap:wrap">' +
      listaRapidos(cfg.condiciones.rapidosMaster, [2, 3, 5, 10]).map(function (n) {
        return '<button class="btn chico" data-accion="puntos-pista" data-i="' + i + '" data-n="' + n + '">' + String(n).replace(".", ",") + " %</button>";
      }).join("") + "</div></div></div>";
  }
  h += '<span class="mini-lbl">Composición en este tema</span>';
  h += opciones("tracks." + i + ".compModo", {
    hereda: "Igual que el contrato",
    no: "Nada de composición (0 %)",
    si: "Sí, un % de la composición"
  }, {
    hereda: Number(st.productorComp) > 0 ? ("Usás el " + String(st.productorComp).replace(".", ",") + " % general del beat.") : "Criterio general: sin autoría.",
    no: "En este remake la composición es 100 % del artista.",
    si: "Te quedás con un % del beat de este tema, aunque no tengas Master."
  });
  if (cm === "si") {
    h += '<div class="grid3" style="margin-top:8px">' + campo("Tu % de composición en este tema", "tracks." + i + ".productorComp", { tipo: "number", step: "0.01", cls: "campo-pct" });
    h += '<div class="f span2"><span>Rápido</span><div style="display:flex;gap:4px;flex-wrap:wrap">' +
      listaRapidos(cfg.condiciones.rapidosComp, [25, 33.33, 50]).map(function (n) {
        return '<button class="btn chico" data-accion="comp-pista" data-i="' + i + '" data-n="' + n + '">' + String(n).replace(".", ",") + " %</button>";
      }).join("") +
      '<button class="btn chico violeta" data-accion="comp-pista" data-i="' + i + '" data-n="50">Beat 50 %</button></div></div></div>';
  }
  var mPct = pctMasterProductorPista(st, tr);
  var cPct = pctCompProductorPista(st, tr);
  h += '<p class="ayuda">En el contrato se ve: Master ' + esc(alias) + " <b>" + pctEsp(mPct) + "</b> · " + esc(art) + " <b>" + pctEsp(restoPct(mPct)) + "</b>. Comp. " + esc(alias) + " <b>" + pctEsp(cPct) + "</b> · " + esc(art) + " <b>" + pctEsp(restoPct(cPct)) + "</b>.</p>";
  return h + "</div>";
}

/* ---------- pestañas ---------- */

function renderTabs() {
  $("tabs").innerHTML = TABS.map(function (t, i) {
    return '<button type="button" class="tab' + (t[0] === tabActual ? " activa" : "") + '" data-tab="' + t[0] + '">' + (i < 6 ? '<span class="n">' + (i + 1) + "</span>" : "") + t[1] + "</button>";
  }).join("");
}

function renderTab() {
  var cuerpo = $("tab-body");
  var scroll = cuerpo.scrollTop;
  cuerpo.innerHTML = (VISTAS_TAB[tabActual] || VISTAS_TAB.contrato)();
  cuerpo.scrollTop = scroll;
  actualizarCalculos();
}

var VISTAS_TAB = {
  contrato: function () {
    var h = '<h3 class="sec">Identificación del contrato</h3><div class="grid3">';
    h += campo("ID del acuerdo", "id", { cls: "span2" }) + campo("Versión", "version");
    h += campo("Fecha", "fecha", { tipo: "date" }) + campo("Moneda", "moneda", { opciones: MONEDAS, cls: "span2" });
    if (!Object.keys(st.firmas || {}).length) st.formatoObraV1 = true;
    if (st.formatoObraV1) {
      var visto = textoObra(st);
      h += '<div class="span3 bloque-obra">';
      h += '<span class="sub-tit">¿Este acuerdo es un sencillo, un EP o un álbum?</span>';
      h += opciones("formatoObra", { sencillo: "Sencillo", ep: "EP", album: "Álbum" }, {
        sencillo: "Una canción. En todo el documento figura «Nombre — Sencillo».",
        ep: "Varias canciones. El nombre del proyecto es el del EP.",
        album: "Un álbum. Las pistas van en el Anexo B.",
      });
      h += campo("Nombre del proyecto", "proyecto", { ph: "Nombre de la canción, del EP o del álbum", re: true });
      if (visto) h += '<p class="hint-obra">Así se lee en cláusulas, resumen y anexos: <b>«' + esc(visto) + "»</b></p>";
      else h += '<p class="hint-obra">Tocá Sencillo, EP o Álbum y escribí el nombre. Se usa en todo el contrato.</p>';
      var primerNom = (st.tracks || []).map(function (t) { return tituloPista(t); }).filter(Boolean)[0];
      if (primerNom && String(st.proyecto || "").trim() !== primerNom)
        h += '<div class="fila-botones"><button type="button" class="btn chico" data-accion="obra-desde-pista">Usar «' + esc(primerNom) + "» del Anexo B</button></div>";
      h += "</div>";
    } else h += campo("Nombre del proyecto / canción / EP", "proyecto", { cls: "span3", ph: "Ej: EP “Noches” — 4 canciones" });
    h += campo("Título del documento", "titulo", { cls: "span3", ph: st.tiposTrabajoV1 ? "Automático: " + tituloDocumento(st, cfg) : "" });
    h += "</div>";
    if (st.tiposTrabajoV1) {
      h += '<h3 class="sec">¿Qué tipo de trabajo es?</h3>' + bannerTipoTrabajo();
      h += opciones("tipoTrabajo", { auto: "Automático (según los servicios)", produccion: "Producción musical", servicio: "Servicio de audio" }, {
        auto: "Recomendado. Con un beat o una producción es producción; si solo hay grabación, mezcla o master, es servicio.",
        produccion: TIPOS_TRABAJO.produccion.detalle,
        servicio: TIPOS_TRABAJO.servicio.detalle,
      });
    }
    h += '<h3 class="sec">¿Quién te contrata?</h3>' + opciones("tipoCliente", TIPOS_CLIENTE, {
      individual: "Una sola persona. Firma ella misma.",
      colab: "Artistas distintos que se juntan en una canción (feat.). Firma cada uno.",
      duo: "Dúo, banda o grupo con un nombre en común. Firma cada integrante.",
      sello: "Una empresa o sello. Firma su representante.",
    });
    h += '<h3 class="sec">¿Cómo te contrata?</h3>' + opciones("modalidad", MODALIDADES);
    h += '<h3 class="sec">Transferencia del Master</h3>' + opciones("activacion", { cancion: "Por canción", proyecto: "Por proyecto" }, {
      cancion: "Cada Master se entrega cuando se paga esa canción.", proyecto: "Los Masters se entregan cuando se paga todo el proyecto.",
    });
    h += '<h3 class="sec">Ley y jurisdicción</h3><div class="grid2">' + campo("Ley aplicable", "ley") + campo("Jurisdicción / ciudad", "jurisdiccion");
    h += campo("Ley de derechos de autor", "leyAutor", { tipo: "area", filas: 2, cls: "span2" }) + "</div>";
    h += '<div class="fila-botones"><button class="btn chico" data-accion="ley-autor-uy">Usar ley de Uruguay (Ley 9.739)</button></div>';
    return h;
  },

  cliente: function () {
    var t = st.tipoCliente;
    var h = '<h3 class="sec">' + (t === "sello" ? "Datos del sello / empresa" : t === "duo" ? "Datos de la agrupación" : t === "colab" ? "Datos del cliente · artista(s)" : "Datos del artista") + "</h3>";
    h += '<div class="aviso info">Tipo de cliente: <b>' + esc(nombreTipoCliente(st)) + '</b>. Podés cambiarlo en la pestaña “Contrato”.</div><div class="grid2">';
    if (t === "sello") {
      h += campo("Razón social", "cliente.razon") + campo("Nombre comercial", "cliente.artistico") + campo("RUT / Registro (opcional)", "cliente.documento");
      h += campo("Nombre del representante que firma", "cliente.representante") + campo("Cargo", "cliente.cargo", { ph: "Director, A&R, Socio…" }) + campo("Cédula / DNI del representante (opcional)", "cliente.repDocumento");
    } else if (t === "duo") {
      h += campo("Nombre de la agrupación", "cliente.artistico", { cls: "span2", ph: "Ej: nombre del dúo o banda" });
    } else if (t !== "colab") {
      h += campo("Nombre legal completo", "cliente.razon", { ph: "Como figura en la cédula" }) + campo("Nombre artístico", "cliente.artistico");
      h += campo("Cédula / DNI / Pasaporte (opcional)", "cliente.documento");
    }
    if (t === "sello" || t === "individual") h += campo(t === "sello" ? "Email del sello" : "Email", "cliente.email", { tipo: "email" });
    h += "</div>";
    var palabra = t === "duo" ? "integrante" : t === "individual" ? "coautor" : "artista";
    var calc = calcular(st);
    if (!st.compProductor) st.compProductor = Number(st.productorComp) > 0 ? "si" : "no";
    var alias = esc(cfg.productor.alias || "Productor");
    var servicio = esServicio(st, cfg);

    h += '<h3 class="sec">' + (servicio ? "1 · Artistas" : "1 · Artistas y derechos de composición") + "</h3>" + bannerTipoTrabajo();
    if (servicio) h += '<p class="ayuda">Como es un servicio de audio, <b>no reclamás derechos de autor</b>: la composición es 100 % de los artistas y no hace falta cargar porcentajes. Solo completá quiénes son y quién firma.</p>';
    else h += '<p class="ayuda">Cada artista tiene una sola tarjeta con sus datos personales, de registro y su porcentaje de la <b>composición</b> (música y letra). La composición suma <b>100 %</b>, contando tu parte de productor.</p>';
    if (t === "individual") h += '<p class="ayuda">El artista 1 es tu cliente: su nombre, cédula y email se cargan arriba.' + (servicio ? "" : " Agregá coautores solo si comparten la composición.") + "</p>";
    if (t === "colab" || t === "duo") h += '<p class="ayuda">Si son <b>dos artistas distintos</b>, cargá el nombre legal de cada uno. Los dos aparecen en «Firmo como»: cada uno elige el suyo y firma el mismo archivo.</p>';
    st.artistas.forEach(function (a, i) {
      var esCliente = t === "individual" && i === 0;
      h += '<div class="tarjeta"><div class="tarjeta-head"><span class="num">' + (i + 1) + '</span><span class="tit">' + esc(a.artistico || a.nombre || (t === "duo" ? "Integrante " : "Artista ") + (i + 1)) + "</span>";
      h += '<div class="tools">' + (esCliente ? '<span class="pill">cliente</span>' : '<button class="btn chico icono peligro" data-accion="quitar-artista" data-i="' + i + '" title="Quitar">✕</button>') + "</div></div>";
      if (!esCliente) {
        h += '<div class="tarjeta-grupo">Datos personales</div><div class="grid2">';
        h += campo("Nombre legal", "artistas." + i + ".nombre", { ph: "Como figura en la cédula", re: true }) + campo("Nombre artístico", "artistas." + i + ".artistico", { re: true });
        h += campo("Email", "artistas." + i + ".email", { tipo: "email" }) + campo("Cédula / DNI / Pasaporte (opcional)", "artistas." + i + ".documento");
        h += "</div>";
      }
      if (servicio) {
        h += '<div class="grid2">' + campo("Rol", "artistas." + i + ".rol", { list: "lista-roles" });
        h += t !== "individual" ? '<div class="f" style="justify-content:flex-end">' + check("Firma requerida", "artistas." + i + ".firma", { re: true }) + "</div>" : "<div></div>";
        h += "</div></div>";
        return;
      }
      h += '<div class="tarjeta-grupo">Composición y registro</div><div class="grid3">';
      h += campo("Rol", "artistas." + i + ".rol", { list: "lista-roles" }) + campo("Composición (%)", "artistas." + i + ".comp", { tipo: "number", step: "0.01", cls: "campo-pct" });
      h += st.bmi200 ? campo("IPI (si tiene)", "artistas." + i + ".ipi", { ph: "Número IPI" }) : "<div></div>";
      h += "</div>";
      if (st.bmi200) h += '<div class="grid2">' + campo("Sociedad de gestión (PRO)", "artistas." + i + ".sociedad", { list: "lista-sociedades", ph: "BMI, ASCAP, AGADU…" }) +
        campo("Editorial / publisher (si tiene)", "artistas." + i + ".editorial", { ph: "Vacío = sin editorial (el propio autor)" }) + "</div>";
      if (t !== "individual") h += '<div class="grid2">' + check("Firma requerida", "artistas." + i + ".firma", { re: true, cls: "span2" }) + "</div>";
      h += "</div>";
    });
    h += '<datalist id="lista-roles">' + ROLES.map(function (r) { return '<option value="' + esc(r) + '">'; }).join("") + "</datalist>";
    h += '<datalist id="lista-sociedades">' + SOCIEDADES.map(function (r) { return '<option value="' + esc(r) + '">'; }).join("") + "</datalist>";

    if (servicio) h += '<div class="fila-botones"><button class="btn" data-accion="agregar-artista">+ Agregar ' + (t === "duo" ? "integrante" : "artista") + "</button></div>";
    else {
      h += '<div class="tarjeta tarjeta-prod"><div class="tarjeta-head"><span class="num">P</span><span class="tit">' + alias + '</span><div class="tools"><span class="pill">productor</span></div></div>';
      h += opciones("compProductor", { no: "No cobro derechos de composición", si: "Sí cobro derechos de composición" }, {
        no: "Prestás solo el servicio: la composición es 100 % de los artistas.",
        si: "Sos coautor (por ejemplo, de la música o el beat). Tu parte se registra en " + esc(cfg.productor.pro || "tu sociedad") + " y en tu editorial.",
      });
      if (st.compProductor === "si") {
        h += '<div class="grid3" style="margin-top:10px">' + campo("Tu composición (%)", "productorComp", { tipo: "number", step: "0.01", cls: "campo-pct" });
        h += '<div class="f span2"><span>Rápido (el resto se reparte entre los artistas)</span><div style="display:flex;gap:4px;flex-wrap:wrap">' + listaRapidos(cfg.condiciones.rapidosComp, [25, 33.33, 50]).map(function (n) { return '<button class="btn chico" data-accion="comp-productor" data-n="' + n + '">' + String(n).replace(".", ",") + " %</button>"; }).join("") +
          '<button class="btn chico violeta" data-accion="comp-productor" data-n="50" title="Música del productor, letra de los artistas">Beat 50 % · Letra 50 %</button></div></div></div>';
        if (st.bmi200) h += '<div class="grid2">' + campo("Tu editorial en este contrato", "productorEditorial", { cls: "span2", list: "lista-editorial", ph: cfg.productor.editorial ? cfg.productor.editorial + " (de “Mis datos”)" : "Vacío = sin editorial (vos mismo)" }) + "</div>" +
          '<datalist id="lista-editorial"><option value="' + esc(cfg.productor.editorial || "") + '"><option value="' + esc(cfg.productor.empresa || "") + '"></datalist>';
      }
      h += "</div>";
      h += '<div class="fila-botones"><button class="btn" data-accion="agregar-artista">+ Agregar ' + palabra + '</button><button class="btn" data-accion="repartir">Repartir en partes iguales</button></div>';
      h += '<div data-calc="composicion" class="aviso ' + (Math.abs(calc.composicion - 100) < 0.001 ? "bien" : "mal") + '"></div>';
    }

    h += '<h3 class="sec">2 · Derechos del Master (la grabación)</h3>';
    if (servicio) h += '<p class="ayuda">En un servicio de audio el Master es <b>100 % de los artistas</b>. Solo si lo negociaste (por ejemplo, a cambio de un descuento) elegí “Sí” y poné tu porcentaje. Aunque te quedes con una parte del Master, <b>no recibís derechos de composición</b>.</p>';
    else h += '<p class="ayuda">El Master es el audio final. Normalmente es <b>100 % de los artistas</b>. Si negociás quedarte con una parte, elegí “Sí” y poné tu porcentaje: los artistas quedan con el resto, en conjunto. El Master suma <b>100 %</b> por separado de la composición.</p>';
    if (st.derechosPistaV1 && !servicio) h += '<p class="ayuda">Esto es el <b>criterio general</b>. Si un remake es distinto (por ejemplo 5 % del Master en uno y 0 % en otro, pero sí la composición), lo cambiás en cada canción del Anexo B. Master y beat no se mezclan.</p>';
    h += '<div class="bloque-derechos">';
    h += opciones("regalias", { no: "No me quedo con nada del Master", puntos: "Sí, me quedo con un porcentaje" }, {
      no: "Cobrás solo el precio del servicio. El Master es 100 % de los artistas.",
      puntos: servicio ? "Pactado aparte (por ejemplo, por un descuento). Es solo sobre el Master." : "Además del precio, cobrás un porcentaje de lo que genere el Master. Vos decidís cuánto.",
    });
    if (st.regalias === "puntos") {
      h += '<div class="grid3" style="margin-top:10px">' + campo("Tu porcentaje del Master (%)", "puntosPct", { tipo: "number", step: "0.5", cls: "campo-pct" });
      h += '<div class="f"><span>Rápido</span><div style="display:flex;gap:4px;flex-wrap:wrap">' + listaRapidos(cfg.condiciones.rapidosMaster, [2, 3, 5, 10]).map(function (n) { return '<button class="btn chico" data-accion="puntos" data-n="' + n + '">' + String(n).replace(".", ",") + " %</button>"; }).join("") + "</div></div>";
      h += campo("Liquidación", "puntosPeriodo", { opciones: [["trimestral", "Trimestral"], ["semestral", "Semestral"], ["anual", "Anual"]] }) + "</div>";
    }
    h += '<div data-calc="reparto-master" class="aviso bien"></div>';
    if (st.bmi200 && (st.regalias === "puntos" || !st.masterV2)) h += '<div class="grid2">' + campo("Distribuidora del Master (para cobrarte tu porcentaje por splits)", "distribuidora", { cls: "span2", list: "lista-distribuidoras", ph: "Ej: Symphonic, DistroKid, ONErpm…" }) + "</div>" +
      '<datalist id="lista-distribuidoras">' + ["Symphonic", "ONErpm", "DistroKid", "TuneCore", "CD Baby", "Amuse", "Ditto Music"].map(function (r) { return '<option value="' + r + '">'; }).join("") + "</datalist>";
    h += '<div data-calc="master">' + tablaMasterUI() + "</div>";
    if (st.masterV2 && !servicio) h += check("Permitir que colaboren con otros artistas (feat., remix o nueva versión) sin pedirte permiso por el Master. Tu porcentaje de composición no baja.", "colabTerceros");
    h += "</div>";
    if (st.claridadV1 && !servicio) h += check("Incluir la guía para artistas (Anexo E): cómo registrar y cobrar sus regalías, con opciones y glosario", "guiaArtistas", { re: true });
    return h;
  },

  servicios: function () {
    var h = '<h3 class="sec">Anexo B · Canciones y servicios</h3>';
    h += '<p class="ayuda">Tocá un servicio para agregarlo. Cada uno es un paquete (incluye / no incluye). En la tarjeta marcá si ya está pagado, si todavía está a cotizar (el cliente puede firmar igual) o si es gratis. Si el trabajo ya se hizo y se te olvidó firmar antes, marcá «Ya pagado» y «El trabajo ya está hecho».</p>';
    h += bannerTipoTrabajo();
    h += bannerDerechosPista();
    GRUPOS_CATALOGO.forEach(function (g) {
      var lista = cfg.servicios.filter(function (s) { return grupoCatalogo(s) === g[0]; });
      if (!lista.length) return;
      h += '<div class="catalogo-grupo"><span class="sub-tit">' + g[1] + '</span><div class="chips">' + lista.map(function (s) {
        var precio = Number(s.precio) > 0 ? " · " + formatoMoneda(s.precio, s.moneda || cfg.monedaDefecto) : " · a cotizar";
        var tip = (s.incluye ? "Incluye: " + s.incluye : "") + (s.noIncluye ? (s.incluye ? " · " : "") + "No incluye: " + s.noIncluye : "");
        return '<button class="chip" data-accion="agregar-track" data-serv="' + s.id + '" title="' + esc(tip) + '">+ ' + esc(s.nombre) + "<small>" + esc(precio) + "</small></button>";
      }).join("") + "</div></div>";
    });
    var opcServ = cfg.servicios.map(function (s) { return [s.id, s.nombre]; });
    st.tracks.forEach(function (tr, i) {
      var s = servicioPorId(cfg, tr.servicio);
      completarPrecio(tr, Object.keys(st.firmas || {}).length > 0);
      h += '<div class="tarjeta"><div class="tarjeta-head"><span class="num">' + (i + 1) + '</span><span class="tit">' + esc(tr.titulo || nombreServicio(cfg, tr)) + '</span><span class="pill ' + clasePildora(tr) + '" data-calc="sub-' + i + '"></span>';
      h += '<div class="tools"><button class="btn chico icono" data-accion="subir-track" data-i="' + i + '" title="Subir">↑</button><button class="btn chico icono" data-accion="duplicar-track" data-i="' + i + '" title="Duplicar">⧉</button><button class="btn chico icono peligro" data-accion="quitar-track" data-i="' + i + '" title="Quitar">✕</button></div></div>';
      h += '<div class="grid3">';
      if (st.colNombreV1) {
        var phNom = creaObra(s) ? "Nombre de la canción" : "Pack, oferta o canción de referencia (opcional)";
        h += campo("Nombre", "tracks." + i + ".titulo", { cls: "span2", ph: phNom, re: true }) + campo("Servicio", "tracks." + i + ".servicio", { opciones: opcServ, re: true });
      } else if (sinTituloTrack(st, cfg, tr)) h += campo("Servicio", "tracks." + i + ".servicio", { cls: "span3", opciones: opcServ, re: true });
      else h += campo("Canción / título", "tracks." + i + ".titulo", { cls: "span2", ph: "Nombre de la canción" }) + campo("Servicio", "tracks." + i + ".servicio", { opciones: opcServ, re: true });
      if (tr.servicio === "otro") h += campo("Nombre del servicio", "tracks." + i + ".servicioNombre", { cls: "span3" });
      h += campo("Cantidad (" + esc(unidadConCantidad(unidadTrack(cfg, tr), 2)) + ")", "tracks." + i + ".cantidad", { tipo: "number", step: "0.5" });
      h += campoPrecio(tr, i, s);
      h += campo("Revisiones", "tracks." + i + ".revisiones", { tipo: "number", step: "1" });
      h += campo("Titular del Master", "tracks." + i + ".titular", { ph: nombreCliente(st) || "Artista / Sello" }) + campo("Fecha de entrega", "tracks." + i + ".entrega", { tipo: "date" });
      if (!st.entregaV2) h += '<div class="f" style="justify-content:flex-end">' + check("Incluye stems", "tracks." + i + ".stems") + "</div>";
      h += "</div>";
      if (s.moneda && s.moneda !== st.moneda && Number(tr.precio) === Number(s.precio))
        h += '<div class="aviso info">El precio de catálogo de este servicio está en <b>' + esc(s.moneda) + "</b> y el contrato en <b>" + esc(st.moneda) + '</b>. <button class="btn chico" data-accion="moneda-contrato" data-m="' + esc(s.moneda) + '">Pasar el contrato a ' + esc(s.moneda) + "</button></div>";
      if (st.detalleV2) h += bloqueDetalleServicio(tr, i);
      h += bloqueDerechosPista(tr, i);
      if (st.entregaV2) {
        completarEntrega(tr);
        h += '<div class="sub-bloque"><span class="sub-tit">Formato de entrega</span><div class="grid3">';
        h += campo("Qué se entrega", "tracks." + i + ".entregable", { opciones: Object.keys(ENTREGABLES).map(function (k) { return [k, ENTREGABLES[k]]; }), cls: "span2" });
        h += campo("Formato WAV", "tracks." + i + ".formato", { opciones: Object.keys(FORMATOS_AUDIO).map(function (k) { return [k, FORMATOS_AUDIO[k]]; }) });
        h += campo("Detalle extra (opcional)", "tracks." + i + ".entregaNota", { cls: "span2", ph: "Ej: + versión instrumental y acapella" });
        h += '<div class="f" style="justify-content:flex-end">' + check("También MP3 320 kbps", "tracks." + i + ".mp3") + "</div>";
        if (tr.servicio !== "stems") {
          h += '<div class="f" style="justify-content:flex-end">' + check("Stems (instrumental por partes)", "tracks." + i + ".stems", { re: true }) + "</div>";
          if (tr.stems) h += campo("Precio stems por " + esc(s.unidad) + " (" + esc(st.moneda) + ")", "tracks." + i + ".stemsPrecio", { tipo: "number", step: "0.01" }) +
            '<p class="ayuda" style="align-self:end">En 0 = incluidos en el precio. Si ponés un monto, se suma al total como adicional.</p>';
        }
        h += "</div></div>";
      }
      h += "</div>";
    });
    if (!st.tracks.length) h += '<div class="aviso mal">No hay servicios cargados. Agregá al menos uno.</div>';
    if (st.claridadV1) {
      h += check("El trabajo ya está hecho: este contrato formaliza un proyecto ya entregado (si se te olvidó firmar antes, marcá esto y grabá ahora)", "trabajoPrevio", { re: true });
      h += '<p class="ayuda">Deja constancia de que las fechas de entrega del Anexo B son las reales, anteriores a la firma. El cliente puede firmar igual.</p>';
    }

    h += '<h3 class="sec">Precio y pagos</h3><div class="grid3">';
    if (st.modalidad === "cantidad") h += campo("Precio de paquete (opcional)", "precioPaquete", { tipo: "number", step: "0.01" });
    else h += campo("Descuento %", "descuento", { tipo: "number", step: "1" });
    h += campo("Pago inicial %", "anticipoPct", { tipo: "number", step: "1" });
    h += '<div class="f"><span>Rápido</span><div style="display:flex;gap:4px">' + [0, 30, 50, 100].map(function (n) { return '<button class="btn chico" data-accion="anticipo" data-n="' + n + '">' + n + "%</button>"; }).join("") + "</div></div>";
    h += "</div>";
    if (st.modalidad === "cantidad") h += '<p class="ayuda">Si ponés un precio de paquete, reemplaza la suma de las filas y la diferencia aparece como ajuste.</p>';
    if (st.saldoPlazoV1 && !Object.keys(st.firmas || {}).length)
      h += '<p class="ayuda">El saldo (lo que falta después del pago inicial) tiene plazo: se cobra <b>contra entrega</b>. Lo configurás en <b>Plazos y pagos</b>. Si ya te pagaron todo, marcá el saldo ahí y esa cláusula no aparece.</p>';
    h += '<div class="resumen" data-calc="resumen" style="margin-top:12px"></div>';
    return h;
  },

  plazos: function () {
    var h = '<h3 class="sec">Plazo de entrega</h3><div class="grid2">';
    h += campo("Cantidad", "plazoNum", { tipo: "number", step: "1" }) + campo("Unidad", "plazoUnidad", { opciones: [["dias", "Días"], ["habiles", "Días hábiles"], ["semanas", "Semanas"], ["meses", "Meses"]] });
    h += "</div>";
    if (st.claridadV1) {
      h += check("El trabajo ya está hecho: este contrato formaliza un proyecto ya entregado (si se te olvidó firmar antes, marcá esto y grabá ahora)", "trabajoPrevio", { re: true });
      h += '<p class="ayuda">Deja constancia de que las fechas de entrega del Anexo B son las reales, anteriores a la firma. Cargá esas fechas en “Servicios”. El cliente puede firmar igual.</p>';
    }
    h += '<h3 class="sec">Archivos</h3><div class="grid2">';
    h += campo("Custodia de sesiones (días)", "custodiaDias", { tipo: "number", step: "1" });
    h += campo("Tarifa de stems (si no los cotizás por canción)", "stemsTarifa", { ph: "Ej: USD 30 por canción" });
    h += campo("Recuperación posterior de sesiones", "recuperacion", { cls: "span2", ph: "Ej: 20% del precio original / USD 15" });
    h += "</div>";
    h += '<h3 class="sec">Pago</h3><div class="grid2">';
    h += campo("Forma de pago", "formaPago", { cls: "span2", list: "lista-pagos" });
    h += '<datalist id="lista-pagos">' + FORMAS_PAGO.map(function (r) { return '<option value="' + esc(r) + '">'; }).join("") + "</datalist>";
    if (!Object.keys(st.firmas || {}).length) {
      st.saldoPlazoV1 = true;
      if (!(Number(st.saldoPlazoNum) > 0)) st.saldoPlazoNum = 5;
      if (!st.saldoPlazoUnidad) st.saldoPlazoUnidad = "habiles";
      asegurarPlazoSaldoEnClausula(st.clausulas);
    }
    if (st.saldoPlazoV1) {
      var calcSaldo = calcular(st);
      h += '<div class="span2 bloque-saldo">';
      h += '<span class="sub-tit">¿En cuánto tiempo tiene que pagar el saldo?</span>';
      if (!aplicaPlazoSaldo(st, calcSaldo)) {
        if (calcSaldo.saldo <= 0.005) h += '<p class="ayuda">No hay saldo: o está 100 % al inicio, o el proyecto no tiene precio todavía. La cláusula no se incluye.</p>';
        else h += '<p class="ayuda">El saldo ya está marcado como cobrado. Esta cláusula <b>no entra</b> en el documento.</p>';
      } else {
        h += '<p class="ayuda">El cliente paga contra entrega. Hasta que caiga el saldo no mandás WAV ni Master. Si ya te pagaron, marcá «Saldo recibido» abajo y esto desaparece del contrato.</p>';
        h += '<div class="grid2" style="margin:0">';
        h += campo("Cantidad", "saldoPlazoNum", { tipo: "number", step: "1" }) + campo("Unidad", "saldoPlazoUnidad", { opciones: [["habiles", "Días hábiles"], ["dias", "Días"], ["semanas", "Semanas"]] });
        h += "</div>";
        h += '<div class="f"><span>Rápido</span><div style="display:flex;gap:4px">' + [3, 5, 7].map(function (n) { return '<button type="button" class="btn chico" data-accion="saldo-plazo" data-n="' + n + '">' + n + " días hábiles</button>"; }).join("") + "</div></div>";
        h += '<p class="hint-obra">En el contrato: el saldo de <b>' + esc(formatoMoneda(calcSaldo.saldo, st.moneda)) + "</b> vence a los <b>" + esc(frasePlazoSaldo(st)) + "</b> desde que avisás que está listo.</p>";
      }
      h += "</div>";
    }
    h += campo("Condición especial del proyecto", "condicionEspecial", { tipo: "area", cls: "span2", ph: "Ej: el sello paga 50% al inicio y 50% contra entrega de cada Master." });
    h += campo("Observaciones", "observaciones", { tipo: "area", cls: "span2" });
    h += "</div>";
    if (st.claridadV1) {
      var calc = calcular(st), e = estadoPagos(st, calc);
      h += '<h3 class="sec">Estado de pagos</h3>';
      if (!e.anticipo && !e.saldo) h += '<p class="ayuda">El proyecto no tiene pagos (sin costo).</p>';
      else {
        h += '<div class="grid2">';
        if (e.anticipo) {
          h += check("Pago inicial recibido (" + esc(formatoMoneda(calc.anticipo, st.moneda)) + ")", "anticipoPagado", { re: true });
          h += st.anticipoPagado ? campo("Fecha del pago inicial", "anticipoFechaPago", { tipo: "date" }) : "<div></div>";
        }
        if (e.saldo) {
          h += check("Saldo recibido (" + esc(formatoMoneda(calc.saldo, st.moneda)) + ")", "saldoPagado", { re: true });
          h += st.saldoPagado ? campo("Fecha del pago del saldo", "saldoFechaPago", { tipo: "date" }) : "<div></div>";
        }
        h += "</div>";
        h += e.completo ? '<div class="aviso bien">El contrato dirá que está <b>pagado en su totalidad</b> y que el saldo pendiente es ' + esc(formatoMoneda(0, st.moneda)) + ".</div>"
          : '<p class="ayuda">Marcá los pagos ya recibidos: el contrato deja constancia de cada uno con su fecha y del saldo pendiente.</p>';
      }
    }
    return h;
  },

  clausulas: function () {
    var activas = clausulasActivas(st, cfg);
    var h = '<h3 class="sec">Cláusulas del contrato</h3>';
    h += '<p class="ayuda">Editá cualquier texto. “Auto” incluye la cláusula solo cuando corresponde (ej: la de remakes solo si hay un Remake Beat). Usá <b>**negrita**</b> y líneas que empiezan con “- ” para listas.</p>';
    h += '<div class="placeholders" style="margin-bottom:12px">' + PLACEHOLDERS.map(function (p) { return '<code title="' + esc(p[1]) + '" data-accion="copiar" data-txt="' + esc(p[0]) + '">' + esc(p[0]) + "</code>"; }).join("") + "</div>";
    var opcIncluir = function (c) { return [["auto", "Auto: " + CONDICIONES[c.cond || "siempre"]], ["si", "Incluir siempre"], ["no", "No incluir"]]; };
    st.clausulas.forEach(function (c, i) {
      var pos = activas.indexOf(c);
      h += '<div class="tarjeta' + (pos < 0 ? " inactiva" : "") + '"><div class="tarjeta-head"><span class="num">' + (pos >= 0 ? pos + 1 : "–") + '</span><span class="tit">' + esc(c.titulo) + "</span>";
      h += '<span class="pill ' + (pos >= 0 ? "on" : "off") + '">' + (pos >= 0 ? "incluida" : "no incluida") + "</span>";
      h += '<div class="tools"><button class="btn chico icono" data-accion="subir-clausula" data-i="' + i + '" title="Subir">↑</button><button class="btn chico icono" data-accion="bajar-clausula" data-i="' + i + '" title="Bajar">↓</button><button class="btn chico icono peligro" data-accion="quitar-clausula" data-i="' + i + '" title="Eliminar">✕</button></div></div>';
      h += '<div class="grid2">' + campo("Título", "clausulas." + i + ".titulo") + campo("Incluir", "clausulas." + i + ".incluir", { opciones: opcIncluir(c), re: true }) + "</div>";
      h += campo("Texto", "clausulas." + i + ".texto", { tipo: "area", filas: Math.min(14, Math.max(4, Math.ceil((c.texto || "").length / 70))) });
      h += "</div>";
    });
    h += '<div class="fila-botones"><button class="btn" data-accion="agregar-clausula">+ Nueva cláusula</button>';
    h += '<button class="btn violeta" data-accion="guardar-plantilla">Guardar como mis cláusulas por defecto</button>';
    h += '<button class="btn peligro" data-accion="restaurar-clausulas">Restaurar originales</button></div>';
    return h;
  },

  firmas: function () {
    var lista = firmantes(st, cfg);
    var h = '<h3 class="sec">Estado de las firmas</h3>';
    var invalidas = lista.filter(function (f) { var fi = st.firmas[f.key]; return fi && fi.fecha && fi.hash && fi.hash !== hashActual; });
    if (invalidas.length) h += '<div class="aviso mal"><b>El contrato cambió después de firmado</b> por: ' + invalidas.map(function (f) { return esc(f.rol); }).join(", ") + ". Esas firmas corresponden a otra versión del texto: deshacé los cambios o pedí que vuelvan a firmar.</div>";
    if (hayCotizar(st)) h += '<div class="aviso info">Hay servicios «A cotizar». El cliente puede firmar el alcance ahora; el precio de esos ítems se acuerda por escrito después y no entra en el total.</div>';
    if (hayPagado(st) || st.trabajoPrevio) h += '<div class="aviso">Este contrato deja constancia de trabajo o pagos ya hechos. Podés firmar y grabar ahora, aunque se te haya olvidado firmar antes.</div>';
    else if (st.claridadV1) h += '<p class="ayuda">Si el trabajo o el pago ya pasaron y se te olvidó firmar, marcá «Ya pagado» en cada servicio y «El trabajo ya está hecho» en Servicios, y firmá ahora.</p>';
    lista.forEach(function (f) {
      var fi = st.firmas[f.key];
      h += '<div class="tarjeta"><div class="firmante"><div><div class="tarjeta-head" style="margin-bottom:4px"><span class="tit">' + esc(f.rol) + "</span>" + (fi && fi.fecha ? '<span class="pill on">firmado</span>' : '<span class="pill">pendiente</span>') + "</div>";
      h += '<div class="estado-firma">' + esc((fi && fi.nombre) || f.nombre || "(sin nombre cargado)") + (fi && fi.fecha ? " · " + esc(fechaHoraLocal(fi.fecha)) + " · " + (fi.metodo === "remota" ? "firma remota" : "en pantalla") : "") + "</div></div>";
      h += fi && fi.img ? '<img src="' + fi.img + '" alt="firma">' : "<span></span>";
      h += "</div><div class=\"fila-botones\" style=\"margin-bottom:0\">";
      h += '<button class="btn chico primario" data-accion="firmar" data-key="' + f.key + '">' + (fi && fi.fecha ? "Volver a firmar" : "Firmar en pantalla") + "</button>";
      if (f.key === "productor" && cfg.firmaProductor) h += '<button class="btn chico" data-accion="usar-mi-firma">Usar mi firma guardada</button>';
      if (fi) h += '<button class="btn chico peligro" data-accion="borrar-firma" data-key="' + f.key + '">Borrar firma</button>';
      h += "</div></div>";
    });
    h += '<h3 class="sec">Firma a distancia (gratis)</h3>';
    h += '<p class="ayuda">1) Firmá vos primero. 2) Tocá “Enviar por WhatsApp para firmar” y elegí el chat del artista. 3) El artista lo abre, firma con el dedo y toca el botón verde para devolvértelo por WhatsApp. 4) Guardás ese archivo y lo importás acá.</p>';
    h += '<div class="fila-botones"><button class="btn primario" data-accion="paquete-wa" style="background:#25d366;color:#04140a">Enviar por WhatsApp para firmar</button><button class="btn" data-accion="paquete">Solo descargar archivo</button><button class="btn violeta" data-accion="importar-firmado">Importar contrato firmado</button></div>';
    h += '<h3 class="sec">Link para firmar (funciona en iPhone)</h3>';
    if (!linkConfigurado(cfg)) {
      h += '<div class="aviso info">En iPhone el archivo .html se abre en <b>vista previa</b> y no deja firmar. Con un <b>link</b>, el cliente lo toca, se abre en Safari y firma con el dedo igual que en la compu. Se configura <b>una sola vez</b> (gratis) en Mis datos.</div>';
      h += '<div class="fila-botones"><button class="btn primario" data-accion="ir-config-link">Configurar el link</button></div>';
    } else {
      var lk = st.linkFirma;
      var lkViejo = lk && lk.hash !== hashActual;
      h += '<p class="ayuda">1) Firmá vos primero. 2) Tocá «Crear link para firmar» y esperá a que diga «Listo» (más o menos 1 minuto). 3) Mandalo por WhatsApp. 4) El cliente toca el link, firma con el dedo y te devuelve el archivo con el botón verde. 5) Lo importás acá con «Importar contrato firmado».</p>';
      if (lk) h += '<div class="aviso' + (lkViejo ? " mal" : " bien") + '">' + (lkViejo ? "<b>Cambiaste el contrato después de crear el link.</b> Creá un link nuevo antes de mandarlo." : "Link creado el " + esc(fechaHoraLocal(lk.fecha)) + ". Cuando firmen todos, borralo.") + "</div>";
      h += '<div class="fila-botones"><button class="btn primario" data-accion="crear-link">' + (lk ? "Crear link nuevo" : "Crear link para firmar") + "</button>";
      if (lk && !lkViejo) h += '<button class="btn" data-accion="link-wa" style="background:#25d366;color:#04140a">Enviar link por WhatsApp</button><button class="btn" data-accion="copiar-link">Copiar link</button>';
      if (lk) h += '<button class="btn peligro" data-accion="borrar-link">Borrar link</button>';
      h += "</div>";
    }
    h += '<h3 class="sec">Sin internet: PDF</h3>';
    h += '<p class="ayuda">Si no podés usar el link, el cliente puede firmar el PDF con «Marcación» del iPhone. Te devuelve el PDF firmado: esa es tu copia (no se importa al programa).</p>';
    h += '<div class="fila-botones"><button class="btn" data-accion="pdf-iphone">Preparar PDF para firmar</button><button class="btn" data-accion="copiar-iphone">Copiar instrucciones del PDF</button></div>';
    h += '<div class="aviso">Código de verificación actual del documento:<br><code style="word-break:break-all;color:var(--mint)">' + esc(hashActual) + "</code></div>";
    return h;
  },

  config: function () {
    var h = '<h3 class="sec">Tus datos de productor</h3><p class="ayuda">Aparecen en todos los contratos. Se guardan en este navegador.</p><div class="grid2">';
    h += campo("Nombre legal", "cfg:productor.nombre") + campo("Nombre artístico", "cfg:productor.alias");
    h += campo("Tu cédula / documento (opcional)", "cfg:productor.documento") + campo("IPI", "cfg:productor.ipi");
    h += campo("Sociedad de gestión (PRO)", "cfg:productor.pro") + campo("Editorial / administradora editorial", "cfg:productor.editorial", { ph: "Ej: BeatStars Publishing" });
    h += campo("Email de contratos", "cfg:productor.email", { tipo: "email" });
    h += campo("WhatsApp", "cfg:productor.whatsapp") + campo("Web", "cfg:productor.web");
    h += campo("Ciudad / domicilio", "cfg:productor.ciudad", { cls: "span2" });
    h += "</div>";
    var cond = cfg.condiciones;
    h += '<h3 class="sec">Tus condiciones por defecto</h3><p class="ayuda">Cada contrato nuevo arranca con estas opciones. Después podés cambiarlas en cada contrato, en “Cliente y artistas”.</p>';
    h += '<div class="bloque-derechos"><span class="sub-tit">Master (la grabación)</span>';
    h += opciones("cfg:condiciones.regalias", { no: "No recibo regalías del Master", puntos: "Sí recibo un porcentaje del Master" });
    h += '<div class="grid3" style="margin-top:10px">' + (cond.regalias === "puntos" ? campo("Mi porcentaje habitual (%)", "cfg:condiciones.puntosPct", { tipo: "number", step: "0.5" }) +
      campo("Liquidación", "cfg:condiciones.puntosPeriodo", { opciones: [["trimestral", "Trimestral"], ["semestral", "Semestral"], ["anual", "Anual"]] }) : "") +
      campo("Botones rápidos (%)", "cfg:condiciones.rapidosMaster", { ph: "2, 3, 5, 10" }) + "</div></div>";
    h += '<div class="bloque-derechos"><span class="sub-tit">Composición (música y letra)</span>';
    h += opciones("cfg:condiciones.compProductor", { no: "No recibo derechos de composición", si: "Sí recibo derechos de composición" });
    h += '<div class="grid3" style="margin-top:10px">' + (cond.compProductor === "si" ? campo("Mi porcentaje habitual (%)", "cfg:condiciones.productorComp", { tipo: "number", step: "0.01" }) : "") +
      campo("Botones rápidos (%)", "cfg:condiciones.rapidosComp", { ph: "25, 33.33, 50" }) + "</div></div>";
    h += '<h3 class="sec">Sello</h3><div class="grid2">' + campo("Nombre del sello", "cfg:productor.empresa") + campo("Nota", "cfg:productor.empresaNota", { ph: "(en formación)" });
    h += check("Mostrar el sello en los contratos", "cfg:productor.mostrarEmpresa", { cls: "span2" }) + "</div>";
    h += '<h3 class="sec">Numeración y moneda</h3><div class="grid2">' + campo("Prefijo del ID", "cfg:prefijoId", { ph: "WFH" }) + campo("Moneda por defecto", "cfg:monedaDefecto", { opciones: MONEDAS }) + "</div>";
    h += seccionConfigLink();
    h += seccionConfigSync();
    h += '<h3 class="sec">Catálogo de servicios y precios</h3><p class="ayuda">Tu cotización: cada servicio es un paquete con precio, <b>qué incluye</b> y <b>qué no incluye</b>. Se cargan solos al agregarlos a un contrato y ahí los podés personalizar. El <b>tipo</b> decide el contrato: si hay un servicio de producción es un contrato de producción; si todo es técnico, es un contrato de servicio de audio, sin derechos de autor.</p>';
    GRUPOS_CATALOGO.forEach(function (g) {
      var indices = cfg.servicios.map(function (s, i) { return i; }).filter(function (i) { return grupoCatalogo(cfg.servicios[i]) === g[0]; });
      if (!indices.length) return;
      h += '<span class="sub-tit catalogo-tit">' + g[1] + "</span>";
      indices.forEach(function (i) {
        var s = cfg.servicios[i], r = "cfg:servicios." + i + ".";
        var propio = !DEFAULT_CONFIG.servicios.some(function (x) { return x.id === s.id; });
        h += '<div class="tarjeta"><div class="tarjeta-head"><span class="tit">' + esc(s.nombre) + "</span><div class=\"tools\">" +
          (propio ? '<button class="btn chico icono peligro" data-accion="quitar-servicio-catalogo" data-id="' + esc(s.id) + '" title="Quitar del catálogo">✕</button>' : "") + "</div></div>";
        h += '<div class="grid3">' + campo("Nombre", r + "nombre", { cls: "span2", re: true });
        h += campo("Tipo", r + "derechos", { re: true, opciones: [["tecnico", "Servicio técnico (sin derechos de autor)"], ["composicion", "Producción (crea la canción)"]] });
        h += campo("Precio", r + "precio", { tipo: "number", step: "0.01" }) + campo("Moneda", r + "moneda", { opciones: MONEDAS }) + campo("Unidad", r + "unidad", { ph: "canción, beat, hora…" });
        h += campo("Revisiones incluidas", r + "revisiones", { tipo: "number", step: "1" }) + campo("Qué cubren las revisiones", r + "revDesc", { cls: "span2" });
        h += campo("Qué incluye", r + "incluye", { tipo: "area", filas: 3, cls: "span3" });
        h += campo("Qué no incluye", r + "noIncluye", { tipo: "area", filas: 2, cls: "span3" }) + "</div></div>";
      });
    });
    h += '<div class="fila-botones"><button class="btn" data-accion="agregar-servicio-catalogo">+ Agregar servicio al catálogo</button></div>';
    h += '<h3 class="sec">Tu firma guardada</h3>';
    h += cfg.firmaProductor ? '<div class="firmante"><img src="' + cfg.firmaProductor + '" alt="Mi firma"><button class="btn chico peligro" data-accion="borrar-mi-firma">Borrar</button></div>' : '<p class="ayuda">Todavía no guardaste tu firma. Firmá como productor en la pestaña “Firmas” y marcá “guardar como mi firma”.</p>';
    h += '<h3 class="sec">Copia de seguridad</h3><p class="ayuda">Los contratos viven en este navegador. Descargá una copia de vez en cuando (o antes de cambiar de computadora).</p>';
    h += '<div class="fila-botones"><button class="btn" data-accion="backup">Descargar copia de seguridad</button><button class="btn" data-accion="restaurar-backup">Restaurar copia</button></div>';
    return h;
  },

  guia: function () {
    return '<div class="guia">' +
      '<h3 class="sec">Cómo hacer que tus clientes firmen (sin pagar)</h3>' +
      '<p>En Uruguay, la <b>Ley 18.600</b> reconoce el documento y la firma electrónica. Hay dos niveles:</p>' +
      '<div class="nivel"><b>Firma electrónica simple</b> — lo que hace este programa: firma dibujada + nombre + cédula + email + fecha/hora + código del documento. Es válida entre las partes, pero si hay un conflicto <i>vos</i> tenés que probar que firmó esa persona. Por eso conviene juntar evidencia (ver abajo).</div>' +
      '<div class="nivel v"><b>Firma electrónica avanzada</b> — equivale a la firma en papel. Es gratis si el cliente tiene <b>cédula uruguaya con chip</b> (y un lector de cédula), o usuario de <b>ID Uruguay</b> con firma habilitada: descarga el PDF, lo firma con las herramientas oficiales de gub.uy/AGESIC y te lo devuelve. Recomendada para contratos grandes o con sellos.</div>' +
      '<h4>MI RECOMENDACIÓN SEGÚN EL CASO</h4><ol>' +
      "<li><b>Cliente presencial</b> (en tu estudio): pestaña Firmas → “Firmar en pantalla”. Firma en tu tablet/celular/PC. Pedile que te muestre la cédula y verificá que el número coincida.</li>" +
      "<li><b>Cliente a distancia</b>: “Generar archivo para firmar” → se lo mandás por email (mejor que WhatsApp, queda registro). Firma con el dedo y te devuelve el archivo. Lo importás y consolidás el PDF final.</li>" +
      "<li><b>Cliente con iPhone</b>: el archivo para firmar no funciona en la vista previa del iPhone. Mandale un <b>link para firmar</b> (pestaña Firmas): lo toca, se abre en Safari y firma con el dedo.</li>" +
      "<li><b>Contratos de mucha plata o sellos</b>: mandá el PDF y pedí firma electrónica avanzada con cédula uruguaya, o una plataforma gratuita con registro de auditoría (por ejemplo, planes gratis de Dropbox Sign, DocuSign o Zoho Sign tienen pocos envíos por mes).</li></ol>" +
      '<h4>¿ALCANZA CON SU NOMBRE?</h4><p>Solo el nombre escrito es la forma más débil. Lo que le da fuerza es la <b>suma de evidencia</b>:</p><ul>' +
      "<li>Nombre + número de cédula + firma dibujada (el programa lo hace).</li>" +
      "<li>Que el cliente te responda por <b>email</b> desde su casilla: “Leí y acepto el contrato ID …”, con el archivo adjunto.</li>" +
      "<li>El <b>comprobante del primer pago</b> a tu nombre: prueba fuerte de que aceptó.</li>" +
      "<li>Guardar chats de WhatsApp donde aprueba versiones y entregas.</li>" +
      "<li>El <b>código de verificación</b> del documento: si alguien cambia una palabra, el código deja de coincidir.</li></ul>" +
      '<h4>SOBRE LAS CÉDULAS</h4><ul><li>En el contrato va solo el <b>número</b> de documento. No pegues fotos de cédulas en el contrato.</li>' +
      "<li>Si guardás fotos de cédulas, hacelo en una carpeta privada, solo para verificar identidad (Ley 18.331 de Protección de Datos Personales).</li>" +
      "<li>Verificá que el nombre y el número coincidan con la cédula antes de firmar.</li></ul>" +
      '<h4>BMI E IPI</h4><p>Tu IPI (' + esc(cfg.productor.ipi) + ") ya aparece en el contrato. Cuando tengas porcentaje de composición, registrá el split en BMI con los mismos porcentajes del Anexo A. El contrato incluye el cuadro en sistema 200 %: autores 100 % + editoriales 100 %.</p>" +
      '<div class="aviso info">Esto es orientación práctica, no asesoramiento legal. Vale la pena que un abogado uruguayo revise la plantilla de cláusulas una vez; después la reutilizás siempre.</div>' +
      "</div>";
  },
};

/* Tabla de cómo se cobra el Master, según reciba o no un porcentaje el productor. */
function tablaMasterUI() {
  var tit = esc(titularMaster(st) || "Tu cliente"), alias = esc(cfg.productor.alias || "Productor");
  var pts = st.regalias === "puntos" ? Number(st.puntosPct) || 0 : 0;
  var reparto = pts > 0 ? tit + " " + numPct(100 - pts).replace("%", " %") + " · " + alias + " " + numPct(pts).replace("%", " %") : tit + " 100 % del Master";
  var filas = [
    ["Distribuidora", "Symphonic, ONErpm, DistroKid, Amuse…", "Regalías por reproducción digital (streams) y ventas del audio: lo que pagan Spotify, Apple Music y las demás plataformas por cada reproducción.", reparto],
    ["SoundExchange", "EE. UU.", "Regalías de ejecución digital del fonograma: radios digitales no interactivas, satelitales y por cable (Pandora, SiriusXM).", tit + " 100 % como dueño del Master (Rights Owner) y artista principal" + (pts > 0 ? "; tu porcentaje se cobra con una carta de dirección (LOD)" : "")],
    ["Content ID", "YouTube, desde la distribuidora", "Uso del audio en videos de YouTube y redes sociales.", reparto],
  ];
  return '<table class="tabla-mini"><thead><tr><th>Herramienta</th><th>Qué dinero cobra</th><th>Porcentaje</th></tr></thead><tbody>' +
    filas.map(function (f) { return "<tr><td><b>" + f[0] + "</b><br><small>" + f[1] + "</small></td><td>" + f[2] + '</td><td class="pct">' + f[3] + "</td></tr>"; }).join("") + "</tbody></table>" +
    (st.regalias === "puntos" && !(pts > 0) ? '<div class="aviso mal">Poné tu porcentaje del Master (lo habitual es entre 2 % y 5 %).</div>' : "");
}

/* Reparte "total" entre los artistas manteniendo sus proporciones (o en partes iguales si no tienen). */
function listaRapidos(txt, porDefecto) {
  var nums = String(txt || "").split(/[;\s]+|,(?!\d)/).map(function (s) { return Number(s.replace(",", ".")); })
    .filter(function (n) { return n > 0 && n < 100; });
  return nums.length ? nums.slice(0, 8) : porDefecto;
}

function repartirArtistas(total) {
  var n = st.artistas.length;
  if (!n) return;
  var suma = st.artistas.reduce(function (s, a) { return s + (Number(a.comp) || 0); }, 0);
  st.artistas.forEach(function (a) { a.comp = suma > 0 ? Math.floor((Number(a.comp) || 0) * total / suma * 100) / 100 : Math.floor(total / n * 100) / 100; });
  var resto = st.artistas.slice(1).reduce(function (s, a) { return s + a.comp; }, 0);
  st.artistas[0].comp = Math.round((total - resto) * 100) / 100;
}

/* ---------- cálculos en vivo ---------- */

function actualizarCalculos() {
  var calc = calcular(st);
  document.querySelectorAll("[data-calc]").forEach(function (el) {
    var k = el.getAttribute("data-calc");
    if (k === "composicion") {
      var ok = Math.abs(calc.composicion - 100) < 0.001;
      var partes = st.artistas.map(function (a, i) { return esc(a.artistico || a.nombre || "Artista " + (i + 1)) + " " + (Number(a.comp) || 0) + " %"; });
      partes.push(esc(cfg.productor.alias) + " " + (Number(st.productorComp) || 0) + " %" + (Number(st.productorComp) > 0 ? "" : " (no recibe composición)"));
      var dif = Math.round((100 - calc.composicion) * 100) / 100;
      el.className = "aviso " + (ok ? "bien" : "mal");
      el.innerHTML = "Composición total: <b>" + calc.composicion + " %</b>" + (ok ? " ✔" : " — debe sumar exactamente 100 %") +
        "<br><small>" + partes.join(" + ") + (ok ? "" : dif > 0 ? " · faltan " + dif + " %" : " · sobran " + (-dif) + " %") + "</small>";
    } else if (k === "reparto-master") {
      var crudo = Number(st.puntosPct) || 0;
      var okM = st.regalias !== "puntos" || (crudo > 0 && crudo < 100);
      var filasM = filasMaster(st, cfg);
      el.className = "aviso " + (okM ? "bien" : "mal");
      el.innerHTML = "Master total: <b>100 %</b>" + (okM ? " ✔" : " — tu porcentaje tiene que estar entre 0 y 100 %") +
        "<br><small>" + filasM.map(function (f) { return esc(f.titular) + " " + String(f.pct).replace(".", ",") + " %"; }).join(" + ") + "</small>";
    } else if (k === "master") {
      el.innerHTML = tablaMasterUI();
    } else if (k === "puntos") {
      var pts = Number(st.puntosPct) || 0;
      el.className = "aviso " + (pts > 0 ? "bien" : "mal");
      el.innerHTML = pts > 0
        ? "De lo que gane el Master: <b>" + esc(cfg.productor.alias) + " " + pts + " %</b> · <b>" + esc(titularMaster(st) || "el titular") + " " + Math.round((100 - pts) * 100) / 100 + " %</b>"
        : "Poné tu porcentaje del Master (lo habitual es 2 % a 5 %).";
    } else if (k === "resumen") {
      var r = '<div class="fila"><span>Subtotal</span><b>' + formatoMoneda(calc.subtotal, st.moneda) + "</b></div>";
      if (calc.descuento > 0) r += '<div class="fila"><span>' + (calc.usarPaquete ? "Ajuste de paquete" : "Descuento") + "</span><b>− " + formatoMoneda(calc.descuento, st.moneda) + "</b></div>";
      r += '<div class="fila"><span>Pago inicial (' + (Number(st.anticipoPct) || 0) + " %)</span><b>" + formatoMoneda(calc.anticipo, st.moneda) + "</b></div>";
      r += '<div class="fila"><span>Saldo</span><b>' + formatoMoneda(calc.saldo, st.moneda) + "</b></div>";
      r += '<div class="fila total"><span>TOTAL</span><b>' + totalTexto(st, calc) + "</b></div>";
      if (hayCotizar(st)) r += '<p class="ayuda" style="margin:8px 0 0">Los ítems «A cotizar» no suman al total. El cliente puede firmar el alcance igual.</p>';
      if (hayPagado(st)) r += '<p class="ayuda" style="margin:8px 0 0">Los ítems «pagado» sí entran en el total; el Anexo B deja constancia.</p>';
      el.innerHTML = r;
    } else if (k.indexOf("sub-") === 0) {
      var tr = st.tracks[Number(k.slice(4))];
      if (tr) {
        el.textContent = textoPildora(tr, st.moneda);
        el.className = "pill " + clasePildora(tr);
      }
    }
  });
}

/* ---------- vista previa ---------- */

function renderVista() {
  var rootEl = $("doc-root");
  rootEl.innerHTML = renderContrato(st, cfg);
  hashActual = sha256(textoParaHash(rootEl));
  var codigo = rootEl.querySelector("#codigo-doc");
  if (codigo) codigo.textContent = hashActual;
  var estilo = $("estilo-pagina");
  estilo.textContent = cssPagina(st, cfg);
  aplicarZoom();
}

function aplicarZoom() {
  var cont = $("preview-scroll");
  var docEl = $("doc-root").firstElementChild;
  if (!docEl) return;
  var z = zoom;
  if (!z) {
    var ancho = docEl.offsetWidth || 794;
    z = Math.min(1, (cont.clientWidth - 48) / ancho);
  }
  $("doc-root").style.zoom = z;
  $("zoom-valor").textContent = Math.round(z * 100) + "%";
}

/* ---------- modales ---------- */

function abrirModal(html) {
  $("modal-caja").innerHTML = html;
  $("modal").classList.remove("oculto");
}
function cerrarModal() {
  $("modal").classList.add("oculto");
  $("modal-caja").innerHTML = "";
}

function validar() {
  var avisos = [];
  var calc = calcular(st);
  var c = st.cliente;
  var servicio = esServicio(st, cfg);
  if (!servicio && Math.abs(calc.composicion - 100) > 0.001) avisos.push("La composición suma " + calc.composicion + " % (debe ser 100 %).");
  if (!st.tracks.length) avisos.push("No hay servicios en el Anexo B.");
  if (st.regalias === "puntos" && !(Number(st.puntosPct) > 0)) avisos.push("Elegiste recibir un porcentaje del Master, pero está en 0 %.");
  if (st.regalias === "puntos" && Number(st.puntosPct) >= 100) avisos.push("Tu porcentaje del Master no puede llegar al 100 %: el Master suma 100 % entre vos y los artistas.");
  if (!servicio && st.compProductor === "si" && !(Number(st.productorComp) > 0)) avisos.push("Elegiste recibir derechos de composición, pero tu porcentaje está en 0 %.");
  if (!servicio && st.compProductor === "no" && Number(st.productorComp) > 0) avisos.push("Elegiste no recibir derechos de composición, pero tu porcentaje no está en 0 %.");
  if (st.tracks.some(function (t) {
    var m = modoPrecio(t);
    return m !== "gratis" && m !== "cotizar" && !(Number(t.precio) > 0);
  })) avisos.push("Hay servicios con precio 0. Si todavía no lo definiste, marcá “A cotizar” (el cliente puede firmar igual); si es sin costo, “Gratis”.");
  if (st.tipoCliente === "individual" && !c.razon) avisos.push("Falta el nombre legal del cliente.");
  if (st.tipoCliente === "sello" && (!c.razon || !c.representante)) avisos.push("Falta la razón social o el representante del sello.");
  if ((st.tipoCliente === "duo" || st.tipoCliente === "colab") && st.artistas.some(function (a) { return a.firma && !a.nombre; })) avisos.push("Hay artistas que firman sin nombre legal.");
  if ((st.tipoCliente === "duo" || st.tipoCliente === "colab") && (st.artistas || []).filter(function (a) { return a.nombre || a.artistico; }).length < 2)
    avisos.push("Son varios artistas: cargá el nombre de los dos en “Cliente y artistas” para que ambos aparezcan al firmar.");
  if (!Object.keys(st.firmas || {}).length && typeof firmantesClientePaquete === "function" && !firmantesClientePaquete(st, cfg, st.firmas).length)
    avisos.push("No hay quién firme del lado del cliente. Cargá el nombre en “Cliente y artistas”. Si son varios, marcá «Firma requerida».");
  if (!st.proyecto) avisos.push(st.formatoObra === "sencillo" ? "Falta el nombre de la canción (el sencillo que identifica este acuerdo)." : "Falta el nombre del proyecto.");
  if (st.formatoObraV1 && !st.formatoObra) avisos.push("Elegí si este acuerdo es un sencillo, un EP o un álbum, para que el cliente vea a qué obra corresponde.");
  if (st.derechosPistaV1 && !servicio) (st.tracks || []).forEach(function (t, i) {
    if (!creaObra(servicioPorId(cfg, t))) return;
    var nom = t.titulo || ("canción " + (i + 1));
    if (t.masterModo === "puntos" && !(Number(t.puntosPct) > 0)) avisos.push("«" + nom + "»: elegiste un % del Master, pero está en 0. Poné un número o «Nada del Master».");
    if (t.masterModo === "puntos" && Number(t.puntosPct) >= 100) avisos.push("«" + nom + "»: tu % del Master no puede llegar al 100 %.");
    if (t.compModo === "si" && !(Number(t.productorComp) > 0)) avisos.push("«" + nom + "»: elegiste composición en este tema, pero tu % está en 0.");
  });
  if (st.claridadV1 && !st.trabajoPrevio && st.tracks.some(function (t) { return t.entrega && st.fecha && t.entrega < st.fecha; }))
    avisos.push("Hay fechas de entrega anteriores a la fecha del contrato. Si el trabajo ya se entregó, marcá “El trabajo ya está hecho” en Servicios o en Plazos; si no, corregí las fechas.");
  if (st.claridadV1 && ((st.anticipoPagado && !st.anticipoFechaPago) || (st.saldoPagado && !st.saldoFechaPago))) avisos.push("Marcaste un pago como recibido sin fecha. Cargá la fecha real del pago en Plazos y pagos.");
  firmantes(st, cfg).forEach(function (f) {
    var fi = st.firmas[f.key];
    if (fi && fi.hash && fi.hash !== hashActual) avisos.push("La firma de " + f.rol + " corresponde a una versión anterior del texto.");
  });
  return avisos;
}

function modalConsolidar() {
  var avisos = validar();
  var h = '<h2>CONSOLIDAR CONTRATO <button class="btn chico" data-accion="cerrar">Cerrar</button></h2>';
  h += '<p class="ayuda">Contrato <b>' + esc(st.id) + "</b> · " + esc(nombreCliente(st) || "sin cliente") + " · " + esc(totalTexto(st)) + "</p>";
  if (avisos.length) h += '<div class="aviso mal"><b>Revisá antes de enviar:</b><ul style="margin:6px 0 0;padding-left:18px">' + avisos.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul></div>";
  else h += '<div class="aviso bien">Todo en orden ✔</div>';
  h += '<div class="export-opciones">';
  h += '<button class="opcion" data-accion="exportar-pdf"><b>PDF</b><small>Se abre la ventana de impresión: elegí “Guardar como PDF”.</small></button>';
  h += '<button class="opcion" data-accion="exportar-word"><b>WORD (.docx)</b><small>Documento editable con logos, tablas y firmas.</small></button>';
  h += '<button class="opcion" data-accion="paquete"><b>PARA FIRMAR</b><small>Archivo que el cliente abre en su navegador para firmar a distancia.</small></button>';
  h += "</div>";
  h += '<p class="ayuda">En la ventana de PDF: Destino “Guardar como PDF”, márgenes “Predeterminados” y activá “Gráficos de fondo”.</p>';
  abrirModal(h);
}

function modalLista() {
  var ids = Object.keys(contratos).sort(function (a, b) { return (contratos[b].modificado || "").localeCompare(contratos[a].modificado || ""); });
  var h = '<h2>MIS CONTRATOS <button class="btn chico" data-accion="cerrar">Cerrar</button></h2>';
  h += '<table class="lista-contratos"><thead><tr><th>ID</th><th>Cliente</th><th>Proyecto</th><th>Total</th><th>Firmas</th><th></th></tr></thead><tbody>';
  ids.forEach(function (id) {
    var c = contratos[id];
    var lista = firmantes(c, cfg);
    var firmadas = lista.filter(function (f) { return c.firmas && c.firmas[f.key] && c.firmas[f.key].fecha; }).length;
    h += '<tr class="' + (id === st.id ? "actual" : "") + '"><td><b>' + esc(id) + "</b><br><span class=\"estado-firma\">" + esc(formatoFecha(c.fecha)) + "</span></td><td>" + esc(nombreCliente(c) || "—") + "</td><td>" + esc(c.proyecto || "—") + "</td><td>" + esc(totalTexto(c)) + "</td>";
    h += "<td>" + firmadas + " / " + lista.length + "</td><td style=\"white-space:nowrap\">";
    h += '<button class="btn chico" data-accion="abrir" data-id="' + esc(id) + '">Abrir</button> <button class="btn chico" data-accion="duplicar" data-id="' + esc(id) + '">Duplicar</button> ';
    h += '<button class="btn chico peligro" data-accion="eliminar" data-id="' + esc(id) + '">✕</button></td></tr>';
  });
  h += "</tbody></table>";
  h += '<p class="ayuda" style="margin-top:12px">“Duplicar” sirve para un cliente que vuelve: copia todo con un ID nuevo y sin firmas.</p>';
  abrirModal(h);
}

var padModal = null;
function modalFirmar(key) {
  var f = firmantes(st, cfg).filter(function (x) { return x.key === key; })[0];
  if (!f) return;
  var h = "<h2>FIRMAR · " + esc(f.rol) + ' <button class="btn chico" data-accion="cerrar">Cerrar</button></h2>';
  h += '<div class="grid2"><label class="f"><span>Nombre legal</span><input id="fm-nombre" value="' + esc(f.nombre || "") + '"></label>';
  h += '<label class="f"><span>Documento (cédula / DNI / pasaporte)</span><input id="fm-doc" value="' + esc(f.documento || "") + '"></label>';
  h += '<label class="f span2"><span>Email</span><input id="fm-email" value="' + esc(f.email || "") + '"></label></div>';
  h += '<label class="chk" style="margin:12px 0"><input type="checkbox" id="fm-acepto"><span>' + (key === "productor" ? "Confirmo el contenido del contrato." : "El firmante leyó el contrato completo y acepta sus términos.") + "</span></label>";
  h += '<canvas id="fm-pad" class="pad-grande"></canvas>';
  if (key === "productor") h += '<label class="chk" style="margin-top:10px"><input type="checkbox" id="fm-guardar" checked><span>Guardar como mi firma para próximos contratos</span></label>';
  h += '<div class="fila-botones"><button class="btn" id="fm-limpiar" type="button">Borrar trazo</button><button class="btn primario" data-accion="confirmar-firma" data-key="' + key + '">Confirmar firma</button></div>';
  abrirModal(h);
  padModal = crearPadFirma($("fm-pad"));
  $("fm-limpiar").addEventListener("click", function () { padModal.limpiar(); });
}

function confirmarFirma(key) {
  var nombre = nombrePropio($("fm-nombre").value), doc = $("fm-doc").value.trim();
  if (!nombre) return toast("Falta el nombre.");
  if (!$("fm-acepto").checked) return toast("Marcá la casilla de aceptación.");
  if (!padModal || padModal.estaVacio()) return toast("Dibujá la firma en el recuadro.");
  var img = padModal.imagen();
  st.firmas[key] = { img: img, nombre: nombre, documento: doc, email: $("fm-email").value.trim(), fecha: new Date().toISOString(), metodo: "presencial", dispositivo: describirDispositivo(), hash: hashActual };
  if (key === "productor" && $("fm-guardar") && $("fm-guardar").checked) cfg.firmaProductor = img;
  cerrarModal();
  alCambiar(true);
  setTimeout(renderTab, 30);
  toast("Firma registrada ✔");
}

/* ---------- archivos ---------- */

function pedirArchivo(accept, cb) {
  var input = $("input-archivo");
  input.value = "";
  input.accept = accept;
  input.onchange = function () {
    var f = input.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () { cb(String(r.result), f.name); };
    r.readAsText(f, "utf-8");
  };
  input.click();
}

function importarFirmado(texto) {
  var datos;
  try { datos = leerPaqueteFirmado(texto); } catch (e) { return toast(e.message); }
  if (datos.id !== st.id) {
    if (!contratos[datos.id]) return toast("No encuentro el contrato " + datos.id + " en este programa.");
    st = contratos[datos.id];
  }
  var nuevas = 0;
  Object.keys(datos.firmas || {}).forEach(function (k) {
    if (k === "productor") return;
    var fi = datos.firmas[k];
    if (fi && fi.fecha && (!st.firmas[k] || st.firmas[k].fecha !== fi.fecha)) { st.firmas[k] = fi; nuevas++; }
  });
  alCambiar(true);
  setTimeout(function () {
    renderTab();
    var avisos = [];
    if (datos.hashActual !== datos.hash) avisos.push("⚠ El texto del archivo recibido fue modificado después de emitido. No lo aceptes.");
    if (datos.hash !== hashActual) avisos.push("⚠ Cambiaste el contrato después de enviarlo: la firma corresponde a la versión enviada.");
    toast(nuevas + " firma(s) importada(s)" + (avisos.length ? " — revisá los avisos" : " ✔"));
    if (avisos.length) abrirModal('<h2>ATENCIÓN <button class="btn chico" data-accion="cerrar">Cerrar</button></h2>' + avisos.map(function (a) { return '<div class="aviso mal">' + esc(a) + "</div>"; }).join(""));
  }, 300);
}

async function exportarWordAccion() {
  try {
    toast("Generando Word…");
    var blob = await exportarWord(st, cfg, hashActual);
    descargarBlob(blob, nombreArchivo() + ".docx");
    toast("Word descargado ✔");
  } catch (e) {
    console.error(e);
    toast("Error al generar Word: " + e.message);
  }
}

function exportarPdfAccion(nombrePdf) {
  cerrarModal();
  var titulo = document.title;
  document.title = nombrePdf || nombreArchivo();
  var z = $("doc-root").style.zoom;
  $("doc-root").style.zoom = 1;
  setTimeout(function () {
    window.print();
    document.title = titulo;
    $("doc-root").style.zoom = z;
  }, 60);
}

function paqueteWhatsAppAccion() {
  var html = generarPaqueteFirma(st, cfg, hashActual);
  var nombre = nombreArchivo() + "_PARA_FIRMAR.html";
  var blob = new Blob([html], { type: "text/html;charset=utf-8" });
  var texto = "Hola! Te paso el contrato " + st.id + " de " + cfg.productor.alias + " para firmar. Abrilo en una computadora o en un celular Android con Chrome. Si tenés iPhone, la vista previa no deja escribir: avisame y te mando un link para firmar con el dedo. Si son dos artistas, cada uno elige SU nombre en «Firmo como», firma, y le pasa el archivo al otro. Al final tocá el botón verde para devolvérmelo.";
  var archivo = null;
  try { archivo = new File([blob], nombre, { type: "text/html" }); } catch (e) {}
  function alternativa() {
    descargarBlob(blob, nombre);
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
    toast("Se descargó " + nombre + ". En WhatsApp elegí el chat y adjuntalo con 📎 → Documento.");
  }
  if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    navigator.share({ files: [archivo], title: "Contrato " + st.id, text: texto }).catch(function (e) { if (e && e.name !== "AbortError") alternativa(); });
    return;
  }
  alternativa();
}

function instruccionesIphone() {
  var varios = firmantes(st, cfg).filter(function (f) { return f.key !== "productor"; }).length > 1;
  return "Hola! Te paso el contrato " + st.id + " de " + cfg.productor.alias + " en PDF para firmar desde el iPhone:\n" +
    "1) Abrí el PDF y tocá Compartir (el cuadrado con la flecha) → Marcación. Si no aparece, tocá «Guardar en Archivos», abrilo desde Archivos y tocá el lápiz.\n" +
    "2) Bajá hasta el final, al Anexo D (Firmas), y buscá el recuadro con tu nombre.\n" +
    "3) Tocá «+» → Firma, dibujá tu firma con el dedo y ponela arriba de la línea de tu recuadro.\n" +
    "4) Tocá «+» → Texto y escribí la fecha de hoy (y tu cédula si no aparece).\n" +
    (varios
      ? "5) Tocá OK. El primero que firma le reenvía el PDF firmado al otro artista, que hace lo mismo en SU recuadro y me lo manda a mí por este chat."
      : "5) Tocá OK y mandame el PDF firmado por este chat.");
}

function pdfIphoneAccion() {
  var yo = st.firmas && st.firmas.productor && st.firmas.productor.fecha;
  if (!yo && !confirm("Todavía no firmaste vos. Si seguís, el PDF sale sin tu firma. ¿Seguir igual?")) return;
  var listo = function () { toast("Instrucciones copiadas. En la ventana elegí «Guardar como PDF»"); };
  var fallo = function () { toast("Elegí «Guardar como PDF». Después tocá «Copiar instrucciones otra vez»"); };
  if (navigator.clipboard) navigator.clipboard.writeText(instruccionesIphone()).then(listo, fallo); else fallo();
  exportarPdfAccion(nombreArchivo() + "_FIRMAR_EN_PDF");
}

function seccionConfigLink() {
  var listo = linkConfigurado(cfg);
  var h = '<h3 class="sec" id="config-link">Link para firmar (iPhone)</h3>';
  h += '<p class="ayuda">Para que el cliente firme con el dedo desde un link, también en iPhone. Es gratis y se hace <b>una sola vez</b>. El contrato se sube <b>cifrado</b> a tu GitHub: sin el link completo nadie lo puede leer. clareny.com no se toca.</p>';
  if (!listo) {
    h += '<ol class="pasos-link">' +
      "<li>Creá una cuenta gratis en <b>github.com</b>.</li>" +
      "<li>Tocá <b>New</b> (repositorio nuevo). Nombre: <code>firmas</code>. Elegí <b>Public</b>, marcá <b>Add a README file</b> y tocá <b>Create repository</b>. <b>No uses el repositorio de tu web</b>: el programa se niega a publicar en un repositorio con dominio propio.</li>" +
      "<li>En ese repositorio: <b>Settings → Pages</b>. En «Branch» elegí <code>main</code> y tocá <b>Save</b>.</li>" +
      "<li>Creá el token: tu foto (arriba a la derecha) → <b>Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token</b>. Expiración: 1 año. En «Repository access» elegí <b>Only select repositories</b> → <code>firmas</code> (y <code>contratos-datos</code> si vas a sincronizar con el celular, ver abajo). En «Permissions» → <b>Contents</b> → <b>Read and write</b>. Tocá <b>Generate token</b> y copialo (empieza con <code>github_pat_</code>). Como el token solo abre esos repositorios, el programa no puede tocar tu web.</li>" +
      "<li>Completá acá abajo, tocá <b>Guardar token</b> y después <b>Probar</b>.</li></ol>";
  }
  h += '<div class="grid2">' + campo("Tu usuario de GitHub", "cfg:linkFirma.usuario", { ph: "ej: clareny" }) + campo("Repositorio", "cfg:linkFirma.repo", { ph: "firmas" });
  h += '<label class="f span2"><span>Token de GitHub' + (tokenLink() ? " (guardado ✔)" : "") + '</span><input type="password" id="link-token" autocomplete="off" placeholder="' + (tokenLink() ? "Pegá uno nuevo solo si querés cambiarlo" : "github_pat_…") + '"></label></div>';
  h += '<div class="fila-botones"><button class="btn primario" data-accion="guardar-token">Guardar token</button><button class="btn" data-accion="probar-link">Probar</button>' + (tokenLink() ? '<button class="btn peligro" data-accion="borrar-token">Borrar token</button>' : "") + "</div>";
  h += '<p class="ayuda">El token queda solo en este aparato: no va en la copia de seguridad, ni en los contratos, ni en la sincronización. En el celular lo pegás una vez.</p>';
  return h;
}

function seccionConfigSync() {
  var d = datosSync(cfg);
  var h = '<h3 class="sec" id="config-sync">Sincronizar compu y celular</h3>';
  h += '<p class="ayuda">Tus contratos quedan iguales en la compu y en el celular. Se guardan <b>cifrados</b> en un repositorio <b>privado</b> de tu GitHub: GitHub no los puede leer. Usa el mismo usuario y token de arriba.</p>';
  if (syncActiva()) {
    var est = ultimoEstadoSync;
    h += '<div class="aviso ' + (est.mal ? "mal" : "bien") + '"><b>Sincronización activa ✔</b> Repositorio privado <code>' + esc(d.repo) + "</code>." +
      (est.texto ? " " + esc(est.texto) + "." : "") + (est.error ? "<br>" + esc(est.error) : "") + "</div>";
    h += '<div class="fila-botones"><button class="btn primario" data-accion="sincronizar-ahora">Sincronizar ahora</button><button class="btn peligro" data-accion="desactivar-sync">Desactivar en este aparato</button></div>';
    h += '<p class="ayuda">Se sincroniza solo: al abrir el programa, unos segundos después de cada cambio y cada minuto y medio. En el otro aparato activala con la <b>misma clave</b>. GitHub guarda el historial: si algo sale mal, ninguna versión se pierde.</p>';
    return h;
  }
  h += '<ol class="pasos-link">' +
    "<li>En GitHub tocá <b>New</b>. Nombre: <code>contratos-datos</code>. Elegí <b>Private</b>, marcá <b>Add a README file</b> y tocá <b>Create repository</b>.</li>" +
    "<li>El token de arriba tiene que abrir también ese repositorio: en GitHub, <b>Settings → Developer settings → Fine-grained tokens</b> → tu token → <b>Edit</b> → en «Only select repositories» agregá <code>contratos-datos</code> → <b>Update</b>.</li>" +
    "<li>Inventá una <b>clave de sincronización</b> (mínimo 8 caracteres) y anotala en un lugar seguro. No es la de GitHub: con ella se cifran tus contratos. <b>Si la perdés, no se pueden leer los datos guardados en GitHub</b> (lo que tenés en cada aparato no se pierde).</li>" +
    "<li>Tocá <b>Activar sincronización</b>: primero en la compu (sube tus contratos) y después en el celular, con la misma clave.</li></ol>";
  h += '<div class="grid2">' + campo("Repositorio privado", "cfg:sync.repo", { ph: "contratos-datos" }) +
    '<label class="f"><span>Clave de sincronización</span><input type="password" id="sync-frase" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></label></div>';
  h += '<div class="fila-botones"><button class="btn primario" data-accion="activar-sync">Activar sincronización</button></div>';
  return h;
}

function textoLinkWhatsApp() {
  var varios = firmantes(st, cfg).filter(function (f) { return f.key !== "productor"; }).length > 1;
  return "Hola! Te paso el contrato " + st.id + " de " + cfg.productor.alias + " para firmar. Tocá el link, leé el contrato, completá tus datos y firmá con el dedo. Al final tocá el botón verde para devolvérmelo por WhatsApp." +
    (varios ? " Si son varios artistas, cada uno abre este mismo link, elige SU nombre en «Firmo como» y firma." : "") +
    "\n\n" + st.linkFirma.url;
}

function botonesLinkModal() {
  return '<div class="fila-botones"><button class="btn primario" data-accion="link-wa" style="background:#25d366;color:#04140a">Enviar link por WhatsApp</button><button class="btn" data-accion="copiar-link">Copiar link</button><button class="btn" data-accion="cerrar">Cerrar</button></div>';
}

function crearLinkAccion() {
  if (!linkConfigurado(cfg)) return irConfigLink();
  var yo = st.firmas && st.firmas.productor && st.firmas.productor.fecha;
  if (!yo && !confirm("Todavía no firmaste vos. Si seguís, el link sale sin tu firma. ¿Crear el link igual?")) return;
  var c = st, hash = hashActual, anterior = c.linkFirma;
  var estado = function (txt, cls) { var e = $("link-estado"); if (e) { e.className = "aviso" + (cls ? " " + cls : ""); e.innerHTML = txt; } };
  abrirModal('<h2>LINK PARA FIRMAR</h2><div id="link-estado" class="aviso">Subiendo el contrato cifrado…</div><div id="link-botones"></div>');
  subirLinkFirma(cfg, generarPaqueteFirma(c, cfg, hash)).then(function (link) {
    link.hash = hash;
    c.linkFirma = link;
    guardar();
    if (anterior && anterior.ruta) borrarLinkFirma(cfg, anterior).catch(function () {});
    estado("Publicando… GitHub tarda alrededor de 1 minuto. Dejá esta ventana abierta.");
    return esperarLinkPublicado(link.url, function (n) { estado("Publicando… GitHub tarda alrededor de 1 minuto. Dejá esta ventana abierta. (" + n * 5 + " s)"); });
  }).then(function (ok) {
    estado(ok ? "<b>¡Listo!</b> El link ya funciona. Mandalo por WhatsApp." : "GitHub todavía está publicando. Podés mandarlo igual: si el cliente ve un error, que espere un minuto y lo abra de nuevo.", ok ? "bien" : "info");
    var b = $("link-botones");
    if (b && st === c) b.innerHTML = botonesLinkModal();
    if (tabActual === "firmas") renderTab();
  }).catch(function (e) {
    estado("<b>No se pudo crear el link.</b> " + esc(e.message), "mal");
    var b = $("link-botones");
    if (b) b.innerHTML = '<div class="fila-botones"><button class="btn" data-accion="ir-config-link">Revisar configuración</button><button class="btn" data-accion="cerrar">Cerrar</button></div>';
  });
}

function irConfigLink() {
  cerrarModal();
  tabActual = "config";
  renderTabs();
  renderTab();
  setTimeout(function () { var s = $("config-link"); if (s) s.scrollIntoView({ block: "start" }); }, 30);
}

function paqueteAccion() {
  var html = generarPaqueteFirma(st, cfg, hashActual);
  descargarBlob(new Blob([html], { type: "text/html;charset=utf-8" }), nombreArchivo() + "_PARA_FIRMAR.html");
  toast("Archivo para firmar descargado ✔");
}

/* ---------- acciones ---------- */

var ACCIONES = {
  cerrar: cerrarModal,
  "agregar-artista": function () {
    var resto = Math.max(0, Math.round((100 - calcular(st).composicion) * 100) / 100);
    st.artistas.push(nuevoArtista(resto));
    toast(resto > 0 ? "Artista agregado con el " + resto + " % que faltaba" : "Artista agregado con 0 %: ajustá los porcentajes o tocá “Repartir”");
  },
  "quitar-artista": function (el) { st.artistas.splice(Number(el.dataset.i), 1); },
  repartir: function () {
    var n = st.artistas.length + (Number(st.productorComp) > 0 ? 1 : 0);
    var parte = Math.floor((100 / n) * 100) / 100;
    st.artistas.forEach(function (a) { a.comp = parte; });
    if (Number(st.productorComp) > 0) st.productorComp = parte;
    st.artistas[0].comp = Math.round((100 - parte * (n - 1)) * 100) / 100;
  },
  "comp-productor": function (el) {
    var n = Number(el.dataset.n);
    st.compProductor = "si";
    st.productorComp = n;
    st.artistas.forEach(function (a) { a.comp = 0; });
    repartirArtistas(Math.round((100 - n) * 100) / 100);
    toast(cfg.productor.alias + " " + String(n).replace(".", ",") + " % · artistas " + String(Math.round((100 - n) * 100) / 100).replace(".", ",") + " %");
  },
  "agregar-track": function (el) {
    var s = servicioPorId(cfg, el.dataset.serv);
    if (!st.tracks.length && s.moneda) st.moneda = s.moneda;
    st.tracks.push(nuevoTrack(s.id, nombreCliente(st)));
    toast("Agregado: " + s.nombre + (st.tiposTrabajoV1 ? " · " + TIPOS_TRABAJO[tipoTrabajo(st, cfg)].nombre : ""));
  },
  "moneda-contrato": function (el) { st.moneda = el.dataset.m; },
  "agregar-servicio-catalogo": function () {
    cfg.servicios.push({ id: "s" + Date.now().toString(36), entrega: "otro", nombre: "Nuevo servicio", unidad: "unidad", precio: 0, moneda: cfg.monedaDefecto || "USD", revisiones: 0, stems: false, grupo: "audio", derechos: "tecnico", incluye: "", noIncluye: "", revDesc: "" });
  },
  "quitar-servicio-catalogo": function (el) {
    var id = el.dataset.id;
    if (st.tracks.some(function (t) { return t.servicio === id; })) { toast("Este servicio está en el contrato abierto: quitalo de ahí primero."); return; }
    cfg.servicios = cfg.servicios.filter(function (s) { return s.id !== id; });
  },
  "quitar-track": function (el) { st.tracks.splice(Number(el.dataset.i), 1); },
  "duplicar-track": function (el) { var i = Number(el.dataset.i); st.tracks.splice(i + 1, 0, clonar(st.tracks[i])); },
  "subir-track": function (el) { var i = Number(el.dataset.i); if (i > 0) st.tracks.splice(i - 1, 0, st.tracks.splice(i, 1)[0]); },
  anticipo: function (el) { st.anticipoPct = Number(el.dataset.n); },
  "saldo-plazo": function (el) {
    st.saldoPlazoV1 = true;
    st.saldoPlazoNum = Number(el.dataset.n);
    st.saldoPlazoUnidad = "habiles";
  },
  puntos: function (el) { st.puntosPct = Number(el.dataset.n); },
  "puntos-pista": function (el) {
    var i = Number(el.dataset.i);
    if (!st.tracks[i]) return;
    st.tracks[i].masterModo = "puntos";
    st.tracks[i].puntosPct = Number(el.dataset.n);
  },
  "comp-pista": function (el) {
    var i = Number(el.dataset.i);
    if (!st.tracks[i]) return;
    st.tracks[i].compModo = "si";
    st.tracks[i].productorComp = Number(el.dataset.n);
  },
  "ley-autor-uy": function () { st.leyAutor = LEY_AUTOR_URUGUAY; st.ley = "la República Oriental del Uruguay"; },
  "obra-desde-pista": function () {
    var n = (st.tracks || []).map(tituloPista).filter(Boolean)[0];
    if (!n) return;
    st.proyecto = n;
    toast(st.formatoObra === "sencillo" ? n + " — Sencillo" : n);
  },
  "subir-clausula": function (el) { var i = Number(el.dataset.i); if (i > 0) st.clausulas.splice(i - 1, 0, st.clausulas.splice(i, 1)[0]); },
  "bajar-clausula": function (el) { var i = Number(el.dataset.i); if (i < st.clausulas.length - 1) st.clausulas.splice(i + 1, 0, st.clausulas.splice(i, 1)[0]); },
  "quitar-clausula": function (el) { if (confirm("¿Eliminar esta cláusula de este contrato?")) st.clausulas.splice(Number(el.dataset.i), 1); },
  "agregar-clausula": function () { st.clausulas.push({ id: "c" + Date.now(), titulo: "NUEVA CLÁUSULA", texto: "Escribí aquí el texto de la cláusula.", cond: "siempre", incluir: "auto" }); },
  "guardar-plantilla": function () { cfg.clausulas = clonar(st.clausulas); toast("Cláusulas guardadas como predeterminadas ✔"); },
  "restaurar-clausulas": function () {
    if (!confirm("¿Restaurar las cláusulas originales en este contrato? Se pierden tus cambios en este contrato.")) return;
    st.clausulas = clonar(CLAUSULAS_BASE).map(function (c) { c.incluir = "auto"; return c; });
    if (confirm("¿También borrar tus cláusulas por defecto guardadas?")) delete cfg.clausulas;
  },
  copiar: function (el) { if (navigator.clipboard) navigator.clipboard.writeText(el.dataset.txt); toast("Copiado: " + el.dataset.txt); },
  "copiar-iphone": function () {
    if (navigator.clipboard) navigator.clipboard.writeText(instruccionesIphone());
    toast("Instrucciones copiadas: pegalas en WhatsApp junto con el PDF");
    return "sin-render";
  },
  firmar: function (el) { modalFirmar(el.dataset.key); return "sin-render"; },
  "confirmar-firma": function (el) { confirmarFirma(el.dataset.key); return "sin-render"; },
  "usar-mi-firma": function () {
    var p = cfg.productor;
    st.firmas.productor = { img: cfg.firmaProductor, nombre: p.nombre, documento: p.documento, email: p.email, fecha: new Date().toISOString(), metodo: "presencial", dispositivo: describirDispositivo(), hash: hashActual };
    toast("Tu firma fue aplicada ✔");
  },
  "borrar-firma": function (el) { if (confirm("¿Borrar esta firma?")) delete st.firmas[el.dataset.key]; },
  "borrar-mi-firma": function () { cfg.firmaProductor = null; },
  paquete: function () { paqueteAccion(); return "sin-render"; },
  "paquete-wa": function () { paqueteWhatsAppAccion(); return "sin-render"; },
  "importar-firmado": function () { pedirArchivo(".html,text/html", importarFirmado); return "sin-render"; },
  "exportar-pdf": function () { exportarPdfAccion(); return "sin-render"; },
  "pdf-iphone": function () { pdfIphoneAccion(); return "sin-render"; },
  "crear-link": function () { crearLinkAccion(); return "sin-render"; },
  "ir-config-link": function () { irConfigLink(); return "sin-render"; },
  "link-wa": function () {
    if (!st.linkFirma) return "sin-render";
    window.open("https://wa.me/?text=" + encodeURIComponent(textoLinkWhatsApp()), "_blank");
    return "sin-render";
  },
  "copiar-link": function () {
    if (!st.linkFirma) return "sin-render";
    if (navigator.clipboard) navigator.clipboard.writeText(textoLinkWhatsApp()).then(function () { toast("Mensaje con el link copiado: pegalo en WhatsApp"); }, function () { toast("No se pudo copiar"); });
    return "sin-render";
  },
  "borrar-link": function () {
    var c = st, lk = c.linkFirma;
    if (!lk || !confirm("¿Borrar el link? El cliente ya no lo va a poder abrir.")) return "sin-render";
    borrarLinkFirma(cfg, lk).then(function () {
      delete c.linkFirma;
      guardar();
      if (st === c && tabActual === "firmas") renderTab();
      toast("Link borrado ✔");
    }, function (e) { toast("No se pudo borrar: " + e.message); });
    return "sin-render";
  },
  "guardar-token": function () {
    var t = ($("link-token") && $("link-token").value || "").trim();
    if (!t) { toast("Pegá el token en el campo"); return "sin-render"; }
    guardarTokenLink(t);
    toast("Token guardado ✔. Ahora tocá «Probar»");
  },
  "borrar-token": function () { if (confirm("¿Borrar el token de este aparato?")) guardarTokenLink(""); },
  "probar-link": function () {
    var cab = '<h2>LINK PARA FIRMAR <button class="btn chico" data-accion="cerrar">Cerrar</button></h2>';
    abrirModal(cab + '<div class="aviso">Probando conexión con GitHub…</div>');
    probarLinkFirma(cfg).then(function (url) {
      abrirModal(cab + '<div class="aviso bien"><b>Todo bien ✔</b> Los links van a salir en <code>' + esc(url) + "</code>. Ya podés crear links en la pestaña Firmas.</div>");
    }, function (e) { abrirModal(cab + '<div class="aviso mal">' + esc(e.message) + "</div>"); });
    return "sin-render";
  },
  "activar-sync": function () {
    var frase = ($("sync-frase") && $("sync-frase").value) || "";
    var cab = '<h2>SINCRONIZAR <button class="btn chico" data-accion="cerrar">Cerrar</button></h2>';
    if (!linkConfigurado(cfg)) { toast("Primero completá tu usuario de GitHub y guardá el token (arriba)"); return "sin-render"; }
    guardar();
    abrirModal(cab + '<div class="aviso">Conectando con GitHub y cifrando tus contratos… puede tardar un minuto.</div>');
    activarSync(frase).then(function (r) {
      abrirModal(cab + (r.ok ?
        '<div class="aviso bien"><b>Sincronización activa ✔</b> ' + (r.cambios ? r.cambios + " cambio(s) sincronizado(s). " : "") + "Ahora activala en tu otro aparato con la misma clave.</div>" :
        '<div class="aviso mal"><b>Quedó activada, pero todavía no se pudo sincronizar:</b> ' + esc(r.error || "") + "</div>"));
      if (tabActual === "config") renderTab();
    }, function (e) { abrirModal(cab + '<div class="aviso mal">' + esc(e.message) + "</div>"); });
    return "sin-render";
  },
  "sincronizar-ahora": function () {
    guardar();
    sincronizar().then(function (r) {
      toast(r.ok ? "Sincronizado ✔" + (r.cambios ? " (" + r.cambios + " cambio" + (r.cambios === 1 ? "" : "s") + ")" : "") : "No se pudo sincronizar: " + r.error);
      if (tabActual === "config") renderTab();
    });
    return "sin-render";
  },
  "desactivar-sync": function () {
    if (!confirm("¿Desactivar la sincronización en este aparato? Tus contratos quedan acá y en GitHub.")) return "sin-render";
    desactivarSync();
  },
  "exportar-word": function () { exportarWordAccion(); return "sin-render"; },
  abrir: function (el) { st = contratos[el.dataset.id]; cerrarModal(); },
  duplicar: function (el) {
    var copia = clonar(contratos[el.dataset.id]);
    copia.id = siguienteId(); copia.fecha = hoyISO(); copia.firmas = {}; copia.version = "1.0";
    copia.creado = new Date().toISOString();
    copia.formatoObraV1 = true;
    copia.saldoPlazoV1 = true;
    copia.derechosPistaV1 = true;
    if (!(Number(copia.saldoPlazoNum) > 0)) copia.saldoPlazoNum = 5;
    if (!copia.saldoPlazoUnidad) copia.saldoPlazoUnidad = "habiles";
    asegurarPlazoSaldoEnClausula(copia.clausulas);
    asegurarRepartoPorPistaEnClausula(copia.clausulas);
    contratos[copia.id] = copia; st = copia;
    cerrarModal();
    toast("Duplicado como " + copia.id);
  },
  eliminar: function (el) {
    var id = el.dataset.id;
    if (!confirm("¿Eliminar el contrato " + id + "? No se puede deshacer.")) return "sin-render";
    delete contratos[id];
    eliminados[id] = true;
    if (st.id === id) { var resto = Object.keys(contratos); st = resto.length ? contratos[resto[0]] : nuevoContrato(); }
    guardar();
    modalLista();
    return "sin-render";
  },
  backup: function () {
    var datos = { tipo: "clareny-contratos", fecha: new Date().toISOString(), config: cfg, contratos: contratos };
    descargarBlob(new Blob([JSON.stringify(datos, null, 1)], { type: "application/json" }), "Clareny_contratos_backup_" + hoyISO() + ".json");
    return "sin-render";
  },
  "restaurar-backup": function () {
    pedirArchivo(".json,application/json", function (texto) {
      try {
        var d = JSON.parse(texto);
        if (d.tipo !== "clareny-contratos") throw new Error("Archivo no válido");
        if (!confirm("Esto reemplaza tus datos actuales por la copia del " + formatoFecha(String(d.fecha).slice(0, 10)) + ". ¿Continuar?")) return;
        Object.keys(contratos).forEach(function (k) { if (!d.contratos[k]) eliminados[k] = true; });
        cfg = d.config; contratos = d.contratos;
        st = contratos[Object.keys(contratos)[0]] || nuevoContrato();
        guardar(); renderTodo(); toast("Copia restaurada ✔");
      } catch (e) { toast("No se pudo restaurar: " + e.message); }
    });
    return "sin-render";
  },
};

function renderTodo() {
  renderTabs();
  renderVista();
  renderTab();
}

/* ---------- eventos ---------- */

function esNombreLegal(ruta) {
  return /^artistas\.\d+\.nombre$/.test(ruta) || ruta === "cliente.representante" || ruta === "cfg:productor.nombre" ||
    (ruta === "cliente.razon" && st.tipoCliente !== "sello");
}

function esNombreArtistico(ruta) {
  return /^artistas\.\d+\.artistico$/.test(ruta) || ruta === "cfg:productor.alias" || (ruta === "cliente.artistico" && st.tipoCliente !== "sello");
}

function alEditar(ev) {
  var el = ev.target;
  var ruta = el.getAttribute && el.getAttribute("data-k");
  if (!ruta) return;
  var v;
  if (el.type === "checkbox") v = el.checked;
  else if (el.type === "number") v = el.value === "" ? "" : Number(el.value);
  else v = el.value;
  if (ev.type === "change" && esNombreLegal(ruta)) { v = nombrePropio(v); el.value = v; }
  if (ev.type === "change" && esNombreArtistico(ruta)) { v = nombreArtistico(v); el.value = v; }
  var r = raiz(ruta);
  asignar(r.obj, r.ruta, v);

  var m = ruta.match(/^tracks\.(\d+)\.servicio$/);
  if (m) {
    var s = servicioPorId(cfg, v);
    var tr = st.tracks[Number(m[1])];
    tr.revisiones = s.revisiones;
    tr.precio = s.precio || tr.precio;
    tr.stems = s.id === "stems" ? true : tr.stems;
    tr.entregable = ""; tr.formato = ""; tr.mp3 = null; tr.incluye = ""; tr.noIncluye = "";
    completarEntrega(tr);
    if (!Object.keys(st.firmas || {}).length && tr.precioModo !== "pagado" && tr.precioModo !== "gratis") {
      tr.precioModo = Number(s.precio) > 0 ? "precio" : "cotizar";
      tr.gratis = false;
    }
  }
  alCambiar();
  if (el.dataset.re && ev.type === "change") setTimeout(renderTab, 0);
}

function iniciar() {
  cargar();
  var estilo = document.createElement("style");
  estilo.id = "estilo-pagina";
  document.head.appendChild(estilo);
  var estiloDoc = document.createElement("style");
  estiloDoc.textContent = (window.FUENTES_CSS || "") + (window.FUENTES_UI_CSS || "") + CONTRATO_CSS;
  document.head.appendChild(estiloDoc);

  $("tabs").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-tab]");
    if (!b) return;
    tabActual = b.dataset.tab;
    renderTabs();
    $("tab-body").scrollTop = 0;
    renderTab();
  });

  var panel = $("tab-body");
  panel.addEventListener("input", alEditar);
  panel.addEventListener("change", alEditar);

  document.addEventListener("click", function (ev) {
    var op = ev.target.closest("[data-opcion]");
    if (op) {
      var dest = raiz(op.dataset.opcion);
      asignar(dest.obj, dest.ruta, op.dataset.valor);
      if (op.dataset.opcion === "compProductor") {
        if (op.dataset.valor === "no" && Number(st.productorComp) > 0) { st.productorComp = 0; repartirArtistas(100); }
        if (op.dataset.valor === "si" && !(Number(st.productorComp) > 0)) {
          st.productorComp = Math.min(99, Number(cfg.condiciones.productorComp) || 50);
          repartirArtistas(Math.round((100 - st.productorComp) * 100) / 100);
        }
      }
      if (/\.precioModo$/.test(op.dataset.opcion)) {
        var trModo = obtener(st, op.dataset.opcion.replace(/\.precioModo$/, ""));
        if (trModo) trModo.gratis = op.dataset.valor === "gratis";
      }
      var mMaster = op.dataset.opcion.match(/^tracks\.(\d+)\.masterModo$/);
      if (mMaster) {
        var trM = st.tracks[Number(mMaster[1])];
        if (trM && op.dataset.valor === "puntos" && !(Number(trM.puntosPct) > 0)) {
          trM.puntosPct = st.regalias === "puntos" ? (Number(st.puntosPct) || 3) : 3;
        }
      }
      var mCompP = op.dataset.opcion.match(/^tracks\.(\d+)\.compModo$/);
      if (mCompP) {
        var trC = st.tracks[Number(mCompP[1])];
        if (trC && op.dataset.valor === "si" && !(Number(trC.productorComp) > 0)) {
          trC.productorComp = Number(st.productorComp) > 0 ? Number(st.productorComp) : 50;
        }
      }
      if (op.dataset.opcion === "formatoObra" && op.dataset.valor === "sencillo" && !String(st.proyecto || "").trim()) {
        var nomPista = (st.tracks || []).map(tituloPista).filter(Boolean)[0];
        if (nomPista) st.proyecto = nomPista;
      }
      if (op.dataset.opcion === "tipoCliente" && (op.dataset.valor === "colab" || op.dataset.valor === "duo") && st.artistas.length < 2) {
        st.artistas.push(nuevoArtista(Math.max(0, Math.round((100 - calcular(st).composicion) * 100) / 100)));
        toast("Agregué un segundo artista: completalo en “Cliente y artistas”");
      }
      alCambiar(true);
      renderTab();
      return;
    }
    var b = ev.target.closest("[data-accion]");
    if (!b || !ACCIONES[b.dataset.accion]) return;
    var res = ACCIONES[b.dataset.accion](b);
    if (res !== "sin-render") {
      alCambiar(true);
      setTimeout(function () { renderTabs(); renderTab(); }, 10);
    }
  });

  $("modal").addEventListener("click", function (ev) { if (ev.target.id === "modal") cerrarModal(); });
  $("btn-nuevo").addEventListener("click", function () {
    st = nuevoContrato();
    contratos[st.id] = st;
    tabActual = "contrato";
    guardar();
    renderTodo();
    toast("Contrato nuevo: " + st.id);
  });
  $("btn-lista").addEventListener("click", modalLista);
  $("btn-consolidar").addEventListener("click", modalConsolidar);
  $("zoom-menos").addEventListener("click", function () { zoom = Math.max(0.3, (zoom || Number($("doc-root").style.zoom) || 1) - 0.1); aplicarZoom(); });
  $("zoom-mas").addEventListener("click", function () { zoom = Math.min(2, (zoom || Number($("doc-root").style.zoom) || 1) + 0.1); aplicarZoom(); });
  $("zoom-ajustar").addEventListener("click", function () { zoom = 0; aplicarZoom(); });
  window.addEventListener("resize", function () { if (!zoom) aplicarZoom(); });
  document.addEventListener("keydown", function (ev) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "p") { ev.preventDefault(); exportarPdfAccion(); }
    if (ev.key === "Escape") cerrarModal();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") programarSync(300);
    else if (timerSync) programarSync(0);
  });
  setInterval(function () { if (document.visibilityState === "visible") programarSync(0); }, 90000);

  guardar();
  renderTodo();
  programarSync(800);
}

document.addEventListener("DOMContentLoaded", iniciar);
