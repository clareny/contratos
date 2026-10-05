/* PDF que el cliente firmó a mano (Marcación del iPhone, Vista Previa, Adobe…): reconoce el contrato,
   lee el código de verificación impreso y recorta la firma dibujada en el recuadro de cada firmante.
   El lector de PDF (pdf.js, vendor/pdfjs) se descarga solo la primera vez que se usa. */

var lectorPdf = null;

function cargarLectorPdf() {
  if (!lectorPdf) {
    var base = new URL("vendor/pdfjs/", document.baseURI).href;
    lectorPdf = import(base + "pdf.min.js").then(function (m) {
      m.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.js";
      return m;
    }, function () {
      lectorPdf = null;
      throw new Error("No se pudo cargar el lector de PDF. Revisá tu internet y probá de nuevo.");
    });
  }
  return lectorPdf;
}

function esPdf(bytes) {
  return /%PDF-/.test(String.fromCharCode.apply(null, bytes.subarray(0, 1024)));
}

function huellaBytes(bytes) {
  return crypto.subtle.digest("SHA-256", bytes).then(function (h) {
    return Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  });
}

/* Fechas PDF: D:AAAAMMDDHHmmSS seguido de Z, +HH'mm' o -HH'mm'. Sin zona se toma la hora local. */
function fechaDePdf(s) {
  var m = /D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Zz+\-])?(\d{2})?'?(\d{2})?/.exec(s || "");
  if (!m) return "";
  var p = [+m[1], (+m[2] || 1) - 1, +m[3] || 1, +m[4] || 0, +m[5] || 0, +m[6] || 0];
  var t;
  if (!m[7]) t = new Date(p[0], p[1], p[2], p[3], p[4], p[5]).getTime();
  else {
    t = Date.UTC(p[0], p[1], p[2], p[3], p[4], p[5]);
    if (m[7] === "+" || m[7] === "-") t -= (m[7] === "+" ? 1 : -1) * ((+m[8] || 0) * 60 + (+m[9] || 0)) * 60000;
  }
  return isNaN(t) ? "" : new Date(t).toISOString();
}

function normalizarTexto(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dispositivoPdf(programa) {
  var p = String(programa || "");
  if (/iOS|iPadOS/i.test(p)) return "PDF firmado en iPhone/iPad (Marcación)";
  if (/Mac OS|macOS/i.test(p)) return "PDF firmado en Mac (Vista Previa)";
  return "PDF firmado" + (p ? " (" + p.slice(0, 40) + ")" : "");
}

/* Arma renglones con la posición de cada letra. Al guardar desde el iPhone cada letra llega suelta,
   por eso se trabaja letra por letra y sin espacios. */
function lineasDeTexto(items) {
  var glifos = [];
  items.forEach(function (it) {
    if (!it.str || !it.transform) return;
    var n = it.str.length, x = it.transform[4], y = it.transform[5], h = it.height || Math.abs(it.transform[3]) || 0;
    for (var i = 0; i < n; i++) glifos.push({ c: it.str[i], x: x + (it.width || 0) * i / n, y: y, h: h });
  });
  glifos.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
  var lineas = [];
  glifos.forEach(function (g) {
    var l = lineas[lineas.length - 1];
    if (!l || Math.abs(l.y - g.y) > Math.max(1.5, g.h * 0.3)) { l = { y: g.y, h: g.h, g: [] }; lineas.push(l); }
    l.g.push(g);
  });
  return lineas.map(function (l) {
    l.g.sort(function (a, b) { return a.x - b.x; });
    var t = "", xs = [];
    l.g.forEach(function (g) { if (/\S/.test(g.c)) { t += g.c; xs.push(g.x); } });
    return { y: l.y, h: l.h, t: t, xs: xs };
  });
}

async function leerPdfFirmado(bytes) {
  var huella = await huellaBytes(bytes);
  var pdfjs = await cargarLectorPdf();
  var doc;
  try {
    doc = await pdfjs.getDocument({ data: bytes.slice(0), isEvalSupported: false }).promise;
  } catch (e) {
    throw new Error(e && e.name === "PasswordException" ? "El PDF tiene contraseña: pedí que te lo manden sin contraseña." : "El archivo no es un PDF válido o está dañado.");
  }
  var meta = await doc.getMetadata().catch(function () { return {}; });
  var info = (meta && meta.info) || {};
  var paginas = [];
  for (var n = 1; n <= doc.numPages; n++) {
    var pg = await doc.getPage(n);
    var tc = await pg.getTextContent();
    paginas.push({ num: n, lineas: lineasDeTexto(tc.items) });
  }
  return {
    doc: doc, huella: huella, titulo: String(info.Title || ""), programa: String(info.Producer || ""),
    fecha: fechaDePdf(info.ModDate) || fechaDePdf(info.CreationDate), paginas: paginas,
  };
}

function textoPagina(p) { return p.lineas.map(function (l) { return l.t; }).join(""); }

/* El título del PDF es el nombre de archivo que puso el programa: Contrato_<id>_<cliente>… */
function idEnPdf(lectura, ids) {
  var m = /^Contrato_([A-Za-z0-9-]+)_/.exec(lectura.titulo);
  if (m) return m[1];
  var textos = lectura.paginas.map(textoPagina);
  var hallados = ids.filter(function (id) {
    return id && textos.some(function (t) { return t.indexOf(id) >= 0; });
  }).sort(function (a, b) { return b.length - a.length; });
  return hallados[0] || "";
}

function codigoEnPdf(lectura) {
  for (var i = lectura.paginas.length - 1; i >= 0; i--) {
    var m = /[Vv]erificaci[oó]n[^:]{0,120}:([0-9a-f]{64})/.exec(textoPagina(lectura.paginas[i]));
    if (m) return m[1];
  }
  return "";
}

/* Cada recuadro de firma tiene un renglón «Nombre: …»; de ahí salen su posición y a quién corresponde. */
function cajasDeFirma(lectura) {
  var cajas = [], paso = 0;
  lectura.paginas.forEach(function (p) {
    p.lineas.forEach(function (l) {
      var pos = [], re = /Nombre:/g, m;
      while ((m = re.exec(l.t))) pos.push(m.index);
      pos.forEach(function (i, j) {
        var fin = j + 1 < pos.length ? pos[j + 1] : l.t.length;
        cajas.push({ pagina: p.num, x: l.xs[i], y: l.y, h: l.h, valor: normalizarTexto(l.t.slice(i + 7, fin)) });
        if (j > 0) { var d = l.xs[i] - l.xs[pos[j - 1]]; if (d > 0 && (!paso || d < paso)) paso = d; }
      });
    });
  });
  cajas.forEach(function (c) { c.paso = paso || 254 * (c.h > 2 ? c.h / 8.8 : 1); });
  return cajas;
}

async function firmasEnPdf(lectura, lista) {
  var cajas = cajasDeFirma(lectura), usadas = {}, de = {};
  lista.forEach(function (f) {
    var nom = normalizarTexto(f.nombre);
    if (nom.length < 4) return;
    for (var i = 0; i < cajas.length; i++) {
      if (!usadas[i] && cajas[i].valor.indexOf(nom) === 0) { de[f.key] = cajas[i]; usadas[i] = true; return; }
    }
  });
  if (cajas.length === lista.length) {
    lista.forEach(function (f, i) { if (!de[f.key] && !usadas[i]) { de[f.key] = cajas[i]; usadas[i] = true; } });
  }
  var res = {};
  for (var j = 0; j < lista.length; j++) {
    var c = de[lista[j].key];
    res[lista[j].key] = c ? await recortarFirma(lectura.doc, c) : { caja: false, img: "" };
  }
  return res;
}

/* Zona de la firma: desde el título del recuadro hasta justo arriba de «Nombre:». Las medidas salen del
   diseño del Anexo D (letra de 8,8 pt) y se escalan si el PDF se imprimió más chico o más grande.
   La página se dibuja con y sin anotaciones: una firma que sigue siendo anotación sale entera aunque
   pase por encima del texto; una que el programa ya pegó a la hoja se toma solo de la zona de firma. */
async function recortarFirma(doc, c) {
  var pdfjs = await cargarLectorPdf();
  var k = c.h > 2 ? c.h / 8.8 : 1, escala = 3;
  var pg = await doc.getPage(c.pagina);
  var vp = pg.getViewport({ scale: escala });
  var a = vp.convertToViewportPoint(c.x - 6 * k, c.y + 76 * k);
  var b = vp.convertToViewportPoint(c.x + c.paso - 22 * k, c.y - 1 * k);
  var x0 = Math.floor(Math.min(a[0], b[0])), y0 = Math.floor(Math.min(a[1], b[1]));
  var w = Math.max(1, Math.ceil(Math.abs(b[0] - a[0]))), h = Math.max(1, Math.ceil(Math.abs(b[1] - a[1])));
  var corte = Math.round(vp.convertToViewportPoint(c.x, c.y + 8.5 * k)[1] - y0);
  async function dibujar(modo) {
    var lienzo = document.createElement("canvas");
    lienzo.width = w; lienzo.height = h;
    var ctx = lienzo.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    await pg.render({ canvasContext: ctx, viewport: pg.getViewport({ scale: escala, offsetX: -x0, offsetY: -y0 }), annotationMode: modo, background: "#ffffff" }).promise;
    return lienzo;
  }
  var con = await dibujar(pdfjs.AnnotationMode.ENABLE);
  var sin = await dibujar(pdfjs.AnnotationMode.DISABLE);
  return limpiarFirma(con, sin, corte, escala);
}

/* Deja solo el trazo sobre fondo transparente: saca el blanco, el título celeste del recuadro y la línea
   de firma (sin cortar los trazos que la cruzan). Debajo de la fila «corte» solo cuentan las anotaciones. */
function limpiarFirma(con, sin, corte, escala) {
  var w = con.width, h = con.height, ctx = con.getContext("2d");
  var im = ctx.getImageData(0, 0, w, h), d = im.data, s = sin.getContext("2d").getImageData(0, 0, w, h).data;
  var A = new Float32Array(w * h), B = new Float32Array(w * h), i, x, y;
  for (i = 0; i < w * h; i++) {
    var r = d[i * 4], g = d[i * 4 + 1], bl = d[i * 4 + 2], m = Math.min(r, g, bl), a = 1 - m / 255;
    if (a < 0.25) continue;
    r = (r - m) / a; g = (g - m) / a; bl = (bl - m) / a;
    if (g - r > 45 && bl - r > 35) continue;
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = bl;
    if (i < corte * w) A[i] = a;
    if ((Math.min(s[i * 4], s[i * 4 + 1], s[i * 4 + 2]) - m) / 255 > 0.2) B[i] = a;
  }
  var salto = Math.round(2 * escala), desde = -1;
  function borrarBanda(y1, y2) {
    y1 = Math.max(0, y1); y2 = Math.min(h - 1, y2);
    var sup = y1 - salto, inf = y2 + salto;
    for (x = 0; x < w; x++) {
      if (sup >= 0 && inf < h && A[sup * w + x] > 0.3 && A[inf * w + x] > 0.3) continue;
      for (var yy = y1; yy <= y2; yy++) A[yy * w + x] = 0;
    }
  }
  for (y = 0; y <= h; y++) {
    var linea = false;
    if (y < h) {
      var n = 0;
      for (x = 0; x < w; x++) if (A[y * w + x] > 0.3) n++;
      linea = n >= w * 0.6;
    }
    if (linea && desde < 0) desde = y;
    if (!linea && desde >= 0) { borrarBanda(desde - 1, y); desde = -1; }
  }
  var tinta = 0, x1 = w, y1 = h, x2 = -1, y2 = -1;
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      var v = Math.max(A[y * w + x], B[y * w + x]);
      A[y * w + x] = v;
      if (v > 0.35) tinta++;
      if (v > 0.1) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
    }
  }
  if (tinta < 120) return { caja: true, img: "", tinta: tinta };
  for (i = 0; i < w * h; i++) d[i * 4 + 3] = Math.round(A[i] * 255);
  ctx.putImageData(im, 0, 0);
  var pad = salto;
  x1 = Math.max(0, x1 - pad); y1 = Math.max(0, y1 - pad); x2 = Math.min(w - 1, x2 + pad); y2 = Math.min(h - 1, y2 + pad);
  var ancho = x2 - x1 + 1, alto = y2 - y1 + 1, f = Math.min(1, 600 / ancho, 180 / alto);
  var salida = document.createElement("canvas");
  salida.width = Math.max(1, Math.round(ancho * f));
  salida.height = Math.max(1, Math.round(alto * f));
  salida.getContext("2d").drawImage(con, x1, y1, ancho, alto, 0, 0, salida.width, salida.height);
  return { caja: true, img: salida.toDataURL("image/png"), tinta: tinta };
}
