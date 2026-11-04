/*
 * Ponte tra l'app e il browser.
 *  - sample: l'analisi del testo. Con un indirizzo in config.js chiama il servizio (vedi README).
 *    Senza indirizzo c'è solo la demo, che risponde all'esempio incluso nell'app.
 *  - downloads: salva o condivide il PDF.
 *  - installazione: pulsante "Installa" e suggerimento per iPhone.
 *  - service worker: fa funzionare l'app anche senza rete.
 */
(function () {
  "use strict";

  var cfg = window.RIDER_CONFIG || {};
  var endpoint = String(cfg.aiEndpoint || "").trim();
  var token = String(cfg.appToken || "").trim();

  function fail(code, message) { return { code: code, message: message || code }; }

  /* ---------- Lettura tollerante del JSON ---------- */
  function parseJsonLoose(text) {
    var t = String(text || "").trim();
    try { return JSON.parse(t); } catch (e) {}
    var m = /```(?:json)?\s*([\s\S]*?)```/.exec(t);
    if (m) { try { return JSON.parse(m[1].trim()); } catch (e) {} }
    var a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
    throw fail("invalid_json");
  }

  /* ---------- Immagini: ridimensionate prima dell'invio ---------- */
  function shrinkImage(blob) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        var max = 1400, r = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * r));
        c.height = Math.max(1, Math.round(img.height * r));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve({ media_type: "image/jpeg", data: c.toDataURL("image/jpeg", 0.8).split(",")[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(fail("image_rejected")); };
      img.src = url;
    });
  }

  /* ---------- Analisi con il servizio ---------- */
  var live = {
    json: function (prompt, opts) {
      opts = opts || {};
      if (navigator.onLine === false) return Promise.reject(fail("offline"));
      var imgs = Array.prototype.slice.call(opts.images || []).slice(0, 4);
      return Promise.all(imgs.map(shrinkImage)).then(function (images) {
        var ctl = new AbortController();
        var timer = setTimeout(function () { ctl.abort(); }, 90000);
        var headers = { "Content-Type": "application/json" };
        if (token) headers["x-app-token"] = token;
        return fetch(endpoint, { method: "POST", headers: headers, body: JSON.stringify({ prompt: prompt, images: images }), signal: ctl.signal })
          .then(function (res) {
            clearTimeout(timer);
            if (res.status === 429) throw fail("rate_limited");
            if (res.status === 401 || res.status === 403) throw fail("not_granted");
            if (!res.ok) throw fail("upstream_error");
            return res.json();
          }, function () { clearTimeout(timer); throw fail("offline"); });
      }).then(function (r) {
        if (!r || typeof r.text !== "string") throw fail("invalid_json");
        return parseJsonLoose(r.text);
      });
    },
    limits: function () {
      return Promise.resolve({ maxPromptBytes: 262144, images: { maxCount: 4, maxInputBytes: 20000000, mediaTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] } });
    }
  };

  /* ---------- Demo: solo per l'esempio incluso nell'app ---------- */
  function demoDate() {
    var now = new Date(), y = now.getFullYear();
    if (now > new Date(y, 10, 20, 23, 59)) y++;
    return y + "-11-20";
  }
  var demo = {
    demo: true,
    json: function (prompt) {
      if (String(prompt).indexOf("congresso di cardiologia") < 0) return Promise.reject(fail("none"));
      return Promise.resolve({
        valori: {
          tipo: "medico", data: demoDate(), location: "Centro Congressi di Modena", sala: "Sala plenaria", pax: "180",
          t_inizio: "09:00", t_fine: "17:30",
          mic: { Palmare: 3, "Tavolo / leggio": 6 },
          sorgenti: ["Slide (PowerPoint, Keynote)", "Video", "Slido o sondaggi dal vivo"],
          regia: "Lontana dal palco", centro_slide: "Sì", musica: "Sì",
          collegamento: "Videocall", direzione: "Monodirezionale: loro vedono e ascoltano solo noi"
        },
        dedotti: ["mic", "collegamento", "direzione"],
        non_capiti: [],
        note_extra: ""
      });
    },
    limits: function () { return Promise.resolve({ maxPromptBytes: 262144 }); }
  };

  /* ---------- Salvataggio del PDF ---------- */
  function mime(name) { return /\.pdf$/i.test(name) ? "application/pdf" : "application/octet-stream"; }
  function anchorSave(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
    return { status: "saved" };
  }
  var downloads = {
    save: function (req) {
      var blob = req.data instanceof Blob ? req.data : new Blob([req.data], { type: mime(req.filename) });
      var touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      var file = null;
      try { file = new File([blob], req.filename, { type: blob.type }); } catch (e) {}
      /* Sul telefono si apre il foglio di condivisione: da lì il PDF va su WhatsApp, mail o file. */
      if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: req.filename }).then(function () { return { status: "saved" }; }, function (err) {
          if (err && err.name === "AbortError") throw fail("declined");
          return anchorSave(blob, req.filename);
        });
      }
      try { return Promise.resolve(anchorSave(blob, req.filename)); } catch (e) { return Promise.reject(fail("unavailable")); }
    }
  };

  window.claude = {
    use: function (name) {
      if (name === "sample") return Promise.resolve(endpoint ? live : demo);
      if (name === "downloads") return Promise.resolve(downloads);
      return Promise.resolve(null);
    }
  };

  /* ---------- Installazione ---------- */
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  var deferred = null;
  var btn = document.getElementById("installBtn");
  var hint = document.getElementById("installHint");

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferred = e;
    if (btn && !standalone) btn.hidden = false;
  });
  window.addEventListener("appinstalled", function () { deferred = null; if (btn) btn.hidden = true; });
  if (btn) btn.addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; btn.hidden = true; }, function () {});
  });

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var dismissed = false;
  try { dismissed = localStorage.getItem("rider-evento-ios-hint") === "1"; } catch (e) {}
  if (hint && isIOS && !standalone && !dismissed) {
    hint.innerHTML = '<span>Per installarla su iPhone: tocca Condividi, poi "Aggiungi a Home".</span><button class="btn quiet small" type="button" id="hintClose">Ok</button>';
    hint.hidden = false;
    document.getElementById("hintClose").addEventListener("click", function () {
      hint.hidden = true;
      try { localStorage.setItem("rider-evento-ios-hint", "1"); } catch (e) {}
    });
  }

  /* ---------- Funzionamento offline ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
