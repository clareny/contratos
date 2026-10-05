/* Construcción del contrato: cálculos, textos y HTML del documento.
   El mismo HTML se usa para la vista previa, el PDF y el archivo para firmar. */

var CONTRATO_CSS = `
.doc { --ink:#0d1117; --muted:#5b6672; --line:#c8d4de; --soft:#f3f6f8; --cyan:#1cdadd; --cyan-dark:#0a8f94; --violet:#b875ff;
  background:#fff; color:var(--ink); font-family:"Segoe UI", Roboto, Arial, sans-serif; font-size:10pt; line-height:1.5;
  width:210mm; min-height:297mm; box-sizing:border-box; padding:16mm 17mm 18mm; margin:0 auto;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.doc * { box-sizing:border-box; }
.doc h1, .doc h2, .doc h3, .doc .tk { font-family:"Tektur", "Bahnschrift", "Segoe UI", sans-serif; }
.doc-head { display:grid; grid-template-columns:62px 1fr 62px; align-items:center; gap:14px; padding-bottom:10px; }
.doc-head img { width:62px; height:62px; object-fit:contain; }
.doc-head .centro { text-align:center; }
.doc-head .marca { font-family:"Tektur", "Bahnschrift", sans-serif; font-weight:800; font-size:22pt; letter-spacing:.32em; margin:0; line-height:1.1; padding-left:.32em; }
.doc-head .titulo { font-family:"Tektur", "Bahnschrift", sans-serif; font-weight:600; font-size:10.5pt; letter-spacing:.08em; margin:4px 0 2px; }
.doc-head .sub { color:var(--muted); font-size:8.5pt; letter-spacing:.04em; }
.doc-barra { height:4px; border-radius:2px; background:linear-gradient(90deg, #0d1117 0%, var(--cyan) 55%, var(--violet) 100%); margin:0 0 14px; }
.doc-meta { display:grid; grid-template-columns:repeat(3, 1fr); border:1px solid var(--line); border-radius:6px; overflow:hidden; margin-bottom:14px; }
.doc-meta > div { padding:6px 9px; border-right:1px solid var(--line); border-bottom:1px solid var(--line); background:#fff; }
.doc-meta > div:nth-child(3n) { border-right:0; }
.doc-meta > div.ancho { grid-column:span 3; border-right:0; }
.doc-meta > div:nth-last-child(-n+1) { border-bottom:0; }
.lbl { display:block; font-family:"Tektur", "Bahnschrift", sans-serif; font-size:6.8pt; letter-spacing:.12em; text-transform:uppercase; color:var(--cyan-dark); font-weight:600; }
.val { font-weight:600; }
.vacio { color:#9aa4ad; font-weight:400; }
.doc h2 { font-size:10.5pt; font-weight:600; letter-spacing:.06em; margin:16px 0 6px; padding:3px 0 3px 9px; border-left:3px solid var(--cyan); break-after:avoid; page-break-after:avoid; }
.doc p { margin:0 0 6px; text-align:justify; }
.doc ul { margin:0 0 6px 0; padding-left:18px; }
.doc li { margin:0 0 2px; }
.doc strong { font-weight:700; }
.partes { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:6px 0 4px; break-inside:avoid; }
.parte { border:1px solid var(--line); border-radius:6px; overflow:hidden; }
.parte-t { background:#0d1117; color:#fff; font-family:"Tektur", "Bahnschrift", sans-serif; font-size:8pt; letter-spacing:.14em; padding:5px 9px; }
.parte-t span { color:var(--cyan); }
.parte dl { margin:0; padding:6px 9px; display:grid; grid-template-columns:auto 1fr; gap:2px 10px; font-size:9pt; }
.parte dt { color:var(--muted); font-size:8pt; padding-top:1px; }
.parte dd { margin:0; font-weight:600; word-break:break-word; }
.anexo { break-before:page; page-break-before:always; }
.anexo-t { display:flex; align-items:baseline; gap:10px; margin:0 0 4px; }
.anexo-t .tag { background:#0d1117; color:var(--cyan); font-family:"Tektur", "Bahnschrift", sans-serif; font-weight:600; font-size:8.5pt; letter-spacing:.16em; padding:3px 9px; border-radius:3px; }
.anexo-t h3 { margin:0; font-size:10.5pt; letter-spacing:.06em; font-weight:600; }
.anexo-intro { color:var(--muted); font-size:8.8pt; margin-bottom:8px; }
.sub-anexo { font-family:"Tektur", "Bahnschrift", sans-serif; font-size:9pt; font-weight:600; letter-spacing:.08em; text-transform:uppercase; margin:12px 0 2px; break-after:avoid; }
table.tbl { width:100%; border-collapse:collapse; font-size:8.6pt; margin:4px 0 10px; }
table.tbl th { background:#0d1117; color:#fff; font-family:"Tektur", "Bahnschrift", sans-serif; font-weight:600; font-size:7.2pt; letter-spacing:.08em; text-transform:uppercase; text-align:left; padding:5px 6px; }
table.tbl td { border-bottom:1px solid var(--line); padding:5px 6px; vertical-align:top; }
table.tbl tr:nth-child(even) td { background:var(--soft); }
table.tbl td.num, table.tbl th.num { text-align:right; white-space:nowrap; }
table.tbl td.alcance { font-size:8.2pt; line-height:1.35; }
table.tbl td.alcance b { display:block; font-size:7pt; letter-spacing:.08em; text-transform:uppercase; margin:5px 0 2px; }
table.tbl td.alcance b:first-child { margin-top:0; }
table.tbl td.alcance ul { margin:0 0 6px 16px; padding:0; }
table.tbl td.alcance ul.no { color:#5c6570; }
table.tbl tr { break-inside:avoid; }
table.tbl tfoot td { font-weight:700; background:#fff !important; border-bottom:0; border-top:2px solid #0d1117; }
.caja { border:1px solid var(--line); border-radius:6px; padding:7px 10px; margin:6px 0 10px; font-size:9pt; break-inside:avoid; }
.caja.ok { border-color:#72d6b8; background:#f1fbf7; }
.caja.alerta { border-color:#f1aeb5; background:#fff5f6; }
.grid-econ { display:grid; grid-template-columns:1fr 1fr; border:1px solid var(--line); border-radius:6px; overflow:hidden; margin:6px 0 10px; }
.grid-econ > div { padding:7px 10px; border-bottom:1px solid var(--line); }
.grid-econ > div:nth-child(odd) { border-right:1px solid var(--line); }
.grid-econ > div.ancho { grid-column:span 2; border-right:0; }
.grid-econ .val.grande { font-size:12pt; }
.firmas { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px; }
.firma-box { border:1px solid var(--line); border-radius:6px; padding:9px 11px; break-inside:avoid; page-break-inside:avoid; font-size:8.8pt; }
.firma-rol { font-family:"Tektur", "Bahnschrift", sans-serif; font-size:7.5pt; letter-spacing:.14em; color:var(--cyan-dark); font-weight:600; margin-bottom:2px; }
.firma-img { height:60px; display:flex; align-items:flex-end; justify-content:center; }
.firma-img img { max-height:58px; max-width:100%; }
.firma-linea { border-top:1px solid #0d1117; margin:2px 0 5px; }
.firma-box .fila { display:flex; gap:6px; }
.firma-box .fila b { color:var(--muted); font-weight:400; min-width:66px; }
.firma-sello { margin-top:5px; font-size:7.3pt; color:#0a6b6f; background:#effbfb; border:1px dashed #8feff2; border-radius:4px; padding:3px 6px; }
.verif { margin-top:12px; font-size:7.6pt; color:var(--muted); border-top:1px solid var(--line); padding-top:6px; }
.verif code { font-family:Consolas, monospace; color:var(--ink); word-break:break-all; }
.anexo.seguido { break-before:auto; page-break-before:auto; margin-top:22px; }
.resumen-simple { border:1.5px solid var(--cyan); border-radius:8px; background:#f2fdfd; padding:9px 12px 7px; margin:0 0 14px; break-inside:avoid; }
.resumen-simple .rs-t { font-family:"Tektur", "Bahnschrift", sans-serif; font-size:8.5pt; font-weight:700; letter-spacing:.14em; color:var(--cyan-dark); margin-bottom:5px; }
.resumen-simple dl { margin:0; display:grid; grid-template-columns:150px 1fr; gap:4px 12px; font-size:9.2pt; }
.resumen-simple dt { font-weight:700; }
.resumen-simple dd { margin:0; }
.resumen-simple .rs-nota { font-size:7.8pt; color:var(--muted); margin:6px 0 0; }
.guia-pasos { margin:2px 0 8px; padding-left:20px; font-size:9pt; }
.guia-pasos li { margin:0 0 3px; }
.doc-fin { margin-top:14px; text-align:center; font-family:"Tektur", "Bahnschrift", sans-serif; font-size:7.5pt; letter-spacing:.2em; color:var(--muted); }
`;

var NUMEROS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
  "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
var DECENAS = { 3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa" };

function numeroEnLetras(n) {
  n = Math.round(Number(n) || 0);
  if (n < 30) return NUMEROS[n];
  if (n < 100) {
    var d = Math.floor(n / 10), u = n % 10;
    return DECENAS[d] + (u ? " y " + (u === 1 ? "uno" : NUMEROS[u]) : "");
  }
  if (n === 100) return "cien";
  if (n < 200) return "ciento " + numeroEnLetras(n - 100);
  if (n < 1000 && n % 100 === 0) {
    var c = { 2: "doscientos", 3: "trescientos", 4: "cuatrocientos", 5: "quinientos", 6: "seiscientos", 7: "setecientos", 8: "ochocientos", 9: "novecientos" };
    return c[n / 100];
  }
  return String(n);
}

function cantidadConLetras(n, singular, plural) {
  var num = Number(n) || 0;
  var palabra = num === 1 ? singular : plural;
  var letras = numeroEnLetras(num);
  if (num === 1 && /a$/.test(singular)) letras = "una";
  if (num === 1 && !/a$/.test(singular)) letras = "un";
  return letras + " (" + num + ") " + palabra;
}

var UNIDADES_PLAZO = {
  dias: ["día", "días"],
  habiles: ["día hábil", "días hábiles"],
  semanas: ["semana", "semanas"],
  meses: ["mes", "meses"],
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function vacio(v, relleno) {
  return v != null && String(v).trim() !== "" ? esc(v) : '<span class="vacio">' + (relleno || "____________________") + "</span>";
}

function formatoMoneda(n, moneda) {
  var num = Number(n) || 0;
  try {
    return new Intl.NumberFormat("es-UY", { style: "currency", currency: moneda || "USD", minimumFractionDigits: 2 }).format(num);
  } catch (e) {
    return (moneda || "") + " " + num.toFixed(2);
  }
}

function formatoFecha(iso) {
  if (!iso) return "";
  var p = iso.split("-");
  if (p.length !== 3) return iso;
  var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return Number(p[2]) + " de " + meses[Number(p[1]) - 1] + " de " + p[0];
}

function unidadConCantidad(unidad, cant) {
  var u = String(unidad || "unidad");
  if (Number(cant) === 1) return u;
  if (/ón$/.test(u)) return u.replace(/ón$/, "ones");
  if (/[lnrdzj]$/i.test(u)) return u + "es";
  return u + "s";
}

/* "ezequiel lugo DE la cruz" → "Ezequiel Lugo de la Cruz". */
function nombrePropio(s) {
  var menores = { de: 1, del: 1, la: 1, las: 1, los: 1, y: 1, e: 1, da: 1, das: 1, do: 1, dos: 1, van: 1, von: 1 };
  return String(s || "").trim().replace(/\s+/g, " ").toLowerCase().split(" ").map(function (w, i) {
    if (i > 0 && menores[w]) return w;
    return w.split("-").map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join("-");
  }).join(" ");
}

function nombreArtistico(s) { return String(s || "").trim().replace(/\s+/g, " ").toUpperCase(); }

/* tr.unidad fija la unidad en contratos firmados antes de un cambio de unidad del servicio. */
function unidadTrack(cfg, t) { return t.unidad || servicioPorId(cfg, t.servicio).unidad; }

function sinTituloTrack(st, cfg, t) { return !!(st.resumenDerechos && !t.unidad && servicioPorId(cfg, t.servicio).sinTitulo); }

function tituloPista(t) { return String((t && t.titulo) || "").trim(); }

function formatoObraDe(st) {
  return (st.formatoObraV1 && FORMATOS_OBRA[st.formatoObra]) ? FORMATOS_OBRA[st.formatoObra] : null;
}

function textoObra(st) {
  var nom = String(st.proyecto || "").trim();
  var f = formatoObraDe(st);
  if (!f || !f.sufijo) return nom;
  if (!nom) return "";
  if (nom.toLowerCase().indexOf(f.sufijo.toLowerCase()) >= 0) return nom;
  return nom + " — " + f.sufijo;
}

function textoAlcanceObra(st) {
  var f = formatoObraDe(st);
  var nom = String(st.proyecto || "").trim();
  if (!f) return "";
  if (st.formatoObra === "sencillo") {
    return (nom ? "Sencillo «" + nom + "»" : "Sencillo") + ". Este acuerdo identifica esa canción; no cubre un álbum, un EP ni otras obras.";
  }
  if (st.formatoObra === "ep") {
    return (nom ? "EP «" + nom + "»" : "EP") + ". Este acuerdo cubre las canciones del EP indicadas en el Anexo B; no se extiende a un álbum ni a otras obras.";
  }
  if (st.formatoObra === "album") {
    return (nom ? "Álbum «" + nom + "»" : "Álbum") + ". Este acuerdo cubre las canciones del álbum indicadas en el Anexo B.";
  }
  return nom ? "Proyecto «" + nom + "», según el Anexo B." : "Según el Anexo B.";
}

function etiquetaColPista(st) { return st.colNombreV1 ? "Nombre" : "Canción"; }

function htmlCeldaNombre(st, cfg, t) {
  if (st.colNombreV1) { var n = tituloPista(t); return n ? esc(n) : "—"; }
  return sinTituloTrack(st, cfg, t) ? "—" : vacio(t.titulo, "__________");
}

function textoCeldaNombre(st, cfg, t) {
  if (st.colNombreV1) return tituloPista(t) || "—";
  return sinTituloTrack(st, cfg, t) ? "—" : (tituloPista(t) || "_______");
}

function textoRefPista(st, cfg, t) {
  var n = tituloPista(t);
  if (st.colNombreV1) return n || nombreServicio(cfg, t);
  return (!sinTituloTrack(st, cfg, t) && n) ? n : nombreServicio(cfg, t);
}

function servicioPorId(cfg, id) {
  for (var i = 0; i < cfg.servicios.length; i++) if (cfg.servicios[i].id === id) return cfg.servicios[i];
  return { id: id, nombre: id || "Servicio", unidad: "unidad", revisiones: 0, revDesc: "", grupo: "extra" };
}

/* t.nombreFijo / t.revDescFijo / t.incluyeFijo congelan el texto en contratos firmados antes de un cambio del catálogo. */
function nombreServicio(cfg, t) {
  if (t.servicio === "otro" && t.servicioNombre) return t.servicioNombre;
  return t.nombreFijo || servicioPorId(cfg, t.servicio).nombre;
}

/* Fija en cada pista el nombre, "qué incluye" y la descripción de revisiones con que se firmó el contrato. */
function congelarTextosServicios(c, cfg) {
  (c.tracks || []).forEach(function (t) {
    var s = servicioPorId(cfg, t.servicio);
    var antes = (window.SERVICIOS_ANTERIORES || {})[s.id] || {};
    if (!t.nombreFijo && !(t.servicio === "otro" && t.servicioNombre)) t.nombreFijo = s.nombre;
    if (t.incluyeFijo == null) t.incluyeFijo = textoIncluye(s.incluye) || textoIncluye(antes.incluye) || incluyeServicio(cfg, t);
    if (t.noIncluyeFijo == null) t.noIncluyeFijo = textoIncluye(s.noIncluye) || textoIncluye(antes.noIncluye) || "";
    if (t.revDescFijo == null) t.revDescFijo = textoIncluye(s.revDesc) || textoIncluye(antes.revDesc) || "";
  });
}

function creaObra(s) { return s.derechos ? s.derechos === "composicion" : s.grupo === "beat" || s.grupo === "produccion"; }

function pistaCreaObra(cfg, t) { return creaObra(servicioPorId(cfg, t.servicio)); }

function masterModoPista(tr) {
  return (tr && (tr.masterModo === "no" || tr.masterModo === "puntos")) ? tr.masterModo : "hereda";
}

function compModoPista(tr) {
  return (tr && (tr.compModo === "no" || tr.compModo === "si")) ? tr.compModo : "hereda";
}

function pctMasterProductorPista(st, tr) {
  var m = masterModoPista(tr);
  if (m === "no") return 0;
  if (m === "puntos") return Math.min(99.99, Math.max(0, Number(tr.puntosPct) || 0));
  return st.regalias === "puntos" ? Math.min(99.99, Math.max(0, Number(st.puntosPct) || 0)) : 0;
}

function pctCompProductorPista(st, tr) {
  var m = compModoPista(tr);
  if (m === "no") return 0;
  if (m === "si") return Math.min(100, Math.max(0, Number(tr.productorComp) || 0));
  return Math.min(100, Math.max(0, Number(st.productorComp) || 0));
}

function pistasConObra(st, cfg) {
  return (st.tracks || []).filter(function (t) { return pistaCreaObra(cfg, t); });
}

function hayOverrideDerechosPista(st, cfg) {
  if (!st || !st.derechosPistaV1) return false;
  return pistasConObra(st, cfg).some(function (t) {
    return masterModoPista(t) !== "hereda" || compModoPista(t) !== "hereda";
  });
}

function muestraDerechosPorPista(st, cfg) {
  return !!(st && st.derechosPistaV1 && cfg && pistasConObra(st, cfg).length);
}

function restoPct(n) { return Math.round((100 - (Number(n) || 0)) * 100) / 100; }

function pctEsp(n) { return numPct(Number(n) || 0).replace("%", " %"); }

/* "produccion" si algún servicio crea la canción; "servicio" si todo es técnico (contratos con tiposTrabajoV1). */
function tipoTrabajo(st, cfg) {
  if (!st.tiposTrabajoV1) return "produccion";
  if (st.tipoTrabajo === "produccion" || st.tipoTrabajo === "servicio") return st.tipoTrabajo;
  var tracks = st.tracks || [];
  if (!tracks.length) return "produccion";
  return tracks.some(function (t) { return creaObra(servicioPorId(cfg, t.servicio)); }) ? "produccion" : "servicio";
}

function esServicio(st, cfg) { return tipoTrabajo(st, cfg) === "servicio"; }

function tituloDocumento(st, cfg) {
  var t = st.titulo || "";
  if (!st.tiposTrabajoV1) return t || TIPOS_TRABAJO.produccion.titulo;
  var esDefecto = !t || Object.keys(TIPOS_TRABAJO).some(function (k) { return TIPOS_TRABAJO[k].titulo === t; });
  return esDefecto ? TIPOS_TRABAJO[tipoTrabajo(st, cfg)].titulo : t;
}

function listaServiciosTexto(st, cfg) {
  var vistos = {}, nombres = [];
  (st.tracks || []).forEach(function (t) {
    var n = nombreServicio(cfg, t);
    if (!vistos[n]) { vistos[n] = true; nombres.push(n); }
  });
  if (!nombres.length) return "indicados en el Anexo B";
  return nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : nombres[0];
}

/* Créditos técnicos según los servicios: grabación, mezcla y master. */
function rolesTecnicos(st, cfg) {
  var r = { rec: false, mix: false, mas: false };
  (st.tracks || []).forEach(function (t) {
    var id = servicioPorId(cfg, t.servicio).id;
    if (id === "grabacion" || id === "paquete") r.rec = true;
    if (["edicion", "mezcla", "mixmaster", "paquete", "mezclacancion"].indexOf(id) >= 0) r.mix = true;
    if (["master", "mixmaster", "paquete", "mezclacancion"].indexOf(id) >= 0) r.mas = true;
  });
  var roles = [];
  if (r.rec) roles.push("Recording");
  if (r.mix) roles.push("Mixing");
  if (r.mas) roles.push("Mastering");
  return roles.length ? roles : ["Mixing", "Mastering"];
}

var PORCENTAJES_OBRA = "- **Porcentajes solo para esta obra:** los porcentajes de composición del Anexo A se aplican exclusivamente a la obra u obras de este proyecto y no sirven de antecedente obligatorio. Para futuras canciones, las partes acordarán los porcentajes por separado, analizando los aportes de cada una antes de definirlos.";
var CREDITOS_PRODUCCION = "Se procurará acreditar: **Producer: {{alias}}** y, cuando corresponda, **Mixing/Mastering: {{alias}}**. Los créditos de composición se establecerán según el Anexo A.";

function textoCreditos(st, cfg) {
  var alias = cfg.productor.alias;
  if (!esServicio(st, cfg)) return CREDITOS_PRODUCCION.replace(/\{\{alias\}\}/g, alias);
  return "Se procurará acreditar a EL PRODUCTOR según el servicio prestado: **" + rolesTecnicos(st, cfg).join(" / ") + ": " + alias + "**. EL PRODUCTOR no figura como autor de la composición.";
}

function textoMasterServicio(st) {
  if (st.regalias !== "puntos") return "EL PRODUCTOR **no percibe regalías ni porcentajes** sobre el Master; su única contraprestación es el precio indicado en el Anexo B.";
  var pct = Number(st.puntosPct) > 0 ? String(st.puntosPct).replace(".", ",") + " %" : "____ %";
  var periodo = PERIODOS_REGALIAS[st.puntosPeriodo] || "semestral";
  return "por acuerdo entre las partes, EL PRODUCTOR percibirá el **" + pct + "** de los ingresos netos que el titular reciba por la explotación del Master (streaming, descargas, ventas, licencias y sincronizaciones), descontadas únicamente las comisiones del distribuidor digital. " +
    "El pago podrá realizarse mediante los splits de " + textoDistribuidora(st) + " o, en su defecto, EL CLIENTE liquidará dicho porcentaje en forma " + periodo + ", dentro de los treinta (30) días siguientes al cierre de cada período. " +
    "Este porcentaje es solo sobre el Master y **no otorga derechos de composición** a EL PRODUCTOR.";
}

function montoStems(st, t) {
  return st.entregaV2 && t.stems && t.servicio !== "stems" ? (Number(t.cantidad) || 0) * (Number(t.stemsPrecio) || 0) : 0;
}

var TEXTO_FREE = "Sin costo";
var TEXTO_COTIZAR = "A cotizar";

function modoPrecio(t) {
  if (t.precioModo === "cotizar" || t.precioModo === "gratis" || t.precioModo === "pagado" || t.precioModo === "precio") return t.precioModo;
  return t.gratis ? "gratis" : "precio";
}
function esCotizar(t) { return modoPrecio(t) === "cotizar"; }
function esGratis(t) { return modoPrecio(t) === "gratis"; }
function esPagado(t) { return modoPrecio(t) === "pagado"; }
function hayCotizar(st) { return (st.tracks || []).some(esCotizar); }
function hayPagado(st) { return (st.tracks || []).some(esPagado); }

function totalTexto(st, calc) {
  calc = calc || calcular(st);
  var cot = hayCotizar(st);
  var hayMonto = (st.tracks || []).some(function (t) { return !esCotizar(t) && !esGratis(t); });
  if (!hayMonto && cot) return TEXTO_COTIZAR;
  if (calc.total === 0 && (st.tracks || []).some(esGratis) && !cot) return TEXTO_FREE;
  var t = formatoMoneda(calc.total, st.moneda);
  return cot ? t + " + a cotizar" : t;
}

function subtotalTrack(t) {
  if (esGratis(t) || esCotizar(t)) return 0;
  return (Number(t.cantidad) || 0) * (Number(t.precio) || 0);
}

function precioUnitarioTexto(t, mon) {
  if (esCotizar(t)) return TEXTO_COTIZAR;
  if (esGratis(t)) return TEXTO_FREE;
  var p = formatoMoneda(t.precio, mon);
  return esPagado(t) ? p + " · pagado" : p;
}
function subtotalTexto(t, mon) {
  if (esCotizar(t)) return TEXTO_COTIZAR;
  if (esGratis(t)) return TEXTO_FREE;
  var p = formatoMoneda(subtotalTrack(t), mon);
  return esPagado(t) ? p + " · pagado" : p;
}

function notasPrecioAnexoB(st) {
  var n = [];
  if (hayCotizar(st)) n.push("Los servicios marcados «A cotizar» no integran el precio total de este acuerdo. Las partes acordarán su precio por escrito antes de ejecutarlos.");
  if (hayPagado(st)) n.push("Los servicios marcados «pagado» fueron abonados antes o al firmar este documento; las partes lo dejan constancia.");
  return n;
}

function calcular(st) {
  var subtotal = 0, stems = 0;
  (st.tracks || []).forEach(function (t) {
    subtotal += subtotalTrack(t);
    stems += montoStems(st, t);
  });
  subtotal += stems;
  var usarPaquete = st.modalidad === "cantidad" && Number(st.precioPaquete) > 0;
  var descuento = usarPaquete ? Math.max(0, subtotal - Number(st.precioPaquete)) : subtotal * (Number(st.descuento) || 0) / 100;
  var total = usarPaquete ? Number(st.precioPaquete) : subtotal - descuento;
  var anticipo = total * (Number(st.anticipoPct) || 0) / 100;
  var comp = (st.artistas || []).reduce(function (s, a) { return s + (Number(a.comp) || 0); }, 0) + (Number(st.productorComp) || 0);
  return { subtotal: subtotal, stems: stems, descuento: descuento, total: total, anticipo: anticipo, saldo: total - anticipo, usarPaquete: usarPaquete, composicion: comp };
}

function entregaDefecto(cfg, servicioId) {
  var s = servicioPorId(cfg, servicioId);
  if (s.entrega) return s.entrega;
  var base = DEFAULT_CONFIG.servicios.filter(function (x) { return x.id === s.id; })[0];
  return (base && base.entrega) || "otro";
}

function textoIncluye(v) { return v != null && String(v).trim() !== "" ? v : ""; }

function campoCatalogo(cfg, t, campo) {
  var fijo = t[campo + "Fijo"];
  if (fijo != null) return fijo;
  if (textoIncluye(t[campo])) return t[campo];
  var s = servicioPorId(cfg, t.servicio);
  if (textoIncluye(s[campo])) return s[campo];
  var base = DEFAULT_CONFIG.servicios.filter(function (x) { return x.id === s.id; })[0];
  return (base && base[campo]) || "";
}

function incluyeServicio(cfg, t) { return campoCatalogo(cfg, t, "incluye"); }
function noIncluyeServicio(cfg, t) { return campoCatalogo(cfg, t, "noIncluye"); }

/* Parte un paquete escrito con ; o saltos de línea en ítems de cotización. */
function listaItems(texto) {
  if (!textoIncluye(texto)) return [];
  return String(texto).split(/\s*(?:;|\n|•)\s*/).map(function (x) {
    return x.replace(/^\s*(?:incluye|no incluye)\s*:\s*/i, "").replace(/\.\s*$/, "").trim();
  }).filter(Boolean);
}

function textoAlcance(cfg, t) {
  var inc = listaItems(incluyeServicio(cfg, t));
  var no = listaItems(noIncluyeServicio(cfg, t));
  var partes = [];
  if (inc.length) partes.push("Incluye: " + inc.join("; ") + ".");
  if (no.length) partes.push("No incluye: " + no.join("; ") + ".");
  return partes.join(" ") || "Según lo acordado";
}

function htmlAlcance(cfg, t) {
  function ul(items, cls) {
    if (!items.length) return "";
    return "<ul" + (cls ? ' class="' + cls + '"' : "") + ">" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
  }
  var inc = listaItems(incluyeServicio(cfg, t)), no = listaItems(noIncluyeServicio(cfg, t));
  var h = "";
  if (inc.length) h += "<b>Incluye</b>" + ul(inc);
  if (no.length) h += "<b>No incluye</b>" + ul(no, "no");
  return h || esc("Según lo acordado");
}

/* Qué datos del formulario pide cada servicio, como en clareny.com. */
function camposServicio(servicioId) {
  return {
    genero: ["combo", "remake", "custom", "upgrade"].indexOf(servicioId) >= 0,
    sesion: servicioId === "combo",
    enfoque: servicioId === "edicion",
  };
}

function especificacionesServicio(t) {
  var c = camposServicio(t.servicio);
  var partes = [];
  if (c.sesion && t.sesion) partes.push("Sesión: " + (SESIONES[t.sesion] || t.sesion));
  if (c.genero && t.genero) partes.push("Género: " + t.genero);
  if (c.genero && t.nota) partes.push("Tonalidad: " + t.nota + " " + (t.modo === "mayor" ? "mayor" : "menor"));
  if (c.enfoque) {
    var enf = Object.keys(ENFOQUES_EDICION).filter(function (k) { return t.enfoque && t.enfoque[k]; }).map(function (k) { return ENFOQUES_EDICION[k]; });
    if (enf.length) partes.push("Enfoque: " + enf.join(", "));
  }
  if (t.referencias) partes.push("Referencias / mood: " + t.referencias);
  return partes.join(" · ");
}

/* Textos de la tabla "Formato de entrega" para una fila del Anexo B. */
function detalleEntrega(st, cfg, t) {
  var clave = t.entregable || entregaDefecto(cfg, t.servicio);
  var contenido = ENTREGABLES[clave] || ENTREGABLES.otro;
  if (t.entregaNota) contenido += " — " + t.entregaNota;
  var formato = (FORMATOS_AUDIO[t.formato] || FORMATOS_AUDIO.wav16) + (t.mp3 === false ? "" : " + MP3 320 kbps");
  var stems;
  if (t.servicio === "stems") stems = "Es el servicio contratado";
  else if (!t.stems) stems = "No incluidos (adicional a pedido)";
  else if (montoStems(st, t) > 0) stems = "Sí · adicional " + formatoMoneda(montoStems(st, t), st.moneda);
  else stems = "Sí · incluidos en el precio";
  return { contenido: contenido, formato: formato, stems: stems };
}

/* Filas del cuadro de registro BMI (sistema 200 %): cada autor tiene su parte de autor y la misma parte editorial. */
function registroBMI(st, cfg) {
  var p = cfg.productor;
  var filas = (st.artistas || []).filter(function (a) { return Number(a.comp) > 0; }).map(function (a) {
    return { autor: a.nombre || a.artistico, ipi: a.ipi, sociedad: a.sociedad, pct: Number(a.comp), editorial: a.editorial };
  });
  if (Number(st.productorComp) > 0) filas.push({ autor: p.nombre + " (" + p.alias + ")", ipi: p.ipi, sociedad: p.pro, pct: Number(st.productorComp), editorial: editorialProductor(st, cfg) });
  return filas;
}

function titularMaster(st) {
  var c = st.cliente || {};
  if (st.tipoCliente === "colab") return (!st.partesV3 && c.artistico) || listaArtistasCredito(st);
  if (st.tipoCliente === "duo") return c.artistico || nombreCliente(st);
  return nombreCliente(st);
}

function repartoMaster(st, cfg) {
  if (!st.bmi200) return "";
  var titular = titularMaster(st) || "Titular del Master";
  if (st.regalias !== "puntos" && st.masterV2) return titular + ": 100 % del Master";
  if (st.regalias !== "puntos") return titular + ": 100 % · " + cfg.productor.alias + ": 0 % (sin puntos de productor)";
  var pts = Number(st.puntosPct) || 0;
  var queEs = esServicio(st, cfg) ? "porcentaje pactado" : "puntos de productor";
  return titular + ": " + String(Math.round((100 - pts) * 100) / 100).replace(".", ",") + " % · " + cfg.productor.alias + ": " + String(pts).replace(".", ",") + " % (" + queEs + ", liquidación " + (PERIODOS_REGALIAS[st.puntosPeriodo] || "semestral") + ")";
}

function introAnexoA(st, cfg) {
  if (cfg && esServicio(st, cfg)) return "Identificación de las personas que participan en el proyecto. Al tratarse de un servicio técnico de audio, EL PRODUCTOR no participa de la composición, que corresponde íntegramente a sus autores. El reparto del Master figura en la tabla de abajo.";
  var base = "Identificación de las personas que participan en el proyecto y reparto de la composición (autoría).";
  base += st.resumenDerechos ? " El reparto del Master figura en el resumen de derechos, debajo de esta tabla." : " El Master se rige por el Anexo B.";
  if (muestraDerechosPorPista(st, cfg)) {
    base += " Los porcentajes de este anexo son el criterio general. Si una canción del Anexo B (tabla “Derechos por canción”) indica otro porcentaje de Master o de composición, rige el del Anexo B solo para esa canción.";
  }
  return base;
}

/* Resumen del Anexo A: Master y composición lado a lado, para contratos con resumenDerechos. */
function resumenDerechos(st, cfg) {
  var alias = cfg.productor.alias, titular = titularMaster(st) || "Titular del Master";
  var master;
  if (st.regalias === "puntos") {
    var pts = Number(st.puntosPct) || 0;
    master = titular + ": " + numPct(100 - pts).replace("%", " %") + " · " + alias + ": " + numPct(pts).replace("%", " %") + " (puntos de productor)";
  } else {
    master = titular + ": 100 % · " + alias + ": 0 % (no cobra regalías del Master)";
  }
  if (esServicio(st, cfg)) return [
    ["Master / fonograma (streaming, ventas, distribución)", master.replace("(puntos de productor)", "(porcentaje pactado)")],
    ["Composición (derechos de autor)", "100 % de sus autores. " + alias + " no participa: presta un servicio técnico de audio."],
  ];
  var artistas = (st.artistas || []).reduce(function (s, a) { return s + (Number(a.comp) || 0); }, 0);
  var comp = "Artistas: " + numPct(artistas).replace("%", " %") + " · " + alias + ": " + numPct(Number(st.productorComp) || 0).replace("%", " %");
  if (Math.abs(artistas - 50) < 0.001 && Math.abs((Number(st.productorComp) || 0) - 50) < 0.001) comp = "Artistas (letra y melodías vocales): 50 % · " + alias + " (música / beat): 50 %";
  var filas = [
    ["Master / fonograma (streaming, ventas, distribución)", master],
    ["Composición (derechos de autor · BMI)", comp + (st.repartoMasterV1 ? ". Es el reparto de la tabla 1." : ". Es el reparto de la tabla de arriba.")],
  ];
  if (muestraDerechosPorPista(st, cfg)) {
    filas.push(["Por canción", "El Anexo B detalla Master y composición de cada remake o canción. Esa tabla manda para esa canción. El Master y la composición son independientes."]);
  }
  return filas;
}

/* Filas del reparto del Master (artistas en conjunto + productor), para contratos con repartoMasterV1. */
function filasMaster(st, cfg) {
  var pts = st.regalias === "puntos" ? Math.min(100, Math.max(0, Number(st.puntosPct) || 0)) : 0;
  var r = function (n) { return Math.round(n * 100) / 100; };
  var rol = esServicio(st, cfg) ? "Servicio técnico" : "Productor";
  var parte = esServicio(st, cfg) ? "porcentaje pactado de los ingresos netos del Master" : "puntos sobre los ingresos netos del Master";
  return [
    { titular: titularMaster(st) || "Los artistas", calidad: "Titular(es) del fonograma y artista(s) principal(es)", pct: r(100 - pts) },
    { titular: cfg.productor.alias, calidad: pts > 0 ? rol + " · " + parte : rol + " · no participa del Master", pct: r(pts) },
  ];
}

var SIN_EDITORIAL = "Sin editorial designada (el propio autor)";

function textoTarifaStems(st, calc) {
  if (calc.stems > 0) return formatoMoneda(calc.stems, st.moneda) + " (detalle en Anexo B · Formato de entrega)";
  return st.stemsTarifa || "Servicio adicional a pedido";
}

function nombreCliente(st) {
  var c = st.cliente || {};
  return c.razon || c.artistico || (st.artistas && st.artistas[0] && st.artistas[0].nombre) || "";
}

function nombreTitularCorto(st) {
  if (st.tipoCliente === "colab" || st.tipoCliente === "duo") {
    var n = (st.artistas || []).filter(function (a) { return a.artistico || a.nombre; });
    if (n.length > 1) return "los artistas";
    if (n.length === 1) return n[0].artistico || n[0].nombre;
  }
  var a = (st.artistas || [])[0];
  return (a && (a.artistico || a.nombre)) || nombreCliente(st) || "EL CLIENTE";
}

function nombrePistaCorta(st, cfg, t) {
  return String((t && t.titulo) || "").trim() || nombreServicio(cfg, t);
}

function filasDerechosPista(st, cfg) {
  return (st.tracks || []).map(function (t, i) {
    var nom = nombrePistaCorta(st, cfg, t);
    var serv = nombreServicio(cfg, t);
    if (!pistaCreaObra(cfg, t)) return { n: i + 1, nombre: nom, servicio: serv, aplica: false };
    var m = pctMasterProductorPista(st, t);
    var c = pctCompProductorPista(st, t);
    return {
      n: i + 1, nombre: nom, servicio: serv, aplica: true,
      masterProd: m, masterArt: restoPct(m),
      compProd: c, compArt: restoPct(c)
    };
  });
}

function htmlTablaDerechosPista(st, cfg) {
  var alias = cfg.productor.alias || "EL PRODUCTOR";
  var art = nombreTitularCorto(st);
  var h = '<h4 class="sub-anexo">Derechos por canción (Master y composición son independientes)</h4>';
  h += '<p class="anexo-intro">Cada remake o canción puede tener un porcentaje distinto. Si esta tabla indica un % diferente al del Anexo A o a las cláusulas generales, rige esta tabla <strong>solo para esa canción</strong>. El Master y la composición no se mezclan: podés tener 0 % del Master y sí un % de la composición, o al revés.</p>';
  h += '<table class="tbl"><thead><tr><th>#</th><th>' + etiquetaColPista(st) + "</th><th>Servicio</th><th class=\"num\">Master " + esc(alias) + "</th><th class=\"num\">Master " + esc(art) + "</th><th class=\"num\">Comp. " + esc(alias) + "</th><th class=\"num\">Comp. " + esc(art) + "</th></tr></thead><tbody>";
  filasDerechosPista(st, cfg).forEach(function (f) {
    if (!f.aplica) {
      h += "<tr><td>" + f.n + "</td><td>" + esc(f.nombre) + "</td><td>" + esc(f.servicio) + '</td><td colspan="4">No aplica (servicio técnico)</td></tr>';
      return;
    }
    h += "<tr><td>" + f.n + "</td><td>" + esc(f.nombre) + "</td><td>" + esc(f.servicio) + '</td><td class="num">' + pctEsp(f.masterProd) + '</td><td class="num">' + pctEsp(f.masterArt) + '</td><td class="num">' + pctEsp(f.compProd) + '</td><td class="num">' + pctEsp(f.compArt) + "</td></tr>";
  });
  return h + "</tbody></table>";
}

function textoResumenPorPista(st, cfg) {
  var alias = cfg.productor.alias || "EL PRODUCTOR";
  var art = nombreTitularCorto(st);
  return pistasConObra(st, cfg).map(function (t) {
    var m = pctMasterProductorPista(st, t);
    var c = pctCompProductorPista(st, t);
    return nombrePistaCorta(st, cfg, t) + ": Master " + alias + " " + pctEsp(m) + " / " + art + " " + pctEsp(restoPct(m)) + "; Comp. " + alias + " " + pctEsp(c) + " / " + art + " " + pctEsp(restoPct(c)) + ".";
  }).join(" ");
}

function textoRepartoPorPista(st, cfg) {
  if (!st.derechosPistaV1 || esServicio(st, cfg)) return "";
  var pistas = pistasConObra(st, cfg);
  if (!pistas.length) return "";
  if (!hayOverrideDerechosPista(st, cfg) && pistas.length < 2) return "";
  var alias = cfg.productor.alias || "EL PRODUCTOR";
  var lineas = ["**Porcentaje por canción:** el Master y la composición se pactan **por pista** en el Anexo B (tabla “Derechos por canción”). Si una canción indica un porcentaje distinto al de las cláusulas generales o al Anexo A, rige el del Anexo B **solo para esa canción**. El Master y la composición son independientes: EL PRODUCTOR puede percibir puntos del Master en un tema y, en otro, **0 % del Master** y sí un porcentaje de la composición (beat)."];
  pistas.forEach(function (t) {
    var m = pctMasterProductorPista(st, t);
    var c = pctCompProductorPista(st, t);
    lineas.push("- **" + nombrePistaCorta(st, cfg, t) + ":** Master de " + alias + " " + pctEsp(m) + (m > 0 ? " (puntos de productor)" : " (sin puntos)") + "; composición de " + alias + " " + pctEsp(c) + (c > 0 ? " (beat)" : " (sin autoría)") + ".");
  });
  return lineas.join("\n");
}

/* Los contratos firmados antes de renombrar los tipos de cliente conservan el nombre anterior. */
var TIPOS_CLIENTE_ANTERIORES = { individual: "Artista individual", duo: "Dúo / Colectivo / Varios artistas" };

function nombreTipoCliente(st) {
  if (!st.tiposV2 && TIPOS_CLIENTE_ANTERIORES[st.tipoCliente]) return TIPOS_CLIENTE_ANTERIORES[st.tipoCliente];
  return TIPOS_CLIENTE[st.tipoCliente] || "";
}

function listaArtistasCredito(st) {
  var nombres = (st.artistas || []).map(function (a) { return a.artistico || a.nombre; }).filter(Boolean);
  return nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " x " + nombres[nombres.length - 1] : nombres.join("");
}

/* Filas del recuadro "EL CLIENTE" en PARTES con los datos personales de cada artista. */
function filasParteClienteGrupal(st) {
  var c = st.cliente || {}, filas = [];
  if (st.tipoCliente === "duo") filas.push(["Nombre de la agrupación", c.artistico || c.razon]);
  else if (c.artistico && !st.partesV3) filas.push(["Crédito", c.artistico]);
  filasArtistasParte(st, "Artista ", false, filas);
  if (st.partesV3) return filas;
  if (c.representante) filas.push(["Representante", c.representante]);
  if (c.email) filas.push(["Email de contacto", c.email]);
  return filas;
}

function filasArtistasParte(st, prefijo, soloCargados, filas) {
  (st.artistas || []).forEach(function (a, i) {
    if (soloCargados && !a.nombre && !a.artistico) return;
    filas.push([(st.tipoCliente === "duo" ? "Integrante " : prefijo) + (i + 1), a.nombre ? a.nombre + (a.artistico ? " (" + a.artistico + ")" : "") : a.artistico]);
    if (a.documento) filas.push(["Cédula / DNI", a.documento]);
    filas.push(["Email", a.email]);
  });
  return filas;
}

/* Un artista y sello, en contratos con partesV3. */
function filasParteClienteV3(st) {
  var c = st.cliente || {}, filas = [];
  if (st.tipoCliente === "sello") {
    filas.push(["Razón social", c.razon], ["Nombre comercial", c.artistico]);
    if (c.documento) filas.push(["RUT / Registro", c.documento]);
    filas.push(["Representante", c.representante]);
    if (c.cargo) filas.push(["Cargo", c.cargo]);
    if (c.repDocumento) filas.push(["Cédula / DNI del representante", c.repDocumento]);
    filasArtistasParte(st, "Artista ", true, filas);
    filas.push(["Email del sello", c.email]);
  } else {
    filas.push(["Nombre legal", c.razon], ["Nombre artístico", c.artistico]);
    if (c.documento) filas.push(["Cédula / DNI", c.documento]);
    filas.push(["Email", c.email]);
  }
  return filas;
}

function filasParteCliente(st) {
  if (st.partesV2 && (st.tipoCliente === "colab" || st.tipoCliente === "duo")) return filasParteClienteGrupal(st);
  if (st.partesV3) return filasParteClienteV3(st);
  return null;
}

function tituloParteCliente(st) {
  if (st.tipoCliente === "sello") return "SELLO / EMPRESA";
  if (st.tipoCliente === "colab") return st.partesV2 ? "ARTISTA(S) / CLIENTE" : "ARTISTAS EN COLABORACIÓN";
  if (st.tipoCliente === "duo") return st.tiposV2 ? "AGRUPACIÓN" : "DÚO / COLECTIVO";
  return "ARTISTA";
}

function rolFirmanteArtista(st, a, i) {
  var quien = a.artistico || a.nombre || ("Artista " + (i + 1));
  if (st.tipoCliente === "duo") return "INTEGRANTE · " + quien;
  return "ARTISTA · " + quien;
}

function artistaFirmaEnDocumento(st, a) {
  if (Object.keys(st.firmas || {}).length) return !!a.firma;
  return !!(a.nombre || a.artistico);
}

function firmantes(st, cfg) {
  var lista = [{ key: "productor", rol: "EL PRODUCTOR", nombre: cfg.productor.nombre, alias: cfg.productor.alias,
    documento: cfg.productor.documento, email: cfg.productor.email, cargo: cfg.productor.mostrarEmpresa ? cfg.productor.empresa : "" }];
  var c = st.cliente || {};
  if (st.tipoCliente === "individual") {
    lista.push({ key: "cliente", rol: "EL CLIENTE / ARTISTA", nombre: c.razon, alias: c.artistico, documento: c.documento, email: c.email });
  } else if (st.tipoCliente === "sello") {
    lista.push({ key: "cliente", rol: "EL CLIENTE / SELLO", nombre: c.representante, alias: c.razon, documento: c.repDocumento, email: c.email, cargo: c.cargo });
  }
  if (st.tipoCliente !== "individual") {
    (st.artistas || []).forEach(function (a, i) {
      if (artistaFirmaEnDocumento(st, a)) lista.push({ key: "artista-" + i, rol: rolFirmanteArtista(st, a, i), nombre: a.nombre, alias: a.artistico, documento: a.documento, email: a.email, cargo: a.rol });
    });
  }
  if (st.nombresV1) lista.forEach(function (f) { if (f.nombre) f.nombre = nombrePropio(f.nombre); });
  if (st.artisticosV1) lista.forEach(function (f) { if (f.alias && !(st.tipoCliente === "sello" && f.key === "cliente")) f.alias = nombreArtistico(f.alias); });
  return lista;
}

function hayServicio(st, cfg, pred) {
  return (st.tracks || []).some(function (t) { return pred(servicioPorId(cfg, t.servicio), t); });
}

function condicionCumple(cond, st, cfg) {
  switch (cond) {
    case "multiArtista": return st.tipoCliente === "duo" || st.tipoCliente === "colab" || (st.artistas || []).length > 1;
    case "sello": return st.tipoCliente === "sello";
    case "remake": return hayServicio(st, cfg, function (s) { return s.id === "remake"; });
    case "audio": return hayServicio(st, cfg, function (s) { return s.grupo === "audio"; });
    case "marco": return st.modalidad === "marco";
    case "produccion": return !esServicio(st, cfg);
    case "servicio": return esServicio(st, cfg);
    default: return true;
  }
}

function clausulasActivas(st, cfg) {
  return (st.clausulas || []).filter(function (c) {
    if (c.incluir === "si") return true;
    if (c.incluir === "no") return false;
    return condicionCumple(c.cond, st, cfg);
  });
}

function listaRevisiones(st, cfg) {
  var vistos = {};
  var lineas = [];
  (st.tracks || []).forEach(function (t) {
    var s = servicioPorId(cfg, t.servicio);
    var clave = s.id + "|" + t.revisiones;
    if (vistos[clave] || s.id === "stems") return;
    vistos[clave] = true;
    var n = Number(t.revisiones);
    var nombre = nombreServicio(cfg, t);
    var desc = t.revDescFijo != null ? t.revDescFijo : (textoIncluye(s.revDesc) || (DEFAULT_CONFIG.servicios.filter(function (x) { return x.id === s.id; })[0] || {}).revDesc);
    if (!n) lineas.push("- **" + nombre + ":** " + (desc || "sin rondas de revisión incluidas") + ".");
    else lineas.push("- **" + nombre + ":** hasta " + cantidadConLetras(n, "ronda", "rondas") + " de revisiones " + (desc || "") + ".");
  });
  if (!lineas.length) lineas.push("- Según lo indicado para cada pista en el Anexo B.");
  return lineas.join("\n");
}

function identificacionProductor(cfg) {
  var p = cfg.productor;
  var t = "**" + (p.nombre || "").toUpperCase() + "**";
  if (p.documento) t += ", documento de identidad " + p.documento;
  t += ", conocido artísticamente como **" + (p.alias || "") + "**, productor musical";
  if (p.ipi) t += ", IPI **" + p.ipi + "**";
  if (p.pro) t += ", afiliado a " + p.pro;
  if (p.mostrarEmpresa && p.empresa) t += ", actuando también bajo la marca **" + p.empresa + "**" + (p.empresaNota ? " " + p.empresaNota : "");
  if (p.ciudad) t += ", con domicilio en " + p.ciudad;
  if (p.email) t += ", correo electrónico " + p.email;
  return t;
}

var PERIODOS_REGALIAS = { trimestral: "trimestral", semestral: "semestral", anual: "anual" };

/* Texto con el que se firmaron los contratos anteriores al cuadro BMI; no debe cambiar. */
function textoRegaliasMasterAnterior(st) {
  if (st.regalias !== "puntos") {
    return "EL PRODUCTOR **no percibirá regalías, puntos ni porcentajes** sobre los ingresos del Master/Fonograma. La contraprestación por la producción es el precio indicado en el Anexo B. Esta renuncia se refiere únicamente al Master y no afecta la participación autoral de EL PRODUCTOR en la composición.";
  }
  var pct = Number(st.puntosPct) > 0 ? String(st.puntosPct).replace(".", ",") + " %" : "____ %";
  var periodo = PERIODOS_REGALIAS[st.puntosPeriodo] || "semestral";
  return "Además del precio indicado en el Anexo B, EL PRODUCTOR percibirá el **" + pct + " (puntos de productor)** de los ingresos netos que el titular del Master reciba por su explotación: streaming, descargas, ventas, licencias y sincronizaciones del Master. Se consideran ingresos netos los efectivamente percibidos, descontadas únicamente las comisiones del distribuidor digital. " +
    "El pago podrá realizarse mediante la función de reparto automático (splits) del distribuidor o, en su defecto, EL CLIENTE entregará un reporte de ingresos y liquidará dicho porcentaje en forma " + periodo + ", dentro de los treinta (30) días siguientes al cierre de cada período.";
}

/* Cómo se nombra en las cláusulas a quien recibe el Master, y si el verbo va en plural. */
function sujetoMaster(st) {
  if (st.tipoCliente === "colab") return { texto: "los Artistas Colaboradores", plural: true };
  if (st.tipoCliente === "duo") return { texto: "los integrantes de la agrupación", plural: true };
  return { texto: "EL CLIENTE", plural: false };
}

function textoDistribuidora(st) {
  var usa = st.distribuidora && (st.regalias === "puntos" || !st.masterV2);
  return usa ? "la distribuidora **" + st.distribuidora + "** o la plataforma que corresponda" : "la distribuidora o plataforma que elija" + (sujetoMaster(st).plural ? "n" : "");
}

function textoGestionMaster(st) {
  if (!st.masterV2) return "";
  var s = sujetoMaster(st);
  return " La administración del Master (distribución, lanzamiento, códigos ISRC, promoción y sus costos) corre por cuenta exclusiva de " + s.texto + ", como titular" + (s.plural ? "es" : "") + " del fonograma.";
}

function textoColabTerceros(st) {
  if (!st.masterV2 || !st.colabTerceros) return "";
  var s = sujetoMaster(st);
  var quien = s.plural ? "cualquiera de " + s.texto : "EL CLIENTE";
  return "\n\n**Colaboraciones con terceros:** si " + quien + " incorpora a otro artista a la obra (feat., remix o nueva versión), podrá hacerlo sin autorización adicional de EL PRODUCTOR en lo que respecta al Master, ya que su explotación le corresponde. " +
    "El artista invitado recibirá su participación de la parte correspondiente a la letra y melodías vocales y, en su caso, de la parte del Master que le ceda su titular; **el porcentaje de EL PRODUCTOR en la composición (Anexo A) no se reduce**" +
    (st.regalias === "puntos" ? " y sus puntos de productor sobre el Master se mantienen" : "") +
    ". Deberán mantenerse los créditos de EL PRODUCTOR y comunicársele la nueva colaboración para actualizar el registro de la obra en BMI y en las demás sociedades de gestión.";
}

function textoRegaliasMaster(st) {
  if (!st.bmi200) return textoRegaliasMasterAnterior(st);
  if (st.regalias !== "puntos") {
    var s = sujetoMaster(st);
    return "EL PRODUCTOR cede el **100% de los derechos de explotación comercial del fonograma (Master)** a " + s.texto + ", quien" + (s.plural ? "es percibirán" : " percibirá") +
      " la totalidad de los ingresos generados por distribución digital, streaming y ventas del audio a través de " + textoDistribuidora(st) + "." + textoGestionMaster(st) + " " +
      "EL PRODUCTOR **renuncia a cualquier porcentaje de ingreso directo sobre el Master**; su contraprestación es el precio indicado en el Anexo B. Esta renuncia se refiere únicamente al Master y no afecta la participación autoral ni editorial de EL PRODUCTOR en la composición." + textoColabTerceros(st);
  }
  var pct = Number(st.puntosPct) > 0 ? String(st.puntosPct).replace(".", ",") + " %" : "____ %";
  var periodo = PERIODOS_REGALIAS[st.puntosPeriodo] || "semestral";
  return "Además del precio indicado en el Anexo B, EL PRODUCTOR percibirá el **" + pct + " (puntos de productor)** de los ingresos netos que el titular del Master reciba por su explotación: streaming, descargas, ventas, licencias y sincronizaciones del Master. Se consideran ingresos netos los efectivamente percibidos, descontadas únicamente las comisiones del distribuidor digital. " +
    "El pago podrá realizarse mediante la función de reparto automático (splits) de " + textoDistribuidora(st) + " o, en su defecto, EL CLIENTE entregará un reporte de ingresos y liquidará dicho porcentaje en forma " + periodo + ", dentro de los treinta (30) días siguientes al cierre de cada período." + textoGestionMaster(st) + textoColabTerceros(st);
}

function editorialProductor(st, cfg) {
  return st.productorEditorial || cfg.productor.editorial || "";
}

function numPct(n) { return String(Math.round(n * 100) / 100).replace(".", ",") + "%"; }

function textoRepartoComposicion(st, cfg) {
  var p = cfg.productor;
  var prod = Number(st.productorComp) || 0;
  var artistas = (st.artistas || []).reduce(function (s, a) { return s + (Number(a.comp) || 0); }, 0);
  if (prod <= 0) return "la composición corresponde íntegramente a los autores indicados en el Anexo A, en los porcentajes allí consignados. EL PRODUCTOR no participa de la autoría.";
  var varios = (st.artistas || []).filter(function (a) { return Number(a.comp) > 0; }).length > 1;
  var estandar = Math.abs(prod - 50) < 0.001 && Math.abs(artistas - 50) < 0.001;
  return "la propiedad intelectual sobre la obra musical (composición, melodía y beat) se divide" + (estandar ? " según el estándar de la industria (**50% Música / 50% Letra**)" : "") + " de la siguiente forma:\n" +
    "- **EL PRODUCTOR (" + p.nombre + ", " + p.alias + "):** " + numPct(prod) + " de los derechos de autoría y edición, por la creación de la música instrumental (beat).\n" +
    "- **" + (varios ? "Los artistas" : "EL ARTISTA") + ":** " + numPct(artistas) + " de los derechos de composición, por la autoría de la letra y las melodías vocales" +
    (varios ? ", repartido entre ellos según el Anexo A. La distribución interna entre los artistas es la que ellos declaran y cualquier cambio entre ellos no afecta la parte de EL PRODUCTOR." : ".");
}

function textoRecaudacionProductor(st, cfg) {
  var p = cfg.productor;
  if (!(Number(st.productorComp) > 0)) return "";
  var ed = editorialProductor(st, cfg);
  return "EL PRODUCTOR recaudará y percibirá su parte en forma directa a través de su sociedad de gestión " + (p.pro || "") + (p.ipi ? " (IPI " + p.ipi + ")" : "") +
    (ed ? " y de su administradora editorial **" + ed + "**" : "") + ", sin intermediación de EL CLIENTE.";
}

/* Estado de los pagos marcados en "Plazos y pagos" (contratos con claridadV1). */
function estadoPagos(st, calc) {
  calc = calc || calcular(st);
  var ant = calc.anticipo > 0, sal = calc.saldo > 0;
  var antOk = ant && !!st.anticipoPagado, salOk = sal && !!st.saldoPagado;
  var pendiente = (ant && !antOk ? calc.anticipo : 0) + (sal && !salOk ? calc.saldo : 0);
  return { anticipo: ant, saldo: sal, anticipoOk: antOk, saldoOk: salOk, pendiente: pendiente,
    alguno: !!st.claridadV1 && (antOk || salOk), completo: !!st.claridadV1 && calc.total > 0 && pendiente < 0.005 && (antOk || salOk) };
}

function textoPagoHecho(fecha) { return fecha ? "abonado el " + formatoFecha(fecha) : "abonado"; }

/* Plazo para cobrar el 50 % restante: solo en contratos con saldoPlazoV1 y saldo todavía pendiente.
   Si ya está pagado o el contrato está firmado sin esa marca, no se agrega texto (no cambia el hash). */
function aplicaPlazoSaldo(st, calc) {
  if (!st || !st.saldoPlazoV1) return false;
  calc = calc || calcular(st);
  return calc.saldo > 0.005 && !st.saldoPagado;
}

function frasePlazoSaldo(st) {
  var n = Number(st.saldoPlazoNum);
  if (!(n > 0)) n = 5;
  var u = UNIDADES_PLAZO[st.saldoPlazoUnidad] || UNIDADES_PLAZO.habiles;
  return cantidadConLetras(n, u[0], u[1]);
}

function textoPlazoSaldo(st) {
  if (!aplicaPlazoSaldo(st)) return "";
  var calc = calcular(st);
  return "**Plazo del saldo:** EL CLIENTE abonará el saldo de **" + formatoMoneda(calc.saldo, st.moneda) +
    "** contra entrega, dentro de **" + frasePlazoSaldo(st) +
    "** contados desde que EL PRODUCTOR comunique por escrito (incluido WhatsApp) que los archivos finales están listos. Hasta que el pago total se acredite, EL PRODUCTOR no entregará archivos finales (WAV, stems ni Master) ni transferirá derechos. El pago inicial no es reembolsable si el trabajo ya fue realizado. Vencido el plazo de custodia sin el pago del saldo, EL PRODUCTOR no estará obligado a conservar las sesiones.";
}

function textoEstadoPago(st) {
  var calc = calcular(st), e = estadoPagos(st, calc), mon = st.moneda;
  if (!e.alguno) return "";
  var partes = [];
  if (e.anticipo) partes.push("el pago inicial de " + formatoMoneda(calc.anticipo, mon) + (e.anticipoOk ? " fue " + textoPagoHecho(st.anticipoFechaPago) : " está pendiente"));
  if (e.saldo) partes.push("el saldo de " + formatoMoneda(calc.saldo, mon) + (e.saldoOk ? " fue " + textoPagoHecho(st.saldoFechaPago) : " está pendiente"));
  var t = "**Estado de los pagos:** las partes dejan constancia de que " + partes.join(" y ") + ". ";
  if (e.completo) return t + "El precio total está **pagado en su totalidad** y **no existe saldo pendiente** (saldo actual: " + formatoMoneda(0, mon) + "). EL PRODUCTOR declara haber recibido el pago completo.";
  return t + "Saldo pendiente a la fecha: **" + formatoMoneda(e.pendiente, mon) + "**.";
}

function textoConstanciaTrabajo(st) {
  if (!st.claridadV1 || !st.trabajoPrevio) return "";
  return "**Trabajo ya realizado:** las partes dejan constancia de que los servicios de este acuerdo ya fueron prestados y entregados antes de la firma, en las fechas reales indicadas en el Anexo B. Este documento formaliza por escrito lo acordado entre las partes desde el inicio del proyecto.";
}

function nombreParteMaster(st) {
  var s = sujetoMaster(st), credito = titularMaster(st);
  return s.texto + (s.plural && credito ? " (" + credito + ")" : "");
}

function textoRegistroMaster(st, cfg) {
  var s = sujetoMaster(st), pl = s.plural, quien = nombreParteMaster(st);
  var base = quien + (pl ? " son titulares" : " es titular") + " del Master y " + (pl ? "se encargan" : "se encarga") +
    " de su distribución digital (incluida la obtención del código ISRC) a través de la distribuidora que " + (pl ? "elijan" : "elija") +
    ", y de registrar la grabación en SoundExchange (EE. UU.) y en las demás entidades de derechos conexos que correspondan, como " + (pl ? "titulares" : "titular") + " del fonograma y " + (pl ? "artistas principales" : "artista principal") + ". ";
  if (st.regalias === "puntos") {
    return base + "EL PRODUCTOR no registrará el Master a su nombre; solo percibirá los puntos de productor indicados en la cláusula de regalías, que podrán liquidarse mediante los splits de la distribuidora o una carta de dirección (Letter of Direction) ante SoundExchange.";
  }
  return base + "EL PRODUCTOR **no reclamará ningún porcentaje** sobre los derechos del fonograma ni registrará el Master a su nombre.";
}

function repartoComposicionCorto(st, cfg) {
  var items = (st.artistas || []).filter(function (a) { return Number(a.comp) > 0; }).map(function (a) {
    return { nombre: a.artistico || a.nombre || "Artista", pct: Number(a.comp) };
  });
  var prod = Number(st.productorComp) || 0;
  if (prod > 0) items.unshift({ nombre: cfg.productor.alias || "EL PRODUCTOR", pct: prod, productor: true });
  return items;
}

function listaReparto(items) {
  return items.map(function (x) { return x.nombre + " " + numPct(x.pct).replace("%", " %"); }).join(" · ");
}

function textoRegistroComposicion(st, cfg) {
  var items = repartoComposicionCorto(st, cfg);
  var prod = items.filter(function (x) { return x.productor; })[0];
  var art = items.filter(function (x) { return !x.productor; }).map(function (x) { return "**" + x.nombre + " " + numPct(x.pct).replace("%", " %") + "**"; });
  var artTxt = art.length > 1 ? art.slice(0, -1).join(", ") + " y " + art[art.length - 1] : art.join("");
  var t = prod
    ? "los derechos de autor de la obra se dividen así: **" + prod.nombre + " " + numPct(prod.pct).replace("%", " %") + "** (música / beat)" + (art.length ? "; " + artTxt + " (letra y melodías vocales)" : "") + ", según el Anexo A."
    : "los derechos de autor de la obra corresponden a " + (artTxt || "los autores del Anexo A") + ", según el Anexo A. EL PRODUCTOR no participa de la autoría.";
  if (st.bmi200) t += " En las sociedades que separan la parte de autor (writer share) y la parte editorial (publisher share), cada parte registra el mismo porcentaje en ambas, como muestra el cuadro del Anexo A.";
  return t;
}

/* Recuadro "Resumen del acuerdo" al inicio del contrato (claridadV1). */
function resumenSimple(st, cfg) {
  var calc = calcular(st), mon = st.moneda, alias = cfg.productor.alias || "EL PRODUCTOR", p = cfg.productor;
  var titular = titularMaster(st) || "EL CLIENTE";
  var filas = [];
  var servicio = esServicio(st, cfg);
  var nomProy = st.formatoObraV1 ? (textoObra(st) || "—") : (st.proyecto || "—");
  if (servicio) filas.push(["Qué firmamos", "Acuerdo de servicios de audio (" + listaServiciosTexto(st, cfg) + ") para el proyecto «" + nomProy + "». Es un servicio técnico: " + alias + " no es autor de la canción. Vale solo para este proyecto y sin exclusividad."]);
  else filas.push(["Qué firmamos", "Acuerdo de producción musical del proyecto «" + nomProy + "». Vale solo para este proyecto: no hay exclusividad y ninguna de las partes queda obligada a trabajar con la otra en el futuro."]);
  if (st.formatoObraV1 && st.formatoObra) filas.push(["Obra", textoAlcanceObra(st)]);
  if (st.regalias === "puntos") {
    var pts = Number(st.puntosPct) || 0;
    filas.push(["Master (la grabación)", titular + " " + numPct(100 - pts).replace("%", " %") + " · " + alias + " " + numPct(pts).replace("%", " %") + " (puntos de productor)."]);
  } else {
    filas.push(["Master (la grabación)", "100 % de " + titular + ". " + alias + " 0 %: no recibe regalías del Master."]);
  }
  var comp = repartoComposicionCorto(st, cfg);
  var sinComp = !(Number(st.productorComp) > 0) ? " " + alias + " no recibe derechos de composición." : "";
  if (servicio) filas.push(["Composición (la canción)", "100 % de sus autores. " + alias + " no reclama derechos de autor ni editoriales: presta un servicio técnico."]);
  else filas.push(["Composición (la canción)", (comp.length ? listaReparto(comp) : "Según el Anexo A") + "." + sinComp + " Solo para esta obra; en próximas canciones el porcentaje se acuerda aparte."]);
  if (!servicio && muestraDerechosPorPista(st, cfg) && (hayOverrideDerechosPista(st, cfg) || pistasConObra(st, cfg).length > 1)) {
    filas.push(["Por canción", textoResumenPorPista(st, cfg) + " Master y composición son independientes."]);
  }
  var pago;
  if (hayCotizar(st) && calc.total === 0) pago = "A cotizar (el cliente firma el alcance; el precio de esos servicios se acuerda por escrito antes de ejecutarlos).";
  else if (calc.total === 0) pago = TEXTO_FREE + ".";
  else {
    var e = estadoPagos(st, calc);
    pago = "Total " + formatoMoneda(calc.total, mon) + (hayCotizar(st) ? " + ítems a cotizar" : "") + ".";
    if (e.anticipo) pago += " Pago inicial " + formatoMoneda(calc.anticipo, mon) + (e.anticipoOk ? ": pagado" + (st.anticipoFechaPago ? " el " + formatoFecha(st.anticipoFechaPago) : "") : ": pendiente") + ".";
    if (e.saldo) pago += " Saldo " + formatoMoneda(calc.saldo, mon) + (e.saldoOk ? ": pagado" + (st.saldoFechaPago ? " el " + formatoFecha(st.saldoFechaPago) : "") : ": pendiente") + ".";
    pago += e.completo ? " Saldo pendiente: " + formatoMoneda(0, mon) + " (pagado en su totalidad)." : e.alguno ? " Saldo pendiente: " + formatoMoneda(e.pendiente, mon) + "." : "";
    if (hayPagado(st)) pago += " Hay servicios ya pagados (Anexo B).";
    if (aplicaPlazoSaldo(st, calc)) pago += " El saldo vence a los " + frasePlazoSaldo(st) + " desde el aviso de que está listo, contra entrega. Sin ese pago no hay archivos finales.";
  }
  filas.push(["Pagos", pago]);
  filas.push(["Entrega", st.trabajoPrevio ? "El trabajo ya fue realizado y entregado (fechas reales en el Anexo B). Este contrato lo formaliza por escrito." : "Plazo estimado: " + valoresPlaceholders(st, cfg).plazo + "."]);
  if (servicio) {
    var cobroServ = titular + ": todo lo que genere la canción, el Master (distribuidora y SoundExchange) y la composición (su PRO y su publisher).";
    if (st.regalias === "puntos") cobroServ += " " + alias + ": solo su " + numPct(Number(st.puntosPct) || 0).replace("%", " %") + " del Master, por splits o liquidación.";
    filas.push(["Cómo cobra cada uno", cobroServ]);
    return filas;
  }
  var ed = editorialProductor(st, cfg);
  var cobro = titular + ": el Master a través de su distribuidora y SoundExchange; su parte de la composición a través de su sociedad de gestión (PRO) y su publisher.";
  if (Number(st.productorComp) > 0) cobro += " " + alias + ": su parte a través de " + (p.pro || "su sociedad") + (ed ? " y " + ed : "") + ".";
  if (st.guiaArtistas) cobro += " Guía paso a paso en el Anexo E.";
  filas.push(["Cómo cobra cada uno", cobro]);
  return filas;
}

var NOTA_RESUMEN = "Este resumen facilita la lectura. Si hubiera alguna diferencia, prevalecen las cláusulas y los anexos.";

/* Anexo E: guía informativa para los artistas (no crea obligaciones). */
function guiaArtistas(st, cfg) {
  var p = cfg.productor, alias = p.alias || "EL PRODUCTOR";
  var titular = titularMaster(st) || "el titular del Master";
  var comp = repartoComposicionCorto(st, cfg);
  var repartoTxt = comp.length ? listaReparto(comp) : "según el Anexo A";
  var pts = st.regalias === "puntos" ? Number(st.puntosPct) || 0 : 0;
  var masterTxt = pts > 0 ? titular + " " + numPct(100 - pts).replace("%", " %") + " · " + alias + " " + numPct(pts).replace("%", " %") + " (puntos de productor)" : titular + " 100 %";
  var g = {};
  g.intro = "Esta guía es informativa y no crea obligaciones. Explica cómo cobrar el dinero que genera la canción. Cada artista elige libremente los servicios que prefiera; los nombres son ejemplos de las opciones más usadas. Verificá condiciones y comisiones en cada servicio antes de contratarlo.";
  g.bolsas = [
    ["Master (la grabación)", "Es el audio final. Genera dinero cada vez que se reproduce o se vende la grabación. En este proyecto: " + masterTxt + "."],
    ["Composición (la obra)", "Es la canción en sí: música, letra y melodía. Genera dinero cada vez que la obra suena, se emite o se reproduce, sin importar quién la grabe. En este proyecto: " + repartoTxt + "."],
  ];
  g.mapa = [
    ["Master", "Distribuidora", "Regalías por reproducción digital (streams) y ventas del audio: lo que pagan Spotify, Apple Music y las demás plataformas cada vez que alguien reproduce la canción.", masterTxt],
    ["Master", "Content ID (desde la distribuidora)", "Uso del audio en videos de YouTube y redes sociales.", masterTxt],
    ["Master", "SoundExchange", "Regalías de ejecución digital del fonograma en EE. UU.: radios digitales no interactivas, satelitales y por cable (Pandora, SiriusXM). Paga 50 % al dueño del Master, 45 % al artista principal y 5 % a los músicos.", titular + ": 100 % como dueño del Master (Rights Owner) y artista principal"],
    ["Composición", "Sociedad de gestión (PRO)", "Ejecución pública: radio, TV, conciertos, locales y parte del streaming. Paga la parte de autor (writer share) y la parte editorial (publisher share).", "Cada autor su %: " + repartoTxt],
    ["Composición", "Administradora editorial (publisher)", "Regalías mecánicas (The MLC en EE. UU. y entidades de cada país) y la parte editorial de la ejecución pública.", "Cada autor su %: " + repartoTxt],
  ];
  g.opciones = [
    ["Distribuidora", "Symphonic, ONErpm, DistroKid, TuneCore, CD Baby, Amuse, Ditto Music."],
    ["Derechos del Master en EE. UU.", "SoundExchange (registro gratuito, como titular del Master y como artista)."],
    ["Sociedad de gestión (PRO)", "BMI o ASCAP (EE. UU.), AGADU (Uruguay), SADAIC (Argentina), SACM (México), APDAYC (Perú), SGAE (España). Como autor te afiliás a una sola, que cobra por vos en el resto del mundo mediante convenios."],
    ["Administradora editorial", "BeatStars Publishing, Songtrust, Symphonic Publishing, ONErpm Publishing, CD Baby Pro Publishing, Sentric Music."],
  ];
  g.minimo = "Lo mínimo para cobrar tu parte de la composición: estar afiliado a una sociedad de gestión (PRO), que te da tu código IPI, y tener un publisher. El publisher usa tu IPI para registrar la obra en las sociedades del mundo y en The MLC y cobra las mecánicas y la parte editorial; la parte de autor te la sigue pagando directamente tu PRO. Para el Master alcanza con la distribuidora y SoundExchange.";
  g.pasos = [
    "Afiliate como autor a una sociedad de gestión (PRO). Te asignan tu código IPI/CAE.",
    "Contratá una administradora editorial (publisher) para cobrar las regalías mecánicas y tu parte editorial.",
    "Subí la canción con tu distribuidora. Te dará el código ISRC de la grabación: compartilo con todos los autores" + (Number(st.productorComp) > 0 ? ", incluido " + alias : "") + ".",
    "Registrá la obra en tu PRO y en tu publisher con los porcentajes del Anexo A (" + repartoTxt + "), con el nombre legal y el IPI de cada autor. Los porcentajes deben coincidir en todos los registros.",
    "Registrá la grabación en SoundExchange como titular del Master (Rights Owner) y como artista principal (Featured Artist).",
    "Si querés monetizar el audio en YouTube, activá Content ID desde tu distribuidora.",
  ];
  if (sujetoMaster(st).plural) g.pasos.push("Como el Master es de varios artistas, definan entre ustedes quién lo sube con la distribuidora y cómo se reparten los ingresos (por ejemplo, con la función de splits).");
  g.productor = Number(st.productorComp) > 0 ? [
    ["Autor", p.nombre + " (" + alias + ")"], ["IPI", p.ipi], ["Sociedad", p.pro], ["Editorial", editorialProductor(st, cfg) || SIN_EDITORIAL],
    ["Porcentaje", numPct(Number(st.productorComp)).replace("%", " %") + " como autor y " + numPct(Number(st.productorComp)).replace("%", " %") + " como editorial"],
  ] : null;
  g.glosario = [
    ["Master / fonograma", "La grabación final del audio. Su dueño cobra por streams y ventas."],
    ["Composición / obra", "La canción (música, letra y melodía), independiente de la grabación."],
    ["Writer's share (parte de autor)", "La mitad de las regalías de ejecución pública, que la PRO paga directamente al autor."],
    ["Publisher's share (parte editorial)", "La otra mitad. La cobra la editorial o administradora del autor, que descuenta su comisión y le paga el resto."],
    ["Sistema 200 %", "Forma de registro de BMI y otras sociedades: los autores suman 100 % y las editoriales otro 100 %. Es el mismo reparto expresado dos veces."],
    ["Regalía mecánica", "Se genera cuando la obra se reproduce o se copia (streaming a demanda, descargas, discos). En EE. UU. la cobra The MLC."],
    ["Ejecución pública", "Se genera cuando la obra suena en público: radio, TV, locales, conciertos y streaming. La cobra la PRO."],
    ["PRO", "Sociedad de gestión colectiva de derechos de autor (BMI, ASCAP, AGADU, SADAIC y otras)."],
    ["IPI / CAE", "Código internacional que identifica a cada autor o editorial ante las sociedades."],
    ["ISRC", "Código de la grabación (Master). Lo asigna la distribuidora."],
    ["ISWC", "Código de la obra (composición). Lo asigna la sociedad al registrarla."],
    ["The MLC", "Entidad de EE. UU. que cobra las regalías mecánicas del streaming y las paga a editoriales y autores."],
    ["SoundExchange", "Entidad de EE. UU. que cobra la ejecución digital del Master (radios por internet y satelitales)."],
    ["Content ID", "Sistema de YouTube que identifica el audio en videos y permite monetizarlo. Solo lo registra el titular del Master."],
    ["Split", "Reparto automático de ingresos entre varias personas desde la distribuidora."],
  ];
  return g;
}

function valoresPlaceholders(st, cfg) {
  var calc = calcular(st);
  var p = cfg.productor;
  var u = UNIDADES_PLAZO[st.plazoUnidad] || UNIDADES_PLAZO.semanas;
  var mod = MODALIDADES[st.modalidad] || MODALIDADES.unidad;
  return {
    productor: p.nombre, alias: p.alias, ipi: p.ipi, pro: p.pro, email_productor: p.email, empresa: p.empresa,
    productor_identificacion: identificacionProductor(cfg),
    cliente: nombreCliente(st) || "EL CLIENTE",
    proyecto: (st.formatoObraV1 ? (textoObra(st) || "indicado en el Anexo B") : (st.proyecto || "indicado en el Anexo B")),
    modalidad: mod.nombre, modalidad_detalle: mod.detalle,
    activacion: ACTIVACIONES[st.activacion] || ACTIVACIONES.cancion,
    regalias_master: textoRegaliasMaster(st),
    reparto_composicion: textoRepartoComposicion(st, cfg),
    recaudacion_productor: textoRecaudacionProductor(st, cfg),
    distribuidora: st.distribuidora || "la que elija el titular del Master",
    revisiones_lista: listaRevisiones(st, cfg),
    plazo: cantidadConLetras(st.plazoNum, u[0], u[1]),
    custodia: cantidadConLetras(st.custodiaDias, "día", "días"),
    total: (function () {
      if (hayCotizar(st)) return calc.total > 0 ? formatoMoneda(calc.total, st.moneda) + " + a cotizar" : TEXTO_COTIZAR;
      return formatoMoneda(calc.total, st.moneda) + (calc.total === 0 && (st.tracks || []).some(function (t) { return t.gratis; }) ? " (sin costo)" : "");
    })(), anticipo: formatoMoneda(calc.anticipo, st.moneda), saldo: formatoMoneda(calc.saldo, st.moneda),
    moneda: st.moneda, ley: st.ley || "____________", jurisdiccion: st.jurisdiccion || "____________",
    ley_autor: st.leyAutor || "la legislación de derechos de autor aplicable",
    plazo_saldo: textoPlazoSaldo(st),
    reparto_por_pista: textoRepartoPorPista(st, cfg),
    estado_pago: textoEstadoPago(st),
    constancia_trabajo: textoConstanciaTrabajo(st),
    registro_master: textoRegistroMaster(st, cfg),
    registro_composicion: textoRegistroComposicion(st, cfg),
    editorial_productor: editorialProductor(st, cfg) || "la administradora editorial que designe",
    registro_pro_productor: Number(st.productorComp) > 0 ? " EL PRODUCTOR lo hace a través de " + (p.pro || "su sociedad de gestión") + (p.ipi ? " (IPI " + p.ipi + ")" : "") + "." : "",
    registro_editorial_productor: Number(st.productorComp) > 0 ? " EL PRODUCTOR lo hace a través de " + (editorialProductor(st, cfg) || "la administradora editorial que designe") + "." : "",
    porcentajes_obra: esServicio(st, cfg) ? "" : PORCENTAJES_OBRA,
    creditos: textoCreditos(st, cfg),
    servicios_lista: listaServiciosTexto(st, cfg),
    titular_master: titularMaster(st) || "EL CLIENTE",
    master_servicio: textoMasterServicio(st),
  };
}

function resolverTexto(texto, valores) {
  return String(texto || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (m, k) {
    return valores[k] != null ? String(valores[k]) : m;
  });
}

/* Convierte el texto de una cláusula en bloques: párrafos y listas, con **negritas**. */
function parsearBloques(texto) {
  var bloques = [];
  var lineas = String(texto || "").replace(/\r/g, "").split("\n");
  var parrafo = [];
  var lista = null;
  function runs(s) {
    var partes = s.split(/\*\*/);
    return partes.map(function (t, i) { return { texto: t, negrita: i % 2 === 1 }; }).filter(function (r) { return r.texto; });
  }
  function cerrarParrafo() {
    if (parrafo.length) bloques.push({ tipo: "p", runs: runs(parrafo.join(" ")) });
    parrafo = [];
  }
  function cerrarLista() {
    if (lista) bloques.push(lista);
    lista = null;
  }
  lineas.forEach(function (l) {
    var t = l.trim();
    var m = t.match(/^(?:[-•*])\s+(.*)$/);
    if (!t) { cerrarParrafo(); cerrarLista(); return; }
    if (m) {
      cerrarParrafo();
      if (!lista) lista = { tipo: "ul", items: [] };
      lista.items.push(runs(m[1]));
      return;
    }
    cerrarLista();
    parrafo.push(t);
  });
  cerrarParrafo();
  cerrarLista();
  return bloques;
}

function runsHTML(runs) {
  return runs.map(function (r) { return r.negrita ? "<strong>" + esc(r.texto) + "</strong>" : esc(r.texto); }).join("");
}

function bloquesHTML(bloques) {
  return bloques.map(function (b) {
    if (b.tipo === "ul") return "<ul>" + b.items.map(function (it) { return "<li>" + runsHTML(it) + "</li>"; }).join("") + "</ul>";
    return "<p>" + runsHTML(b.runs) + "</p>";
  }).join("");
}

function filaDL(etq, v) {
  return "<dt>" + etq + "</dt><dd>" + vacio(v) + "</dd>";
}

function marcar(v) { return v ? "☒" : "☐"; }

function renderFirmaBox(f, firma, cfg) {
  var img = firma && firma.img ? '<img src="' + firma.img + '" alt="Firma">' : "";
  var html = '<div class="firma-box" data-signer="' + f.key + '">';
  html += '<div class="firma-rol">' + esc(f.rol) + "</div>";
  html += '<div class="firma-img">' + img + "</div><div class=\"firma-linea\"></div>";
  var nombre = firma && firma.nombre ? firma.nombre : f.nombre;
  var doc = firma && firma.documento ? firma.documento : f.documento;
  html += '<div class="fila"><b>Nombre:</b><span>' + vacio(nombre) + (f.alias ? " <span class=\"vacio\">(" + esc(f.alias) + ")</span>" : "") + "</span></div>";
  if (f.cargo) html += '<div class="fila"><b>' + (f.key === "productor" ? "Sello:" : "Cargo/Rol:") + "</b><span>" + esc(f.cargo) + "</span></div>";
  html += '<div class="fila"><b>Documento:</b><span>' + vacio(doc, "________________") + "</span></div>";
  if (f.key === "productor" && cfg.productor.ipi) html += '<div class="fila"><b>IPI / ' + esc(cfg.productor.pro || "PRO") + ":</b><span>" + esc(cfg.productor.ipi) + "</span></div>";
  html += '<div class="fila"><b>Email:</b><span>' + vacio(firma && firma.email ? firma.email : f.email, "________________") + "</span></div>";
  html += '<div class="fila"><b>Fecha:</b><span class="firma-fecha">' + (firma && firma.fecha ? esc(fechaHoraLocal(firma.fecha)) : '<span class="vacio">____ / ____ / ______</span>') + "</span></div>";
  if (firma && firma.fecha) {
    html += '<div class="firma-sello">Firmado electrónicamente (' + esc(firma.metodo === "remota" ? "firma remota" : "firma en pantalla") + ") · Código del documento: " + esc((firma.hash || "").slice(0, 16)) + "</div>";
  }
  html += "</div>";
  return html;
}

function renderRegistroFirmas(st, lista) {
  var filas = lista.filter(function (f) { return st.firmas && st.firmas[f.key] && st.firmas[f.key].fecha; });
  if (!filas.length) return "";
  var html = '<h2>REGISTRO DE FIRMA ELECTRÓNICA</h2><table class="tbl"><thead><tr><th>Firmante</th><th>Documento</th><th>Email</th><th>Método</th><th>Fecha y hora</th><th>Dispositivo</th><th>Código doc.</th></tr></thead><tbody>';
  filas.forEach(function (f) {
    var fi = st.firmas[f.key];
    html += "<tr><td>" + esc(fi.nombre || f.nombre) + "<br><span class=\"vacio\">" + esc(f.rol) + "</span></td><td>" + esc(fi.documento || f.documento || "") + "</td><td>" + esc(fi.email || f.email || "") +
      "</td><td>" + (fi.metodo === "remota" ? "Remota (archivo de firma)" : "En pantalla") + "</td><td>" + esc(fechaHoraLocal(fi.fecha)) + "</td><td>" + esc(fi.dispositivo || "") + "</td><td><code>" + esc((fi.hash || "").slice(0, 16)) + "</code></td></tr>";
  });
  return html + "</tbody></table>";
}

/* Copias de st y cfg con los nombres legales formateados, para contratos con nombresV1. */
function conNombresFormateados(st, cfg) {
  if (!st.nombresV1) return { st: st, cfg: cfg };
  var s = JSON.parse(JSON.stringify(st)), c = JSON.parse(JSON.stringify(cfg));
  c.productor.nombre = nombrePropio(c.productor.nombre);
  (s.artistas || []).forEach(function (a) { if (a.nombre) a.nombre = nombrePropio(a.nombre); });
  if (s.cliente) {
    if (s.cliente.razon && s.tipoCliente !== "sello") s.cliente.razon = nombrePropio(s.cliente.razon);
    if (s.cliente.representante) s.cliente.representante = nombrePropio(s.cliente.representante);
  }
  Object.keys(s.firmas || {}).forEach(function (k) { if (s.firmas[k] && s.firmas[k].nombre) s.firmas[k].nombre = nombrePropio(s.firmas[k].nombre); });
  if (s.artisticosV1) {
    c.productor.alias = nombreArtistico(c.productor.alias);
    (s.artistas || []).forEach(function (a) { if (a.artistico) a.artistico = nombreArtistico(a.artistico); });
    if (s.cliente && s.cliente.artistico && s.tipoCliente !== "sello") s.cliente.artistico = nombreArtistico(s.cliente.artistico);
  }
  return { st: s, cfg: c };
}

function renderContrato(st, cfg) {
  var fmt = conNombresFormateados(st, cfg);
  st = fmt.st; cfg = fmt.cfg;
  var p = cfg.productor;
  var c = st.cliente || {};
  var calc = calcular(st);
  var vals = valoresPlaceholders(st, cfg);
  var mon = st.moneda;
  var h = "";

  h += '<article class="doc" data-id="' + esc(st.id) + '">';
  h += '<header class="doc-head"><img src="' + LOGOS.graykids + '" alt="Graykids Records">';
  h += '<div class="centro"><p class="marca">' + esc(p.alias || "CLARENY") + "</p>";
  h += '<p class="titulo">' + esc(tituloDocumento(st, cfg)) + "</p>";
  h += '<div class="sub">' + (p.mostrarEmpresa ? esc(p.empresa) + " · " : "") + esc(p.ciudad || "") + " · " + esc(p.web || "") + "</div></div>";
  h += '<img src="' + LOGOS.clareny + '" alt="Clareny"></header><div class="doc-barra"></div>';

  h += '<div id="contrato-cuerpo">';
  h += '<div class="doc-meta">';
  h += '<div><span class="lbl">ID del acuerdo</span><span class="val">' + vacio(st.id) + "</span></div>";
  h += '<div><span class="lbl">Versión</span><span class="val">' + vacio(st.version) + "</span></div>";
  h += '<div><span class="lbl">Fecha</span><span class="val">' + vacio(formatoFecha(st.fecha)) + "</span></div>";
  h += '<div><span class="lbl">Tipo de cliente</span><span class="val">' + esc(nombreTipoCliente(st)) + "</span></div>";
  h += '<div><span class="lbl">Modalidad</span><span class="val">' + esc((MODALIDADES[st.modalidad] || {}).nombre || "") + "</span></div>";
  h += '<div><span class="lbl">Precio total</span><span class="val">' + esc(totalTexto(st, calc)) + "</span></div>";
  if (st.tiposTrabajoV1) h += '<div class="ancho"><span class="lbl">Tipo de trabajo</span><span class="val">' + esc(TIPOS_TRABAJO[tipoTrabajo(st, cfg)].corto) + "</span></div>";
  h += '<div class="ancho"><span class="lbl">Proyecto</span><span class="val">' + vacio(st.formatoObraV1 ? (textoObra(st) || st.proyecto) : st.proyecto) + "</span></div>";
  h += "</div>";

  if (st.claridadV1) {
    h += '<div class="resumen-simple"><div class="rs-t">RESUMEN DEL ACUERDO · LO IMPORTANTE EN 1 MINUTO</div><dl>';
    h += resumenSimple(st, cfg).map(function (f) { return "<dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd>"; }).join("");
    h += '</dl><p class="rs-nota">' + esc(NOTA_RESUMEN) + "</p></div>";
  }

  h += '<h2>PARTES</h2><div class="partes">';
  h += '<div class="parte"><div class="parte-t">EL PRODUCTOR <span>·</span> ' + esc(p.alias) + "</div><dl>";
  h += filaDL("Nombre legal", p.nombre) + filaDL("Nombre artístico", p.alias);
  if (p.documento) h += filaDL("Documento", p.documento);
  h += filaDL("IPI", p.ipi) + filaDL("Sociedad", p.pro);
  if (p.mostrarEmpresa) h += filaDL("Sello", p.empresa + (p.empresaNota ? " " + p.empresaNota : ""));
  h += filaDL("Email", p.email) + filaDL("WhatsApp", p.whatsapp) + filaDL("Domicilio", p.ciudad) + "</dl></div>";

  var tituloCliente = "EL CLIENTE <span>·</span> " + tituloParteCliente(st);
  h += '<div class="parte"><div class="parte-t">' + tituloCliente + "</div><dl>";
  var filasCli = filasParteCliente(st);
  if (filasCli) {
    h += filasCli.map(function (f) { return filaDL(f[0], f[1]); }).join("") + "</dl></div>";
  } else if (st.tipoCliente === "sello") {
    h += filaDL("Razón social", c.razon) + filaDL("Nombre comercial", c.artistico) + filaDL("RUT / Registro", c.documento) +
      filaDL("Representante", c.representante) + filaDL("Cargo", c.cargo) + filaDL("Doc. representante", c.repDocumento);
  } else if (st.tipoCliente === "duo") {
    h += filaDL(st.tiposV2 ? "Nombre de la agrupación" : "Nombre del grupo", c.artistico || c.razon) + filaDL("Representante operativo", c.representante) + filaDL("Integrantes", (st.artistas || []).length + " (ver Anexo A)");
  } else if (st.tipoCliente === "colab") {
    h += filaDL("Crédito de los artistas", c.artistico || listaArtistasCredito(st)) + filaDL("Representante operativo", c.representante) + filaDL("Artistas", (st.artistas || []).length + " (ver Anexo A)");
  } else {
    h += filaDL("Nombre legal", c.razon) + filaDL("Nombre artístico", c.artistico) + filaDL("Documento", c.documento);
  }
  if (!filasCli) h += filaDL("Email", c.email) + filaDL("Teléfono", c.telefono) + (st.partesV2 ? "" : filaDL("País / Domicilio", c.domicilio)) + "</dl></div>";
  h += "</div>";

  clausulasActivas(st, cfg).forEach(function (cl, i) {
    h += "<h2>" + (i + 1) + ". " + esc(cl.titulo) + "</h2>";
    h += bloquesHTML(parsearBloques(resolverTexto(cl.texto, vals)));
  });

  /* Anexo A */
  var servicio = esServicio(st, cfg);
  h += '<section class="anexo"><div class="anexo-t"><span class="tag">ANEXO A</span><h3>' + (servicio ? "ARTISTAS Y FIRMANTES" : "ARTISTAS, AUTORES Y FIRMANTES") + "</h3></div>";
  h += '<p class="anexo-intro">' + esc(introAnexoA(st, cfg)) + "</p>";
  if (servicio) h += anexoAServicio(st, cfg);
  else {
    if (st.repartoMasterV1) h += '<h4 class="sub-anexo">1 · Composición (la canción · derechos de autor)</h4>';
    h += '<table class="tbl"><thead><tr><th>#</th><th>Nombre legal</th><th>Nombre artístico</th><th>Documento</th>' + (st.anexoEmail ? "<th>Email</th>" : "") + '<th>Rol</th><th class="num">Composición</th><th>Firma</th></tr></thead><tbody>';
    (st.artistas || []).forEach(function (a, i) {
      h += "<tr><td>" + (i + 1) + "</td><td>" + vacio(a.nombre, "__________") + "</td><td>" + vacio(a.artistico, "__________") + "</td><td>" + vacio(a.documento, "________") + "</td>" + (st.anexoEmail ? "<td>" + vacio(a.email, "__________") + "</td>" : "") + "<td>" + vacio(a.rol, "______") +
        '</td><td class="num">' + (Number(a.comp) || 0) + " %</td><td>" + (st.tipoCliente === "individual" ? "Como cliente" : a.firma ? "Requerida" : "No aplica") + "</td></tr>";
    });
    h += "<tr><td>P</td><td>" + esc(p.nombre) + "</td><td>" + esc(p.alias) + "</td><td>IPI " + esc(p.ipi) + "</td>" + (st.anexoEmail ? "<td>" + esc(p.email || "") + "</td>" : "") + "<td>Productor</td><td class=\"num\">" + (Number(st.productorComp) || 0) + " %</td><td>Como productor</td></tr>";
    h += '</tbody><tfoot><tr><td colspan="' + (st.anexoEmail ? 6 : 5) + '">TOTAL COMPOSICIÓN</td><td class="num">' + calc.composicion + " %</td><td></td></tr></tfoot></table>";
    if (st.repartoMasterV1) {
      h += '<h4 class="sub-anexo">2 · Master (la grabación · fonograma)</h4>';
      h += '<table class="tbl"><thead><tr><th>Titular</th><th>Calidad</th><th class="num">Master</th></tr></thead><tbody>';
      filasMaster(st, cfg).forEach(function (f) { h += "<tr><td>" + esc(f.titular) + "</td><td>" + esc(f.calidad) + '</td><td class="num">' + f.pct + " %</td></tr>"; });
      h += '</tbody><tfoot><tr><td colspan="2">TOTAL MASTER</td><td class="num">100 %</td></tr></tfoot></table>';
    }
    if (st.resumenDerechos) {
      h += '<div class="caja"><span class="lbl">Resumen de derechos · el Master y la composición son independientes</span>' +
        resumenDerechos(st, cfg).map(function (r) { return "<b>" + esc(r[0]) + ":</b> " + esc(r[1]); }).join("<br>") + "</div>";
    }
    if (Math.abs(calc.composicion - 100) > 0.001) h += '<div class="caja alerta">Atención: la composición suma ' + calc.composicion + " %. Debe sumar exactamente 100 % antes de firmar.</div>";
    if (st.bmi200) {
      h += '<h4 class="sub-anexo">Registro ante BMI / sociedad de gestión (sistema 200 %)</h4>';
      h += '<p class="anexo-intro">Mismo reparto de la composición, expresado como se registra en BMI: cada autor tiene su parte como autor (writer share) y la misma parte como editorial (publisher share). Autores 100 % + editoriales 100 % = 200 %.</p>';
      h += '<table class="tbl"><thead><tr><th>Autor (writer)</th><th>IPI</th><th>Sociedad</th><th class="num">Writer share</th><th>Editorial (publisher)</th><th class="num">Publisher share</th></tr></thead><tbody>';
      registroBMI(st, cfg).forEach(function (r) {
        h += "<tr><td>" + vacio(r.autor, "__________") + "</td><td>" + vacio(r.ipi, "________") + "</td><td>" + vacio(r.sociedad, "______") + '</td><td class="num">' + r.pct + " %</td><td>" +
          esc(r.editorial || SIN_EDITORIAL) + '</td><td class="num">' + r.pct + " %</td></tr>";
      });
      h += '</tbody><tfoot><tr><td colspan="3">TOTAL AUTORES / EDITORIALES</td><td class="num">' + calc.composicion + ' %</td><td></td><td class="num">' + calc.composicion + " %</td></tr>";
      h += '<tr><td colspan="5">TOTAL REGISTRO (WRITER + PUBLISHER)</td><td class="num">' + Math.round(calc.composicion * 200) / 100 + " %</td></tr></tfoot></table>";
    }
  }
  if (st.tipoCliente !== "individual" && !(st.partesV3 && st.tipoCliente !== "sello")) h += '<div class="caja"><span class="lbl">Representante operativo del proyecto</span>' + vacio(c.representante) + " · " + (st.partesV3 ? vacio(c.email, "email") : vacio(c.email || c.telefono, "email / WhatsApp")) + "</div>";
  h += "</section>";

  /* Anexo B */
  h += '<section class="anexo"><div class="anexo-t"><span class="tag">ANEXO B</span><h3>SCHEDULE OF TRACKS / ORDEN DE TRABAJO</h3></div>';
  h += '<p class="anexo-intro">Detalle de cada canción o servicio contratado. Nuevas canciones pueden sumarse con un nuevo Anexo B aceptado por escrito.</p>';
  var v2 = !!st.entregaV2;
  var colsFin = v2 ? 3 : 4;
  h += '<table class="tbl"><thead><tr><th>#</th><th>' + etiquetaColPista(st) + '</th><th>Servicio</th><th class="num">Cant.</th><th class="num">Precio unit.</th><th class="num">Subtotal</th><th>Rev.</th>' +
    (v2 ? "" : "<th>Stems</th>") + "<th>Titular Master</th><th>" + (v2 ? "Fecha de entrega" : "Entrega") + "</th></tr></thead><tbody>";
  (st.tracks || []).forEach(function (t, i) {
    var s = servicioPorId(cfg, t.servicio);
    var cant = Number(t.cantidad) || 0;
    h += "<tr><td>" + (i + 1) + "</td><td>" + htmlCeldaNombre(st, cfg, t) + "</td><td>" + esc(nombreServicio(cfg, t)) + '</td><td class="num">' + cant + " " + esc(unidadConCantidad(unidadTrack(cfg, t), cant)) +
      '</td><td class="num">' + esc(precioUnitarioTexto(t, mon)) + '</td><td class="num">' + esc(subtotalTexto(t, mon)) + "</td><td>" + (Number(t.revisiones) || 0) +
      "</td>" + (v2 ? "" : "<td>" + (t.stems ? "Sí" : "No") + "</td>") + "<td>" + vacio(t.titular, "________") + "</td><td>" + vacio(t.entrega ? formatoFecha(t.entrega) : "", "________") + "</td></tr>";
  });
  h += "</tbody><tfoot>";
  if (calc.stems > 0) h += '<tr><td colspan="5">STEMS (ADICIONAL)</td><td class="num">' + esc(formatoMoneda(calc.stems, mon)) + '</td><td colspan="' + colsFin + '"></td></tr>';
  h += '<tr><td colspan="5">SUBTOTAL</td><td class="num">' + esc(formatoMoneda(calc.subtotal, mon)) + '</td><td colspan="' + colsFin + '"></td></tr>';
  if (calc.descuento > 0) h += '<tr><td colspan="5">' + (calc.usarPaquete ? "AJUSTE PRECIO DE PAQUETE" : "DESCUENTO (" + (Number(st.descuento) || 0) + " %)") + '</td><td class="num">− ' + esc(formatoMoneda(calc.descuento, mon)) + '</td><td colspan="' + colsFin + '"></td></tr>';
  h += '<tr><td colspan="5">TOTAL</td><td class="num">' + esc(totalTexto(st, calc)) + '</td><td colspan="' + colsFin + '"></td></tr>';
  h += "</tfoot></table>";
  notasPrecioAnexoB(st).forEach(function (n) { h += '<div class="caja">' + esc(n) + "</div>"; });
  if (muestraDerechosPorPista(st, cfg)) h += htmlTablaDerechosPista(st, cfg);
  if (st.detalleV2) {
    h += '<h4 class="sub-anexo">Detalle de los servicios</h4>';
    h += '<table class="tbl"><thead><tr><th>#</th><th>' + etiquetaColPista(st) + "</th><th>" + (st.alcanceV1 ? "Paquete (incluye / no incluye)" : "Qué incluye") + "</th><th>Especificaciones</th></tr></thead><tbody>";
    (st.tracks || []).forEach(function (t, i) {
      h += "<tr><td>" + (i + 1) + "</td><td>" + esc(textoRefPista(st, cfg, t)) + "</td><td" + (st.alcanceV1 ? ' class="alcance">' + htmlAlcance(cfg, t) : ">" + esc(incluyeServicio(cfg, t) || "Según lo acordado")) + "</td><td>" + esc(especificacionesServicio(t) || "—") + "</td></tr>";
    });
    h += "</tbody></table>";
  }
  if (v2) {
    h += '<h4 class="sub-anexo">Formato de entrega</h4>';
    h += '<table class="tbl"><thead><tr><th>#</th><th>' + etiquetaColPista(st) + "</th><th>Qué se entrega</th><th>Formato de audio</th><th>Stems (instrumental por partes)</th></tr></thead><tbody>";
    (st.tracks || []).forEach(function (t, i) {
      var e = detalleEntrega(st, cfg, t);
      h += "<tr><td>" + (i + 1) + "</td><td>" + esc(textoRefPista(st, cfg, t)) + "</td><td>" + esc(e.contenido) + "</td><td>" + esc(e.formato) + "</td><td>" + esc(e.stems) + "</td></tr>";
    });
    h += "</tbody></table>";
  }
  h += '<div class="caja"><span class="lbl">Modalidad de transferencia del Master</span>' + esc(ACTIVACIONES[st.activacion] || "") + "</div>";
  var rm = repartoMaster(st, cfg);
  if (rm) h += '<div class="caja"><span class="lbl">Regalías del Master (ingresos netos)</span>' + esc(rm) + "</div>";
  if (st.condicionEspecial) h += '<div class="caja"><span class="lbl">Condición especial del proyecto</span>' + esc(st.condicionEspecial) + "</div>";
  h += "</section>";

  /* Anexo C */
  h += '<section class="anexo seguido"><div class="anexo-t"><span class="tag">ANEXO C</span><h3>CONDICIONES ECONÓMICAS, ENTREGA Y ARCHIVOS</h3></div>';
  h += '<div class="grid-econ">';
  h += '<div><span class="lbl">Precio total del proyecto</span><span class="val grande">' + esc(totalTexto(st, calc)) + "</span></div>";
  h += '<div><span class="lbl">Moneda</span><span class="val">' + esc(mon) + "</span></div>";
  h += '<div><span class="lbl">Pago inicial (' + (Number(st.anticipoPct) || 0) + ' %)</span><span class="val">' + esc(formatoMoneda(calc.anticipo, mon)) + "</span></div>";
  h += '<div><span class="lbl">Saldo</span><span class="val">' + esc(formatoMoneda(calc.saldo, mon)) + "</span></div>";
  var ep = estadoPagos(st, calc);
  if (ep.alguno) h += '<div class="ancho"><span class="lbl">Estado de pagos</span><span class="val">' + esc(lineaEstadoPagos(st, calc)) + "</span></div>";
  if (aplicaPlazoSaldo(st, calc)) h += '<div class="ancho"><span class="lbl">Plazo del saldo</span><span class="val">' + esc(frasePlazoSaldo(st) + " desde el aviso de que los archivos están listos. Contra entrega: sin pago no hay WAV ni Master.") + "</span></div>";
  h += '<div><span class="lbl">Tarifa de stems</span><span class="val">' + (st.entregaV2 ? esc(textoTarifaStems(st, calc)) : vacio(st.stemsTarifa, "No aplica")) + "</span></div>";
  h += '<div><span class="lbl">Custodia de sesiones</span><span class="val">' + esc(vals.custodia) + "</span></div>";
  h += '<div><span class="lbl">Recuperación posterior</span><span class="val">' + vacio(st.recuperacion, "A cotizar") + "</span></div>";
  h += '<div><span class="lbl">Plazo estimado</span><span class="val">' + esc(vals.plazo) + "</span></div>";
  h += '<div class="ancho"><span class="lbl">Forma de pago</span><span class="val">' + vacio(st.formaPago) + "</span></div>";
  h += '<div class="ancho"><span class="lbl">Observaciones</span>' + vacio(st.observaciones, "—") + "</div>";
  h += "</div></section>";
  h += "</div>"; /* fin contrato-cuerpo */

  /* Anexo D */
  var lista = firmantes(st, cfg);
  h += '<section class="anexo" id="contrato-firmas"><div class="anexo-t"><span class="tag">ANEXO D</span><h3>FIRMAS</h3></div>';
  h += '<p class="anexo-intro">Al firmar, cada parte declara haber leído y aceptado íntegramente este acuerdo y sus anexos. Las firmas electrónicas quedan registradas con fecha, hora, dispositivo y el código de verificación del documento.</p>';
  h += '<div class="firmas">';
  lista.forEach(function (f) { h += renderFirmaBox(f, st.firmas && st.firmas[f.key], cfg); });
  h += "</div>";
  h += '<div id="registro-firmas">' + renderRegistroFirmas(st, lista) + "</div>";
  h += '<div class="verif">Código de verificación del documento (SHA-256 del texto del contrato, Anexos A–C): <code id="codigo-doc">—</code><br>Si se modifica cualquier palabra del contrato, este código cambia. Compará este código con el de tu copia para confirmar que es el mismo documento.</div>';
  h += '<div class="doc-fin">' + esc(p.alias) + (p.mostrarEmpresa ? " · " + esc(p.empresa) : "") + " · " + esc(st.id) + "</div>";
  h += "</section>";
  if (st.claridadV1 && st.guiaArtistas && !servicio) h += renderGuia(st, cfg);
  h += "</article>";
  return h;
}

/* Anexo A de un servicio de audio: artistas sin columna de composición y reparto del Master. */
function rolProductorServicio(st, cfg) { return "Servicio técnico (" + rolesTecnicos(st, cfg).join(" / ") + ")"; }

function anexoAServicio(st, cfg) {
  var p = cfg.productor, c = st.cliente || {};
  var h = '<h4 class="sub-anexo">1 · Artistas</h4>';
  h += '<table class="tbl"><thead><tr><th>#</th><th>Nombre legal</th><th>Nombre artístico</th><th>Documento</th>' + (st.anexoEmail ? "<th>Email</th>" : "") + "<th>Rol</th><th>Firma</th></tr></thead><tbody>";
  (st.artistas || []).forEach(function (a, i) {
    h += "<tr><td>" + (i + 1) + "</td><td>" + vacio(a.nombre, "__________") + "</td><td>" + vacio(a.artistico, "__________") + "</td><td>" + vacio(a.documento, "________") + "</td>" + (st.anexoEmail ? "<td>" + vacio(a.email, "__________") + "</td>" : "") +
      "<td>" + vacio(a.rol, "______") + "</td><td>" + (st.tipoCliente === "individual" ? "Como cliente" : a.firma ? "Requerida" : "No aplica") + "</td></tr>";
  });
  h += "<tr><td>P</td><td>" + esc(p.nombre) + "</td><td>" + esc(p.alias) + "</td><td>" + esc(p.documento || "—") + "</td>" + (st.anexoEmail ? "<td>" + esc(p.email || "") + "</td>" : "") + "<td>" + esc(rolProductorServicio(st, cfg)) + "</td><td>Como productor</td></tr>";
  h += "</tbody></table>";
  h += '<h4 class="sub-anexo">2 · Master (la grabación · fonograma)</h4>';
  h += '<table class="tbl"><thead><tr><th>Titular</th><th>Calidad</th><th class="num">Master</th></tr></thead><tbody>';
  filasMaster(st, cfg).forEach(function (f) { h += "<tr><td>" + esc(f.titular) + "</td><td>" + esc(f.calidad) + '</td><td class="num">' + f.pct + " %</td></tr>"; });
  h += '</tbody><tfoot><tr><td colspan="2">TOTAL MASTER</td><td class="num">100 %</td></tr></tfoot></table>';
  h += '<div class="caja"><span class="lbl">Resumen de derechos · servicio técnico de audio</span>' +
    resumenDerechos(st, cfg).map(function (r) { return "<b>" + esc(r[0]) + ":</b> " + esc(r[1]); }).join("<br>") + "</div>";
  return h;
}

function lineaEstadoPagos(st, calc) {
  var e = estadoPagos(st, calc), mon = st.moneda, partes = [];
  if (e.anticipo) partes.push("Pago inicial " + formatoMoneda(calc.anticipo, mon) + ": " + (e.anticipoOk ? "pagado" + (st.anticipoFechaPago ? " el " + formatoFecha(st.anticipoFechaPago) : "") : "pendiente"));
  if (e.saldo) partes.push("Saldo " + formatoMoneda(calc.saldo, mon) + ": " + (e.saldoOk ? "pagado" + (st.saldoFechaPago ? " el " + formatoFecha(st.saldoFechaPago) : "") : "pendiente"));
  partes.push("Saldo pendiente: " + formatoMoneda(e.pendiente, mon) + (e.completo ? " (pagado en su totalidad)" : ""));
  return partes.join(" · ");
}

function renderGuia(st, cfg) {
  var g = guiaArtistas(st, cfg);
  var tabla = function (cab, filas) {
    return '<table class="tbl"><thead><tr>' + cab.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      filas.map(function (f) { return "<tr>" + f.map(function (x, i) { return "<td>" + (i === 0 ? "<b>" + esc(x) + "</b>" : esc(x)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
  };
  var h = '<section class="anexo guia"><div class="anexo-t"><span class="tag">ANEXO E</span><h3>GUÍA PARA ARTISTAS: CÓMO REGISTRAR Y COBRAR TUS REGALÍAS</h3></div>';
  h += '<p class="anexo-intro">' + esc(g.intro) + "</p>";
  h += '<h4 class="sub-anexo">Las dos “bolsas” de dinero de una canción</h4>' + tabla(["Bolsa", "Qué es"], g.bolsas);
  h += '<h4 class="sub-anexo">Mapa del dinero: quién cobra qué</h4>' + tabla(["Bolsa", "Herramienta", "Qué cobra", "En este proyecto"], g.mapa);
  h += '<h4 class="sub-anexo">Opciones más usadas (elegí la que prefieras)</h4>' + tabla(["Herramienta", "Opciones"], g.opciones);
  h += '<h4 class="sub-anexo">Pasos recomendados</h4><div class="caja ok">' + esc(g.minimo) + '</div><ol class="guia-pasos">' + g.pasos.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
  if (g.productor) h += '<h4 class="sub-anexo">Datos de ' + esc(cfg.productor.alias || "EL PRODUCTOR") + " para registrar la obra</h4>" + tabla(["Dato", "Valor"], g.productor);
  h += '<h4 class="sub-anexo">Glosario</h4>' + tabla(["Término", "Significado"], g.glosario);
  return h + "</section>";
}

/* Reglas @page (encabezado y pie en cada hoja al imprimir/guardar PDF). */
function cssPagina(st, cfg) {
  var p = cfg.productor;
  var q = function (s) { return '"' + String(s || "").replace(/["\\]/g, "") + '"'; };
  return "@page { size: A4; margin: 14mm 0 14mm 0;" +
    " @top-left { content: " + q((p.alias || "") + (p.mostrarEmpresa ? "  |  " + p.empresa : "")) + "; font-family: Tektur, Bahnschrift, sans-serif; font-size: 7.5pt; letter-spacing: .15em; color: #5b6672; padding-left: 17mm; }" +
    " @top-right { content: " + q(st.id) + "; font-family: Tektur, Bahnschrift, sans-serif; font-size: 7.5pt; letter-spacing: .12em; color: #5b6672; padding-right: 17mm; }" +
    " @bottom-left { content: " + q(p.email + "  |  IPI " + p.ipi + "  |  " + p.web) + "; font-size: 7pt; color: #9aa4ad; padding-left: 17mm; }" +
    " @bottom-right { content: \"Página \" counter(page) \" de \" counter(pages); font-size: 7pt; color: #9aa4ad; padding-right: 17mm; } }" +
    " @page :first { @top-left { content: none; } @top-right { content: none; } }";
}
