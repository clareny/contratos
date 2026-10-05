/* Exportación a Word (.docx) con la librería docx (vendor/docx.iife.js). */

function dataUrlABytes(dataUrl) {
  var b64 = dataUrl.split(",")[1] || "";
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function medirImagen(dataUrl) {
  return new Promise(function (ok) {
    var img = new Image();
    img.onload = function () { ok({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = function () { ok({ w: 100, h: 100 }); };
    img.src = dataUrl;
  });
}

async function imagenDocx(dataUrl, altoMax, anchoMax) {
  var d = docx;
  var m = await medirImagen(dataUrl);
  var escala = Math.min(altoMax / m.h, (anchoMax || 9999) / m.w);
  return new d.ImageRun({ type: "png", data: dataUrlABytes(dataUrl), transformation: { width: Math.round(m.w * escala), height: Math.round(m.h * escala) } });
}

async function exportarWord(st, cfg, hash) {
  var fmt = conNombresFormateados(st, cfg);
  st = fmt.st; cfg = fmt.cfg;
  var d = docx;
  var p = cfg.productor;
  var c = st.cliente || {};
  var calc = calcular(st);
  var vals = valoresPlaceholders(st, cfg);
  var mon = st.moneda;
  var TK = "Bahnschrift";
  var BODY = "Segoe UI";
  var NEGRO = "0D1117", CIAN = "0A8F94", GRIS = "5B6672", LINEA = "C8D4DE", SUAVE = "F3F6F8";

  function t(texto, o) {
    o = o || {};
    return new d.TextRun({ text: String(texto == null ? "" : texto), bold: o.b, font: o.font || BODY, size: o.size || 19, color: o.color, characterSpacing: o.sp, italics: o.i });
  }
  function relleno(v, r) { return v != null && String(v).trim() !== "" ? String(v) : (r || "____________________"); }
  function par(children, o) {
    o = o || {};
    return new d.Paragraph({ children: children, alignment: o.align || d.AlignmentType.JUSTIFIED, spacing: { after: o.after == null ? 100 : o.after, before: o.before || 0 },
      pageBreakBefore: o.salto, keepNext: o.keepNext, border: o.border, bullet: o.bullet });
  }
  function titulo(texto, o) {
    o = o || {};
    return par([t(texto, { b: true, font: TK, size: 21, sp: 20 })], { before: 220, after: 90, keepNext: true, align: d.AlignmentType.LEFT,
      border: { left: { style: d.BorderStyle.SINGLE, size: 18, color: "1CDADD", space: 6 } } });
  }
  function etiqueta(texto) { return t(texto.toUpperCase(), { font: TK, size: 13, color: CIAN, b: true, sp: 20 }); }
  function bloques(texto) {
    return parsearBloques(texto).reduce(function (acc, b) {
      var mk = function (runs) { return runs.map(function (r) { return t(r.texto, { b: r.negrita }); }); };
      if (b.tipo === "ul") b.items.forEach(function (it) { acc.push(par(mk(it), { bullet: { level: 0 }, after: 40 })); });
      else acc.push(par(mk(b.runs)));
      return acc;
    }, []);
  }
  var bordeFino = { style: d.BorderStyle.SINGLE, size: 4, color: LINEA };
  var sinBorde = { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" };
  var bordes = { top: bordeFino, bottom: bordeFino, left: bordeFino, right: bordeFino, insideHorizontal: bordeFino, insideVertical: bordeFino };
  var bordesNinguno = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde, insideHorizontal: sinBorde, insideVertical: sinBorde };

  function celda(children, o) {
    o = o || {};
    return new d.TableCell({ children: Array.isArray(children) ? children : [children], columnSpan: o.span, width: o.w ? { size: o.w, type: d.WidthType.PERCENTAGE } : undefined,
      shading: o.fill ? { fill: o.fill, type: d.ShadingType.CLEAR, color: "auto" } : undefined, verticalAlign: o.valign,
      margins: { top: 60, bottom: 60, left: 100, right: 100 }, borders: o.borders });
  }
  function tabla(filas, o) {
    o = o || {};
    return new d.Table({ rows: filas, width: { size: 100, type: d.WidthType.PERCENTAGE }, borders: o.borders || bordes });
  }
  function filaHead(cols) {
    return new d.TableRow({ tableHeader: true, children: cols.map(function (x) {
      return celda(par([t(x.toUpperCase(), { b: true, font: TK, size: 14, color: "FFFFFF" })], { after: 0, align: d.AlignmentType.LEFT }), { fill: NEGRO });
    }) });
  }
  function filaSimple(cols, o) {
    o = o || {};
    return new d.TableRow({ cantSplit: true, children: cols.map(function (x, i) {
      return celda(par([t(x, { size: 17, b: o.b })], { after: 0, align: o.der && o.der.indexOf(i) >= 0 ? d.AlignmentType.RIGHT : d.AlignmentType.LEFT }), { fill: o.fill });
    }) });
  }
  function kv(lbl, v, span) {
    return celda([par([etiqueta(lbl)], { after: 0, align: d.AlignmentType.LEFT }), par([t(relleno(v), { b: true, size: 18 })], { after: 0, align: d.AlignmentType.LEFT })], { span: span });
  }

  var hijos = [];

  /* Encabezado de la primera página */
  var logoGk = await imagenDocx(LOGOS.graykids, 60);
  var logoCl = await imagenDocx(LOGOS.clareny, 55);
  hijos.push(tabla([new d.TableRow({ children: [
    celda(par([logoGk], { align: d.AlignmentType.LEFT, after: 0 }), { w: 15, valign: d.VerticalAlign.CENTER }),
    celda([
      par([t(p.alias || "CLARENY", { b: true, font: TK, size: 44, sp: 120 })], { align: d.AlignmentType.CENTER, after: 40 }),
      par([t(tituloDocumento(st, cfg), { b: true, font: TK, size: 20, sp: 16 })], { align: d.AlignmentType.CENTER, after: 20 }),
      par([t((p.mostrarEmpresa ? p.empresa + " · " : "") + (p.ciudad || "") + " · " + (p.web || ""), { size: 16, color: GRIS })], { align: d.AlignmentType.CENTER, after: 0 }),
    ], { w: 70, valign: d.VerticalAlign.CENTER }),
    celda(par([logoCl], { align: d.AlignmentType.RIGHT, after: 0 }), { w: 15, valign: d.VerticalAlign.CENTER }),
  ] })], { borders: bordesNinguno }));
  hijos.push(par([t("")], { after: 160, border: { bottom: { style: d.BorderStyle.THICK, size: 18, color: "1CDADD", space: 1 } } }));

  /* Datos generales */
  var filasMeta = [
    new d.TableRow({ children: [kv("ID del acuerdo", st.id), kv("Versión", st.version), kv("Fecha", formatoFecha(st.fecha))] }),
    new d.TableRow({ children: [kv("Tipo de cliente", nombreTipoCliente(st)), kv("Modalidad", (MODALIDADES[st.modalidad] || {}).nombre), kv("Precio total", totalTexto(st, calc))] }),
  ];
  if (st.tiposTrabajoV1) filasMeta.push(new d.TableRow({ children: [kv("Tipo de trabajo", TIPOS_TRABAJO[tipoTrabajo(st, cfg)].corto, 3)] }));
  filasMeta.push(new d.TableRow({ children: [kv("Proyecto", st.formatoObraV1 ? (textoObra(st) || st.proyecto) : st.proyecto, 3)] }));
  hijos.push(tabla(filasMeta));

  if (st.claridadV1) {
    var celdasRes = [par([t("RESUMEN DEL ACUERDO · LO IMPORTANTE EN 1 MINUTO", { b: true, font: TK, size: 16, color: CIAN, sp: 20 })], { after: 60, align: d.AlignmentType.LEFT })];
    resumenSimple(st, cfg).forEach(function (f) { celdasRes.push(par([t(f[0] + ": ", { b: true, size: 18 }), t(f[1], { size: 18 })], { after: 50, align: d.AlignmentType.LEFT })); });
    celdasRes.push(par([t(NOTA_RESUMEN, { size: 15, color: GRIS })], { after: 0, align: d.AlignmentType.LEFT }));
    var bordeCian = { style: d.BorderStyle.SINGLE, size: 10, color: "1CDADD" };
    hijos.push(par([t("")], { after: 60 }));
    hijos.push(tabla([new d.TableRow({ cantSplit: true, children: [celda(celdasRes, { fill: "F2FDFD" })] })], { borders: { top: bordeCian, bottom: bordeCian, left: bordeCian, right: bordeCian, insideHorizontal: sinBorde, insideVertical: sinBorde } }));
  }

  /* Partes */
  hijos.push(titulo("PARTES"));
  var prodFilas = [["Nombre legal", p.nombre], ["Nombre artístico", p.alias]];
  if (p.documento) prodFilas.push(["Documento", p.documento]);
  prodFilas.push(["IPI", p.ipi], ["Sociedad", p.pro]);
  if (p.mostrarEmpresa) prodFilas.push(["Sello", p.empresa + (p.empresaNota ? " " + p.empresaNota : "")]);
  prodFilas.push(["Email", p.email], ["WhatsApp", p.whatsapp], ["Domicilio", p.ciudad]);
  var cliFilas;
  if (st.tipoCliente === "sello") cliFilas = [["Razón social", c.razon], ["Nombre comercial", c.artistico], ["RUT / Registro", c.documento], ["Representante", c.representante], ["Cargo", c.cargo], ["Doc. representante", c.repDocumento]];
  else if (st.tipoCliente === "duo") cliFilas = [[st.tiposV2 ? "Nombre de la agrupación" : "Nombre del grupo", c.artistico || c.razon], ["Representante operativo", c.representante], ["Integrantes", (st.artistas || []).length + " (ver Anexo A)"]];
  else if (st.tipoCliente === "colab") cliFilas = [["Crédito de los artistas", c.artistico || listaArtistasCredito(st)], ["Representante operativo", c.representante], ["Artistas", (st.artistas || []).length + " (ver Anexo A)"]];
  else cliFilas = [["Nombre legal", c.razon], ["Nombre artístico", c.artistico], ["Documento", c.documento]];
  cliFilas.push(["Email", c.email], ["Teléfono", c.telefono]);
  if (!st.partesV2) cliFilas.push(["País / Domicilio", c.domicilio]);
  cliFilas = filasParteCliente(st) || cliFilas;
  function listaKV(filas) {
    return filas.map(function (f) {
      return par([t(f[0] + ": ", { size: 16, color: GRIS }), t(relleno(f[1], "__________"), { size: 17, b: true })], { after: 20, align: d.AlignmentType.LEFT });
    });
  }
  var tituloCli = "EL CLIENTE · " + tituloParteCliente(st);
  hijos.push(tabla([
    new d.TableRow({ children: [
      celda(par([t("EL PRODUCTOR · " + p.alias, { b: true, font: TK, size: 15, color: "1CDADD", sp: 20 })], { after: 0 }), { fill: NEGRO, w: 50 }),
      celda(par([t(tituloCli, { b: true, font: TK, size: 15, color: "1CDADD", sp: 20 })], { after: 0 }), { fill: NEGRO, w: 50 }),
    ] }),
    new d.TableRow({ children: [celda(listaKV(prodFilas)), celda(listaKV(cliFilas))] }),
  ]));

  /* Cláusulas */
  clausulasActivas(st, cfg).forEach(function (cl, i) {
    hijos.push(titulo((i + 1) + ". " + cl.titulo));
    bloques(resolverTexto(cl.texto, vals)).forEach(function (b) { hijos.push(b); });
  });

  function anexo(tag, nombre, seguido) {
    return par([t(" " + tag + " ", { b: true, font: TK, size: 18, color: "1CDADD", sp: 30 }), t("   " + nombre, { b: true, font: TK, size: 21, sp: 12 })],
      { salto: !seguido, before: seguido ? 360 : 0, after: 120, keepNext: true, align: d.AlignmentType.LEFT });
  }

  function subAnexo(txt) {
    return par([t(txt, { b: true, font: TK, size: 18, sp: 16 })], { before: 200, after: 60, keepNext: true, align: d.AlignmentType.LEFT });
  }

  /* Anexo A */
  var servicio = esServicio(st, cfg);
  hijos.push(anexo("ANEXO A", servicio ? "ARTISTAS Y FIRMANTES" : "ARTISTAS, AUTORES Y FIRMANTES"));
  hijos.push(par([t(introAnexoA(st, cfg), { size: 17, color: GRIS })]));
  var conEmail = !!st.anexoEmail, colComp = conEmail ? 6 : 5;
  function conMail(celdas, mail) { if (conEmail) celdas.splice(4, 0, mail); return celdas; }
  function tablaMaster() {
    var filasM = [filaHead(["Titular", "Calidad", "Master"])];
    filasMaster(st, cfg).forEach(function (f) { filasM.push(filaSimple([f.titular, f.calidad, f.pct + " %"], { der: [2] })); });
    filasM.push(filaSimple(["TOTAL MASTER", "", "100 %"], { b: true, der: [2] }));
    return tabla(filasM);
  }
  if (servicio) {
    hijos.push(subAnexo("1 · ARTISTAS"));
    var filasS = [filaHead(conMail(["#", "Nombre legal", "Nombre artístico", "Documento", "Rol", "Firma"], "Email"))];
    (st.artistas || []).forEach(function (a, i) {
      filasS.push(filaSimple(conMail([String(i + 1), relleno(a.nombre, "_______"), relleno(a.artistico, "_______"), relleno(a.documento, "_____"), relleno(a.rol, "_____"),
        st.tipoCliente === "individual" ? "Como cliente" : a.firma ? "Requerida" : "No aplica"], relleno(a.email, "_______")), { fill: i % 2 ? SUAVE : undefined }));
    });
    filasS.push(filaSimple(conMail(["P", p.nombre, p.alias, p.documento || "—", rolProductorServicio(st, cfg), "Como productor"], p.email || "")));
    hijos.push(tabla(filasS));
    hijos.push(subAnexo("2 · MASTER (LA GRABACIÓN · FONOGRAMA)"));
    hijos.push(tablaMaster());
    hijos.push(par([etiqueta("Resumen de derechos · servicio técnico de audio")], { before: 160, after: 40, keepNext: true }));
    resumenDerechos(st, cfg).forEach(function (r) { hijos.push(par([t(r[0] + ": ", { b: true, size: 18 }), t(r[1], { size: 18 })], { after: 40 })); });
  } else {
    var filasA = [filaHead(conMail(["#", "Nombre legal", "Nombre artístico", "Documento", "Rol", "Comp.", "Firma"], "Email"))];
    (st.artistas || []).forEach(function (a, i) {
      filasA.push(filaSimple(conMail([String(i + 1), relleno(a.nombre, "_______"), relleno(a.artistico, "_______"), relleno(a.documento, "_____"), relleno(a.rol, "_____"), (Number(a.comp) || 0) + " %",
        st.tipoCliente === "individual" ? "Como cliente" : a.firma ? "Requerida" : "No aplica"], relleno(a.email, "_______")), { der: [colComp], fill: i % 2 ? SUAVE : undefined }));
    });
    filasA.push(filaSimple(conMail(["P", p.nombre, p.alias, "IPI " + p.ipi, "Productor", (Number(st.productorComp) || 0) + " %", "Como productor"], p.email || ""), { der: [colComp] }));
    filasA.push(filaSimple(conMail(["", "TOTAL COMPOSICIÓN", "", "", "", calc.composicion + " %", ""], ""), { b: true, der: [colComp] }));
    if (st.repartoMasterV1) hijos.push(subAnexo("1 · COMPOSICIÓN (LA CANCIÓN · DERECHOS DE AUTOR)"));
    hijos.push(tabla(filasA));
    if (st.repartoMasterV1) {
      hijos.push(subAnexo("2 · MASTER (LA GRABACIÓN · FONOGRAMA)"));
      hijos.push(tablaMaster());
    }
    if (st.resumenDerechos) {
      hijos.push(par([etiqueta("Resumen de derechos · el Master y la composición son independientes")], { before: 160, after: 40, keepNext: true }));
      resumenDerechos(st, cfg).forEach(function (r) { hijos.push(par([t(r[0] + ": ", { b: true, size: 18 }), t(r[1], { size: 18 })], { after: 40 })); });
    }
    if (st.bmi200) {
      hijos.push(par([t("REGISTRO ANTE BMI / SOCIEDAD DE GESTIÓN (SISTEMA 200 %)", { b: true, font: TK, size: 18, sp: 16 })], { before: 200, after: 60, keepNext: true, align: d.AlignmentType.LEFT }));
      hijos.push(par([t("Mismo reparto de la composición, expresado como se registra en BMI: cada autor tiene su parte como autor (writer share) y la misma parte como editorial (publisher share). Autores 100 % + editoriales 100 % = 200 %.", { size: 17, color: GRIS })], { keepNext: true }));
      var filasR = [filaHead(["Autor (writer)", "IPI", "Sociedad", "Writer share", "Editorial (publisher)", "Publisher share"])];
      registroBMI(st, cfg).forEach(function (r, i) {
        filasR.push(filaSimple([relleno(r.autor, "_______"), relleno(r.ipi, "_____"), relleno(r.sociedad, "_____"), r.pct + " %", r.editorial || SIN_EDITORIAL, r.pct + " %"], { der: [3, 5], fill: i % 2 ? SUAVE : undefined }));
      });
      filasR.push(filaSimple(["TOTAL AUTORES / EDITORIALES", "", "", calc.composicion + " %", "", calc.composicion + " %"], { b: true, der: [3, 5] }));
      filasR.push(filaSimple(["TOTAL REGISTRO (WRITER + PUBLISHER)", "", "", "", "", Math.round(calc.composicion * 200) / 100 + " %"], { b: true, der: [5] }));
      hijos.push(tabla(filasR));
    }
  }
  if (st.tipoCliente !== "individual" && !(st.partesV3 && st.tipoCliente !== "sello")) hijos.push(par([etiqueta("Representante operativo: "), t(relleno(c.representante) + " · " + (st.partesV3 ? relleno(c.email, "email") : relleno(c.email || c.telefono, "email / WhatsApp")), { size: 18 })], { before: 120 }));

  /* Anexo B */
  hijos.push(anexo("ANEXO B", "SCHEDULE OF TRACKS / ORDEN DE TRABAJO"));
  hijos.push(par([t("Detalle de cada canción o servicio contratado. Nuevas canciones pueden sumarse con un nuevo Anexo B aceptado por escrito.", { size: 17, color: GRIS })]));
  var v2 = !!st.entregaV2;
  var colaVacia = v2 ? ["", "", ""] : ["", "", "", ""];
  var filasB = [filaHead(["#", etiquetaColPista(st), "Servicio", "Cant.", "Precio unit.", "Subtotal", "Rev."].concat(v2 ? ["Titular Master", "Fecha de entrega"] : ["Stems", "Titular Master", "Entrega"]))];
  (st.tracks || []).forEach(function (tr, i) {
    var s = servicioPorId(cfg, tr.servicio);
    var cant = Number(tr.cantidad) || 0;
    filasB.push(filaSimple([String(i + 1), textoCeldaNombre(st, cfg, tr), nombreServicio(cfg, tr), cant + " " + unidadConCantidad(unidadTrack(cfg, tr), cant),
      precioUnitarioTexto(tr, mon), subtotalTexto(tr, mon), String(Number(tr.revisiones) || 0)].concat(v2 ? [] : [tr.stems ? "Sí" : "No"]).concat([relleno(tr.titular, "_____"),
      tr.entrega ? formatoFecha(tr.entrega) : "_____"]), { der: [3, 4, 5], fill: i % 2 ? SUAVE : undefined }));
  });
  function filaTotal(etq, monto) { return filaSimple(["", etq, "", "", "", monto].concat(colaVacia), { b: true, der: [5] }); }
  if (calc.stems > 0) filasB.push(filaTotal("STEMS (ADICIONAL)", formatoMoneda(calc.stems, mon)));
  filasB.push(filaTotal("SUBTOTAL", formatoMoneda(calc.subtotal, mon)));
  if (calc.descuento > 0) filasB.push(filaTotal(calc.usarPaquete ? "AJUSTE PAQUETE" : "DESCUENTO " + (Number(st.descuento) || 0) + " %", "− " + formatoMoneda(calc.descuento, mon)));
  filasB.push(filaTotal("TOTAL", totalTexto(st, calc)));
  hijos.push(tabla(filasB));
  notasPrecioAnexoB(st).forEach(function (n) {
    hijos.push(par([t(n, { size: 17, color: GRIS })], { before: 80 }));
  });
  if (muestraDerechosPorPista(st, cfg)) {
    var aliasDer = cfg.productor.alias || "EL PRODUCTOR";
    var artDer = nombreTitularCorto(st);
    hijos.push(subAnexo("DERECHOS POR CANCIÓN (MASTER Y COMPOSICIÓN SON INDEPENDIENTES)"));
    hijos.push(par([t("Cada remake o canción puede tener un porcentaje distinto. Si esta tabla indica un % diferente al del Anexo A o a las cláusulas generales, rige esta tabla solo para esa canción. El Master y la composición no se mezclan.", { size: 17, color: GRIS })]));
    var filasDer = [filaHead(["#", etiquetaColPista(st), "Servicio", "Master " + aliasDer, "Master " + artDer, "Comp. " + aliasDer, "Comp. " + artDer])];
    filasDerechosPista(st, cfg).forEach(function (f, i) {
      if (!f.aplica) filasDer.push(filaSimple([String(f.n), f.nombre, f.servicio, "No aplica (servicio técnico)", "", "", ""], { fill: i % 2 ? SUAVE : undefined }));
      else filasDer.push(filaSimple([String(f.n), f.nombre, f.servicio, pctEsp(f.masterProd), pctEsp(f.masterArt), pctEsp(f.compProd), pctEsp(f.compArt)], { der: [3, 4, 5, 6], fill: i % 2 ? SUAVE : undefined }));
    });
    hijos.push(tabla(filasDer));
  }
  if (st.detalleV2) {
    hijos.push(par([t("DETALLE DE LOS SERVICIOS", { b: true, font: TK, size: 18, sp: 16 })], { before: 200, after: 60, keepNext: true, align: d.AlignmentType.LEFT }));
    var filasD = [filaHead(["#", etiquetaColPista(st), st.alcanceV1 ? "Paquete (incluye / no incluye)" : "Qué incluye", "Especificaciones"])];
    (st.tracks || []).forEach(function (tr, i) {
      filasD.push(filaSimple([String(i + 1), textoRefPista(st, cfg, tr), st.alcanceV1 ? textoAlcance(cfg, tr) : (incluyeServicio(cfg, tr) || "Según lo acordado"), especificacionesServicio(tr) || "—"], { fill: i % 2 ? SUAVE : undefined }));
    });
    hijos.push(tabla(filasD));
  }
  if (v2) {
    hijos.push(par([t("FORMATO DE ENTREGA", { b: true, font: TK, size: 18, sp: 16 })], { before: 200, after: 60, keepNext: true, align: d.AlignmentType.LEFT }));
    var filasE = [filaHead(["#", etiquetaColPista(st), "Qué se entrega", "Formato de audio", "Stems (instrumental por partes)"])];
    (st.tracks || []).forEach(function (tr, i) {
      var e = detalleEntrega(st, cfg, tr);
      filasE.push(filaSimple([String(i + 1), textoRefPista(st, cfg, tr), e.contenido, e.formato, e.stems], { fill: i % 2 ? SUAVE : undefined }));
    });
    hijos.push(tabla(filasE));
  }
  hijos.push(par([etiqueta("Modalidad de transferencia del Master: "), t(ACTIVACIONES[st.activacion] || "", { size: 18 })], { before: 120 }));
  var rm = repartoMaster(st, cfg);
  if (rm) hijos.push(par([etiqueta("Regalías del Master (ingresos netos): "), t(rm, { size: 18 })]));
  if (st.condicionEspecial) hijos.push(par([etiqueta("Condición especial: "), t(st.condicionEspecial, { size: 18 })]));

  /* Anexo C */
  hijos.push(anexo("ANEXO C", "CONDICIONES ECONÓMICAS, ENTREGA Y ARCHIVOS", true));
  hijos.push(tabla([
    new d.TableRow({ children: [kv("Precio total del proyecto", totalTexto(st, calc)), kv("Moneda", mon)] }),
    new d.TableRow({ children: [kv("Pago inicial (" + (Number(st.anticipoPct) || 0) + " %)", formatoMoneda(calc.anticipo, mon)), kv("Saldo", formatoMoneda(calc.saldo, mon))] }),
  ].concat(estadoPagos(st, calc).alguno ? [new d.TableRow({ children: [kv("Estado de pagos", lineaEstadoPagos(st, calc), 2)] })] : []).concat(
    aplicaPlazoSaldo(st, calc) ? [new d.TableRow({ children: [kv("Plazo del saldo", frasePlazoSaldo(st) + " desde el aviso de que los archivos están listos. Contra entrega: sin pago no hay WAV ni Master.", 2)] })] : []
  ).concat([
    new d.TableRow({ children: [kv("Tarifa de stems", st.entregaV2 ? textoTarifaStems(st, calc) : relleno(st.stemsTarifa, "No aplica")), kv("Custodia de sesiones", vals.custodia)] }),
    new d.TableRow({ children: [kv("Recuperación posterior", relleno(st.recuperacion, "A cotizar")), kv("Plazo estimado", vals.plazo)] }),
    new d.TableRow({ children: [kv("Forma de pago", st.formaPago, 2)] }),
    new d.TableRow({ children: [kv("Observaciones", relleno(st.observaciones, "—"), 2)] }),
  ])));

  /* Anexo D */
  hijos.push(anexo("ANEXO D", "FIRMAS"));
  hijos.push(par([t("Al firmar, cada parte declara haber leído y aceptado íntegramente este acuerdo y sus anexos. Las firmas electrónicas quedan registradas con fecha, hora, dispositivo y el código de verificación del documento.", { size: 17, color: GRIS })]));
  var lista = firmantes(st, cfg);
  async function cajaFirma(f) {
    var fi = (st.firmas || {})[f.key];
    var partes = [par([t(f.rol, { b: true, font: TK, size: 15, color: CIAN, sp: 20 })], { after: 40, align: d.AlignmentType.LEFT })];
    if (fi && fi.img) partes.push(par([await imagenDocx(fi.img, 55, 200)], { align: d.AlignmentType.CENTER, after: 0 }));
    else partes.push(par([t(" ")], { after: 600 }));
    partes.push(par([t("")], { after: 60, border: { top: { style: d.BorderStyle.SINGLE, size: 6, color: NEGRO, space: 1 } } }));
    var filas = [["Nombre", (fi && fi.nombre) || f.nombre + (f.alias ? " (" + f.alias + ")" : "")]];
    if (f.cargo) filas.push([f.key === "productor" ? "Sello" : "Cargo/Rol", f.cargo]);
    filas.push(["Documento", (fi && fi.documento) || f.documento]);
    if (f.key === "productor") filas.push(["IPI / " + (p.pro || "PRO"), p.ipi]);
    filas.push(["Email", (fi && fi.email) || f.email], ["Fecha", fi && fi.fecha ? fechaHoraLocal(fi.fecha) : "____ / ____ / ______"]);
    listaKV(filas).forEach(function (x) { partes.push(x); });
    if (fi && fi.fecha) partes.push(par([t("Firmado electrónicamente · Código del documento: " + (fi.hash || "").slice(0, 16), { size: 14, color: CIAN })], { before: 60, after: 0 }));
    return celda(partes, { w: 50 });
  }
  var filasD = [];
  for (var i = 0; i < lista.length; i += 2) {
    var a = await cajaFirma(lista[i]);
    var b = lista[i + 1] ? await cajaFirma(lista[i + 1]) : celda(par([t("")]), { w: 50 });
    filasD.push(new d.TableRow({ cantSplit: true, children: [a, b] }));
  }
  hijos.push(tabla(filasD));

  var firmados = lista.filter(function (f) { return st.firmas && st.firmas[f.key] && st.firmas[f.key].fecha; });
  if (firmados.length) {
    hijos.push(titulo("REGISTRO DE FIRMA ELECTRÓNICA"));
    var filasR = [filaHead(["Firmante", "Documento", "Email", "Método", "Fecha y hora", "Dispositivo", "Código doc."])];
    firmados.forEach(function (f) {
      var fi = st.firmas[f.key];
      filasR.push(filaSimple([(fi.nombre || f.nombre) + " — " + f.rol, fi.documento || f.documento || "", fi.email || f.email || "", fi.metodo === "remota" ? "Remota" : "En pantalla",
        fechaHoraLocal(fi.fecha), fi.dispositivo || "", (fi.hash || "").slice(0, 16)]));
    });
    hijos.push(tabla(filasR));
  }
  hijos.push(par([t("Código de verificación del documento (SHA-256): " + (hash || "—"), { size: 14, color: GRIS })], { before: 200, align: d.AlignmentType.LEFT }));

  if (st.claridadV1 && st.guiaArtistas && !servicio) {
    var g = guiaArtistas(st, cfg);
    var tablaGuia = function (cab, filas) {
      return tabla([filaHead(cab)].concat(filas.map(function (f) {
        return new d.TableRow({ cantSplit: true, children: f.map(function (x, i) {
          return celda(par([t(x, { size: 17, b: i === 0 })], { after: 0, align: d.AlignmentType.LEFT }));
        }) });
      })));
    };
    var subG = function (s) { return par([t(s.toUpperCase(), { b: true, font: TK, size: 17, sp: 16 })], { before: 160, after: 60, keepNext: true, align: d.AlignmentType.LEFT }); };
    hijos.push(anexo("ANEXO E", "GUÍA PARA ARTISTAS: CÓMO REGISTRAR Y COBRAR TUS REGALÍAS"));
    hijos.push(par([t(g.intro, { size: 17, color: GRIS })]));
    hijos.push(subG("Las dos “bolsas” de dinero de una canción"), tablaGuia(["Bolsa", "Qué es"], g.bolsas));
    hijos.push(subG("Mapa del dinero: quién cobra qué"), tablaGuia(["Bolsa", "Herramienta", "Qué cobra", "En este proyecto"], g.mapa));
    hijos.push(subG("Opciones más usadas (elegí la que prefieras)"), tablaGuia(["Herramienta", "Opciones"], g.opciones));
    hijos.push(subG("Pasos recomendados"), par([t(g.minimo, { b: true, size: 18 })], { align: d.AlignmentType.LEFT }));
    g.pasos.forEach(function (x, i) { hijos.push(par([t((i + 1) + ". ", { b: true }), t(x)], { after: 50, align: d.AlignmentType.LEFT })); });
    if (g.productor) hijos.push(subG("Datos de " + (p.alias || "EL PRODUCTOR") + " para registrar la obra"), tablaGuia(["Dato", "Valor"], g.productor.map(function (f) { return [f[0], relleno(f[1], "—")]; })));
    hijos.push(subG("Glosario"), tablaGuia(["Término", "Significado"], g.glosario));
  }

  var pie = new d.Footer({ children: [new d.Paragraph({ tabStops: [{ type: d.TabStopType.RIGHT, position: 9600 }], children: [
    t(p.email + "  |  IPI " + p.ipi + "  |  " + p.web, { size: 14, color: "9AA4AD" }),
    new d.TextRun({ children: [new d.Tab(), "Página ", d.PageNumber.CURRENT, " de ", d.PageNumber.TOTAL_PAGES], size: 14, color: "9AA4AD", font: BODY }),
  ] })] });

  var documento = new d.Document({
    creator: p.alias, title: "Contrato " + st.id, description: "Acuerdo de producción musical",
    styles: { default: { document: { run: { font: BODY, size: 19 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1080, right: 1080, header: 500, footer: 500 } }, titlePage: true },
      headers: { default: new d.Header({ children: [new d.Paragraph({ tabStops: [{ type: d.TabStopType.RIGHT, position: 9600 }], children: [
        t((p.alias || "") + (p.mostrarEmpresa ? "  |  " + p.empresa : ""), { font: TK, size: 14, color: GRIS, sp: 30 }),
        new d.TextRun({ children: [new d.Tab(), st.id || ""], font: TK, size: 14, color: GRIS }),
      ] })] }), first: new d.Header({ children: [par([t("")], { after: 0 })] }) },
      footers: { default: pie, first: pie },
      children: hijos,
    }],
  });
  return d.Packer.toBlob(documento);
}
