/*
 * Ponte tra l'app e il browser.
 *  - downloads: salva o condivide il PDF.
 *  - installazione: pulsante "Installa" e suggerimento per iPhone.
 *  - service worker: fa funzionare l'app anche senza rete.
 */
(function () {
  "use strict";

  function fail(code, message) { return { code: code, message: message || code }; }

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
    use: function (name) { return Promise.resolve(name === "downloads" ? downloads : null); }
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
