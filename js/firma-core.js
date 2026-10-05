/* Funciones autónomas: se usan en el programa y también se copian tal cual
   dentro del archivo "para firmar" que se envía al cliente. No deben depender
   de nada externo. */

function sha256(texto) {
  var bytes = unescape(encodeURIComponent(texto));
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var l = bytes.length;
  var words = [];
  for (var i = 0; i < l; i++) words[i >> 2] |= (bytes.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
  words[(((l + 8) >> 6) + 1) * 16 - 1] = l * 8;
  var W = new Array(64);
  for (var j = 0; j < words.length; j += 16) {
    var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (var t = 0; t < 64; t++) {
      if (t < 16) W[t] = words[j + t] | 0;
      else {
        var x = W[t - 15], y = W[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ (~e & g);
      var t1 = (h + S1 + ch + K[t] + W[t]) | 0;
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var mj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  var hex = "";
  for (var k = 0; k < 8; k++) hex += ("00000000" + (H[k] >>> 0).toString(16)).slice(-8);
  return hex;
}

/* Texto normalizado del cuerpo del contrato (sin firmas), para calcular el código. */
function textoParaHash(raiz) {
  var cuerpo = raiz.querySelector("#contrato-cuerpo");
  if (!cuerpo) return "";
  return (cuerpo.textContent || "").replace(/\s+/g, " ").trim();
}

/* Panel de firma sobre un <canvas>: ratón, dedo o lápiz. */
function crearPadFirma(canvas) {
  var ctx = canvas.getContext("2d");
  var dibujando = false;
  var vacio = true;
  var ultimo = null;

  function ajustar() {
    var r = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var previa = vacio ? null : canvas.toDataURL();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0a1a2f";
    if (previa) {
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, r.width, r.height); };
      img.src = previa;
    }
  }

  function pos(ev) {
    var r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top, p: ev.pressure || 0.5 };
  }

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", function (ev) {
    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    dibujando = true;
    ultimo = pos(ev);
    ctx.beginPath();
    ctx.arc(ultimo.x, ultimo.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = "#0a1a2f";
    ctx.fill();
    vacio = false;
  });
  canvas.addEventListener("pointermove", function (ev) {
    if (!dibujando) return;
    var p = pos(ev);
    ctx.lineWidth = 1.6 + p.p * 1.6;
    ctx.beginPath();
    ctx.moveTo(ultimo.x, ultimo.y);
    ctx.quadraticCurveTo(ultimo.x, ultimo.y, (ultimo.x + p.x) / 2, (ultimo.y + p.y) / 2);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo = p;
  });
  function fin() { dibujando = false; }
  canvas.addEventListener("pointerup", fin);
  canvas.addEventListener("pointercancel", fin);
  canvas.addEventListener("pointerleave", fin);

  ajustar();
  window.addEventListener("resize", ajustar);

  return {
    limpiar: function () {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      vacio = true;
    },
    estaVacio: function () { return vacio; },
    ajustar: ajustar,
    /* PNG recortado al trazo, con fondo transparente. */
    imagen: function () {
      if (vacio) return null;
      var w = canvas.width, h = canvas.height;
      var datos = ctx.getImageData(0, 0, w, h).data;
      var minX = w, minY = h, maxX = 0, maxY = 0;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          if (datos[(y * w + x) * 4 + 3] > 10) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX <= minX || maxY <= minY) return null;
      var m = 8;
      minX = Math.max(0, minX - m); minY = Math.max(0, minY - m);
      maxX = Math.min(w, maxX + m); maxY = Math.min(h, maxY + m);
      var c2 = document.createElement("canvas");
      c2.width = maxX - minX; c2.height = maxY - minY;
      c2.getContext("2d").drawImage(canvas, minX, minY, c2.width, c2.height, 0, 0, c2.width, c2.height);
      return c2.toDataURL("image/png");
    },
  };
}

function describirDispositivo() {
  var ua = navigator.userAgent || "";
  var so = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Otro";
  var nav = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  return nav + " / " + so;
}

function fechaHoraLocal(iso) {
  var d = new Date(iso);
  var p = function (n) { return (n < 10 ? "0" : "") + n; };
  var off = -d.getTimezoneOffset();
  var tz = "UTC" + (off >= 0 ? "+" : "-") + p(Math.floor(Math.abs(off) / 60)) + ":" + p(Math.abs(off) % 60);
  return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + " (" + tz + ")";
}
