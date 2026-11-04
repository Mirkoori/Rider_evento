(function () {
  var KEY = "rider-evento-v2";
  var TIPI = {
    aziendale: { nome: "Aziendale", desc: "Convention, cene di gala, presentazioni" },
    medico: { nome: "Medico", desc: "Congressi, corsi, sale parallele" },
    universitario: { nome: "Universitario", desc: "Aule, seminari, lauree" }
  };
  var TABS = [["avanzata", "Compila"], ["scheda", "Scheda"]];

  var EVENT_GROUPS = [
    { title: "Evento", fields: [
      { k: "nome", label: "Nome evento", t: "text", ph: "Es. Convegno annuale" },
      { k: "agenzia", label: "Agenzia / cliente", t: "text" },
      { k: "data", label: "Data", t: "date" },
      { k: "pax", label: "Partecipanti", t: "text", num: true, unit: "persone" }
    ]},
    { title: "Dove", fields: [
      { k: "location", label: "Location", t: "text" },
      { k: "sala", label: "Sala", t: "text" }
    ]},
    { title: "Referente", fields: [
      { k: "ref", label: "Nome", t: "text" },
      { k: "tel", label: "Telefono", t: "tel" }
    ]},
    { title: "Orari", fields: [
      { k: "t_mont", label: "Inizio montaggio", t: "time" },
      { k: "t_inizio", label: "Inizio evento", t: "time" },
      { k: "t_fine", label: "Fine evento", t: "time" },
      { k: "t_smont", label: "Fine smontaggio", t: "time" }
    ]}
  ];

  /* Vero se in sala c'è già l'attrezzatura indicata (voce che inizia con k). */
  function sala(d, k) {
    return d.insala_sn === "Sì" && Array.isArray(d.insala) && d.insala.some(function (o) { return o.indexOf(k) === 0; });
  }

  var SECTIONS = [
    { id: "insala", title: "Già presente in sala", fields: [
      { k: "insala_sn", label: "In sala c'è già attrezzatura da usare?", t: "yn" },
      { k: "insala", label: "Cosa c'è già", t: "multi", opts: ["Mixer audio", "Impianto di diffusione (casse)", "Microfoni", "Proiettore e telo", "Videowall o schermi", "Regia video (mixer video)", "Luci", "Rete cablata o Wi-Fi"], when: function (d) { return d.insala_sn === "Sì"; } }
    ]},
    { id: "audio", title: "Audio", fields: [
      { k: "mic", label: "Microfoni: quanti e quali", t: "count", opts: ["Palmare / gelato a filo", "Palmare / gelato radio", "Archetto radio", "Da tavolo a filo"] },
      { k: "amplificazione", label: "Serve impianto di amplificazione?", t: "yn", when: function (d) { return !sala(d, "Impianto"); } },
      { k: "persone_audio", label: "Persone da coprire (per calcolare le casse)", t: "text", num: true, unit: "persone", ph: "Se vuoto uso i partecipanti", when: function (d) { return d.amplificazione === "Sì" && !sala(d, "Impianto"); }, skipIf: function (d) { return !!d.pax; } },
      { k: "n_casse", label: "Numero di casse (se già deciso)", t: "text", num: true, when: function (d) { return d.amplificazione === "Sì" && !sala(d, "Impianto"); } },
      { k: "musica", label: "Musica di sottofondo", t: "yn" },
      { k: "traduzione", label: "Traduzione simultanea", t: "yn" },
      { k: "registrazione", label: "Registrazione", t: "yn" }
    ]},
    { id: "regia", title: "Regia e video", fields: [
      { k: "sorgenti", label: "Sorgenti video", t: "multi", opts: ["Slide (PowerPoint, Keynote)", "Video", "Slido o sondaggi dal vivo", "Sito o demo dal vivo", "Grafiche e sottopancia", "Timer relatori"] },
      { k: "transizioni", label: "Transizioni pulite tra le sorgenti (senza vedere i cambi, richiede mixer video)", t: "yn",
        when: function (d) { return (Array.isArray(d.sorgenti) && d.sorgenti.length >= 2) || d.collegamento === "Streaming" || d.collegamento === "Videocall" || d.primi_piani === "Sì" || !!d.camera; } },
      { k: "primi_piani", label: "Primi piani sugli schermi in sala", t: "yn" },
      { k: "regia", label: "Regia", t: "select", opts: ["Vicina al palco", "Lontana dal palco"] },
      { k: "schermo", label: "Schermo principale", t: "select", opts: ["Proiettore della sala", "Proiettore nostro", "Videowall LED"] },
      { k: "schermi_extra", label: "Altri schermi: quanti e quali", t: "count", opts: ["TV ai lati del palco", "TV in altre aree (foyer, ingresso, altre sale)", "Monitor di rimando per i relatori", "Monitor di rimando per i moderatori", "Gobbo"] },
      { k: "visuale", label: "Cosa vede il relatore", t: "select", opts: ["Visuale relatore (slide, note, slide successiva)", "Copia della sala"] },
      { k: "avanzatore", label: "Avanzatore slide (telecomando)", t: "yn" },
      { k: "centro_slide", label: "Centro slide (carico le slide mentre le altre sono in onda)", t: "yn" },
    ]},
    { id: "collegamenti", title: "Streaming e videocall", fields: [
      { k: "collegamento", label: "Collegamento", t: "select", opts: ["Nessuno", "Streaming", "Videocall"] },
      { k: "direzione", label: "Videocall: direzione", t: "select", opts: ["Bidirezionale (ci vediamo e ci sentiamo a vicenda)", "Monodirezionale: loro vedono e ascoltano solo noi", "Monodirezionale: un ospite si collega per parlare, senza vedere né sentire noi"], when: function (d) { return d.collegamento === "Videocall"; } },
      { k: "piattaforma", label: "Piattaforma", t: "select", opts: ["Zoom", "Teams", "Meet", "YouTube", "Altra"], when: function (d) { return d.collegamento === "Streaming" || d.collegamento === "Videocall"; } },
      { k: "camera", label: "Ripresa dei relatori (in base al budget)", t: "select", opts: ["Webcam", "Camera PTZ telecomandata", "Camera con operatore"], when: function (d) { return d.collegamento === "Streaming" || d.collegamento === "Videocall" || d.primi_piani === "Sì"; } }
    ]},
    { id: "palco", title: "Palco e luci", fields: [
      { k: "palcoluci", label: "Servono palco o luci?", t: "yn" },
      { k: "palco", label: "Palco (dimensioni)", t: "text", ph: "Es. 6 x 3 m", when: function (d) { return d.palcoluci === "Sì"; } },
      { k: "luci", label: "Luci", t: "select", opts: ["Solo ambiente", "Ambiente e scena"], when: function (d) { return d.palcoluci === "Sì"; } }
    ]},
    { id: "altro", title: "Altro", fields: [
      { k: "ospite", label: "Intrattenimento o ospite musicale", t: "yn", types: ["aziendale"] },
      { k: "sale_par", label: "Sale parallele", t: "text", num: true, unit: "sale", types: ["medico"] },
      { k: "aula", label: "Aula già attrezzata", t: "yn", types: ["universitario"] },
      { k: "quota", label: "Lavori in quota", t: "yn" },
      { k: "logistica_note", label: "Note", t: "area" }
    ]}
  ];

  /* Domande da fare per prime se mancano, in ordine di importanza (massimo 4 per volta). */
  function blank() {
    return { tipo: "", nome: "", agenzia: "", data: "", pax: "", location: "", sala: "", ref: "", tel: "",
      t_mont: "", t_inizio: "", t_fine: "", t_smont: "" };
  }

  var d, tab = "avanzata", toastTimer = null, resetTimer = null, resetArmed = false;
  try { var raw = localStorage.getItem(KEY); if (raw) d = JSON.parse(raw); } catch (e) {}
  if (!d || typeof d !== "object") d = blank();
  var prevD = null, noticeTimer = null;

  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var st = $("#saveState");
      try { localStorage.setItem(KEY, JSON.stringify(d)); st.textContent = "Salvato sul dispositivo"; }
      catch (e) { st.textContent = "Memoria piena"; }
    }, 350);
  }
  function persistNow() {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    $("#saveState").textContent = "Bozza";
  }

  function allFields() {
    var a = [];
    EVENT_GROUPS.forEach(function (g) { a = a.concat(g.fields); });
    SECTIONS.forEach(function (s) { a = a.concat(s.fields); });
    return a;
  }
  function fieldByKey(k) { return allFields().filter(function (f) { return f.k === k; })[0]; }
  function visible(f) {
    if (f.types && f.types.indexOf(d.tipo) < 0) return false;
    if (f.when && !f.when(d)) return false;
    return true;
  }
  function isEmpty(v) {
    if (v == null || v === "") return true;
    if (Array.isArray(v)) return !v.length;
    if (typeof v === "object") return !Object.keys(v).some(function (k) { return v[k] > 0; });
    return false;
  }
  function fmt(f, v) {
    if (f.t === "count") {
      if (!v || typeof v !== "object" || Array.isArray(v)) return "";
      return f.opts.filter(function (o) { return v[o] > 0; }).map(function (o) { return o + " × " + v[o]; }).join(", ");
    }
    if (Array.isArray(v)) return v.join(", ");
    if (v && f.unit) return v + " " + f.unit;
    return v || "";
  }
  function fmtDate(s) {
    if (!s) return "";
    var p = s.split("-");
    var dt = new Date(+p[0], +p[1] - 1, +p[2]);
    if (isNaN(dt)) return s;
    return dt.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  /* ---------- Campi ---------- */
  function fieldHTML(f) {
    var v = d[f.k], id = "f_" + f.k;
    if (f.t === "yn") {
      return '<div class="f"><span class="l">' + esc(f.label) + '</span><div class="seg">' +
        ["Sì", "No"].map(function (o) { return '<button type="button" data-yn="' + f.k + '" data-v="' + o + '" aria-pressed="' + (v === o) + '">' + o + "</button>"; }).join("") + "</div></div>";
    }
    if (f.t === "multi") {
      var cur = Array.isArray(v) ? v : [];
      return '<div class="f"><span class="l">' + esc(f.label) + '</span><div class="seg">' +
        f.opts.map(function (o) { return '<button type="button" class="chip" data-multi="' + f.k + '" data-v="' + esc(o) + '" aria-pressed="' + (cur.indexOf(o) >= 0) + '">' + esc(o) + "</button>"; }).join("") + "</div></div>";
    }
    if (f.t === "count") {
      var cc = v && typeof v === "object" && !Array.isArray(v) ? v : {};
      return '<div class="f"><span class="l">' + esc(f.label) + '</span><div class="counts">' +
        f.opts.map(function (o) {
          return '<div class="cnt"><span>' + esc(o) + '</span><div class="step"><button type="button" data-cnt="' + f.k + '" data-o="' + esc(o) + '" data-dl="-1" aria-label="Meno ' + esc(o) + '">&minus;</button><output>' + (cc[o] || 0) +
            '</output><button type="button" data-cnt="' + f.k + '" data-o="' + esc(o) + '" data-dl="1" aria-label="Più ' + esc(o) + '">+</button></div></div>';
        }).join("") + "</div></div>";
    }
    if (f.t === "select") {
      return '<label class="f" for="' + id + '"><span class="l">' + esc(f.label) + '</span><select id="' + id + '" data-k="' + f.k + '"><option value="">Scegli</option>' +
        f.opts.map(function (o) { return "<option" + (v === o ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select></label>";
    }
    if (f.t === "area") {
      return '<label class="f" for="' + id + '"><span class="l">' + esc(f.label) + '</span><textarea id="' + id + '" data-k="' + f.k + '">' + esc(v || "") + "</textarea></label>";
    }
    var type = f.t === "date" || f.t === "time" || f.t === "tel" ? f.t : "text";
    return '<label class="f" for="' + id + '"><span class="l">' + esc(f.label) + '</span><input id="' + id + '" class="' + (f.num ? "mono" : "") + '" type="' + type + '" data-k="' + f.k + '"' +
      (f.num ? ' inputmode="numeric"' : "") + ' value="' + esc(v || "") + '" placeholder="' + esc(f.ph || "") + '"></label>';
  }
  function isWide(f) { return f.t === "multi" || f.t === "area" || f.t === "yn" || f.t === "count" || f.t === "select" && f.label.length > 26; }
  function cell(f) { return isWide(f) ? '<div class="wide">' + fieldHTML(f) + "</div>" : fieldHTML(f); }

  function tipoHTML(label) {
    return '<div class="f wide"><span class="l">' + esc(label) + '</span><div class="tipo">' +
      Object.keys(TIPI).map(function (k) { return '<button type="button" data-tipo="' + k + '" aria-pressed="' + (d.tipo === k) + '"><b>' + TIPI[k].nome + "</b><small>" + TIPI[k].desc + "</small></button>"; }).join("") + "</div></div>";
  }
  /* ---------- Compila ---------- */
  /* ---------- Importa da email o testo: riconoscimento con regole, tutto sul dispositivo ---------- */
  var MESI = { gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6, luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12 };
  var NUMERI = { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10 };
  var NUMRE = "\\d{1,2}|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci";
  var MICS = [
    ["Palmare / gelato a filo", "(?:palmar\\w*|gelat\\w*|a mano)\\s*(?:a\\s+)?(?:filo|cavo)"],
    ["Palmare / gelato radio", "(?:palmar\\w*|gelat\\w*|a mano)\\b(?!\\s*(?:a\\s+)?(?:filo|cavo))"],
    ["Archetto radio", "archett\\w*|headset|madonna"],
    ["Da tavolo a filo", "tavolo|leggio|collo d'oca|gooseneck"]
  ];
  function numVal(s) { return /^\d/.test(s) ? +s : (NUMERI[s] || 0); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function cap(s) { return s.replace(/\b([a-zà-ù])/g, function (m) { return m.toUpperCase(); }); }

  function importa(raw) {
    var found = {}, labels = [];
    var text = String(raw || "").replace(/\r/g, "").replace(/[ \t]+/g, " ");
    var low = text.toLowerCase();
    function put(k, v, label) {
      var cur = d[k];
      var empty = cur == null || cur === "" || (Array.isArray(cur) && !cur.length) || (typeof cur === "object" && !Array.isArray(cur) && !Object.keys(cur).some(function (o) { return cur[o]; }));
      if (!empty || v == null || v === "" || found[k]) return;
      d[k] = v; found[k] = 1; labels.push(label);
    }
    function addMulti(k, v, label) {
      var arr = Array.isArray(d[k]) ? d[k].slice() : [];
      if (arr.indexOf(v) >= 0) return;
      arr.push(v); d[k] = arr; labels.push(label);
    }

    /* Nome: riga "Oggetto" */
    var og = text.match(/^\s*(?:oggetto|subject)\s*:\s*(.+)$/im);
    if (og) put("nome", og[1].replace(/^((re|r|fwd?|i|inoltro)\s*:\s*)+/i, "").trim().slice(0, 80), "Nome evento");

    /* Data */
    var dataTxt = low, iso = "";
    var m1 = low.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})\b/);
    var m2 = low.match(/\b(\d{1,2})(?:°|º)?\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?\b/);
    var y = new Date().getFullYear();
    if (m1) {
      var yy = +m1[3]; if (yy < 100) yy += 2000;
      iso = yy + "-" + pad2(+m1[2]) + "-" + pad2(+m1[1]);
      dataTxt = dataTxt.replace(m1[0], " ");
    } else if (m2) {
      var mm = MESI[m2[2]], dd = +m2[1], yr = m2[3] ? +m2[3] : y;
      if (!m2[3] && new Date(yr, mm - 1, dd) < new Date(new Date().setHours(0, 0, 0, 0))) yr++;
      iso = yr + "-" + pad2(mm) + "-" + pad2(dd);
      dataTxt = dataTxt.replace(m2[0], " ");
    }
    if (iso && !isNaN(new Date(iso))) put("data", iso, "Data");

    /* Orari, frase per frase */
    dataTxt.split(/\n|;|,|\. (?=[a-z])/).forEach(function (cl) {
      var times = [], re = /\b(?:(?:ore|alle|dalle|dal|al|h|entro le|verso le|per le)\s*(\d{1,2})(?:[:.h](\d{2}))?|(\d{1,2})[:h.](\d{2}))(?!\d)/g, t;
      while ((t = re.exec(cl))) {
        var hh = +(t[1] || t[3]), mi = +(t[2] || t[4] || 0);
        if (hh <= 23 && mi <= 59) times.push(pad2(hh) + ":" + pad2(mi));
      }
      if (!times.length) return;
      if (/smontagg|disallest|ritiro/.test(cl)) put("t_smont", times[times.length - 1], "Fine smontaggio");
      else if (/montagg|allestim|carico|set-?up|prove|arrivo/.test(cl)) put("t_mont", times[0], "Inizio montaggio");
      else if (times.length >= 2) { put("t_inizio", times[0], "Inizio evento"); put("t_fine", times[1], "Fine evento"); }
      else if (/fine|termin|chiusur|conclu/.test(cl)) put("t_fine", times[0], "Fine evento");
      else put("t_inizio", times[0], "Inizio evento");
    });

    /* Partecipanti, telefono */
    var px = low.match(/(\d{2,4})\s*(?:persone|partecipanti|ospiti|pax|invitati|iscritti|studenti)/);
    if (px) put("pax", px[1], "Partecipanti");
    var tel = text.match(/(?:\+39[\s.]?)?\b3\d{2}[\s.\-]?\d{3}[\s.\-]?\d{3,4}\b/);
    if (tel) put("tel", tel[0].trim(), "Telefono");

    /* Luoghi e persone */
    var lo = text.match(/(?:location|luogo|sede)\s*:\s*([^\n]{3,70})/i) || text.match(/\b(?:presso|all['’]interno de[li]l?['’]?|c\/o)\s+((?:[A-ZÀ-Ù0-9][\wà-ù'’.&-]*\s?){1,6})/);
    if (lo) put("location", lo[1].replace(/[\s,.;]+$/, "").trim(), "Location");
    var sa = text.match(/\b(aula magna|auditorium|sala\s+[A-ZÀ-Ù][\wà-ù]+(?:\s+[A-ZÀ-Ù][\wà-ù]+)?|sala\s+\d+|aula\s+[A-Z0-9][\w]*)/i);
    if (sa) put("sala", /^aula magna$/i.test(sa[1]) ? "Aula Magna" : sa[1].replace(/\s+/g, " ").replace(/^./, function (c) { return c.toUpperCase(); }), "Sala");
    var rf = text.match(/(?:[Rr]eferente|[Cc]ontatto|[Pp]er informazioni|[Rr]esponsabile)\s*:?\s+([A-ZÀ-Ù][\wà-ù'’]+(?:\s+[A-ZÀ-Ù][\wà-ù'’]+){0,2})/);
    if (rf) put("ref", rf[1], "Referente");
    var ag = text.match(/\b[Aa]genzia\s*:?\s+([A-ZÀ-Ù][\wà-ù'’&-]*(?:\s+[A-ZÀ-Ù][\wà-ù'’&-]*){0,3})/);
    if (ag) put("agenzia", ag[1], "Agenzia");

    /* Tipo di evento */
    var sc = { medico: 0, universitario: 0, aziendale: 0 };
    (low.match(/medic|congresso|\becm\b|sanit|clinic|ospedal|farmac|chirurg/g) || []).forEach(function () { sc.medico++; });
    (low.match(/universit|ateneo|laurea|dipartimento|studenti|seminario|lezione|\baula\b/g) || []).forEach(function () { sc.universitario++; });
    (low.match(/aziend|convention|kick-?off|cena di gala|presentazione prodotto|team building|assemblea|dipendenti/g) || []).forEach(function () { sc.aziendale++; });
    var best = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; });
    if (sc[best[0]] > 0 && sc[best[0]] > sc[best[1]] && !d.tipo) { d.tipo = best[0]; labels.push("Tipo di evento"); }

    /* Microfoni, anche con i nomi in uso (gelato = palmare) */
    var mic = d.mic && typeof d.mic === "object" && !Array.isArray(d.mic) ? d.mic : {}, micNew = false;
    MICS.forEach(function (mt) {
      if (mic[mt[0]]) return;
      var a = new RegExp("\\b(" + NUMRE + ")\\s*(?:x\\s*)?(?:radio)?(?:microfon\\w*\\s*|mic\\s*)?(?:wireless\\s+|senza fili\\s+)?(?:a\\s+|ad\\s+|da\\s+)?(?:" + mt[1] + ")", "g");
      var b = new RegExp("(?:" + mt[1] + ")(?:\\s+(?:radio|wireless|senza fili))?\\s*[:(x×]\\s*(\\d{1,2})\\b", "g");
      var n = 0, r;
      while ((r = a.exec(low))) n = Math.max(n, numVal(r[1]));
      while ((r = b.exec(low))) n = Math.max(n, +r[1]);
      if (n > 0 && n < 50) { mic[mt[0]] = n; micNew = true; }
    });
    if (micNew) { d.mic = mic; labels.push("Microfoni"); }
    else {
      var gen = low.match(new RegExp("\\b(" + NUMRE + ")\\s*(?:radio)?microfon"));
      if (gen && !Object.keys(mic).some(function (o) { return mic[o]; })) labels.push("Microfoni (" + numVal(gen[1]) + " citati: scegli il tipo)");
    }

    /* Sorgenti video */
    [["Slide (PowerPoint, Keynote)", /powerpoint|\bslide\b|keynote|presentazion/], ["Video", /\bvideo\b|filmat|\bclip\b/],
     ["Slido o sondaggi dal vivo", /slido|sondagg|mentimeter|polling/], ["Sito o demo dal vivo", /\bsito\b|demo live|demo dal vivo/],
     ["Grafiche e sottopancia", /grafich|sottopancia|titoli/], ["Timer relatori", /timer|countdown/]
    ].forEach(function (s) { if (s[1].test(low)) addMulti("sorgenti", s[0], "Sorgenti video"); });

    /* Collegamenti, schermi, extra */
    if (/streaming|in diretta|diretta streaming|youtube|live stream/.test(low)) put("collegamento", "Streaming", "Collegamento");
    else if (/videocall|videochiamata|\bzoom\b|\bteams\b|google meet|da remoto|webinar|collegamento remoto/.test(low)) put("collegamento", "Videocall", "Collegamento");
    if (d.collegamento === "Streaming" || d.collegamento === "Videocall" || found.collegamento) {
      var pf = /\bzoom\b/.test(low) ? "Zoom" : /\bteams\b/.test(low) ? "Teams" : /google meet|\bmeet\b/.test(low) ? "Meet" : /youtube/.test(low) ? "YouTube" : "";
      if (pf) put("piattaforma", pf, "Piattaforma");
    }
    var ex = d.schermi_extra && typeof d.schermi_extra === "object" && !Array.isArray(d.schermi_extra) ? d.schermi_extra : {}, exNew = false;
    if (/gobbo|teleprompter/.test(low) && !ex["Gobbo"]) { ex["Gobbo"] = 1; exNew = true; }
    if (/tv ai lati|schermi laterali|monitor laterali|schermi ai lati/.test(low) && !ex["TV ai lati del palco"]) { ex["TV ai lati del palco"] = 2; exNew = true; }
    if (/monitor di rimando|confidence monitor|rimando relatori/.test(low) && !ex["Monitor di rimando per i relatori"]) { ex["Monitor di rimando per i relatori"] = 1; exNew = true; }
    if (exNew) { d.schermi_extra = ex; labels.push("Altri schermi"); }
    if (/traduzione simultanea|interpret|cuffie per la traduzione/.test(low)) put("traduzione", "Sì", "Traduzione");
    if (/registrazione|registrare|registrato/.test(low)) put("registrazione", "Sì", "Registrazione");
    if (/musica di sottofondo|sottofondo musical|\bmusica\b/.test(low)) put("musica", "Sì", "Musica");
    if (/avanzatore|clicker|telecomando per le slide|telecomando slide/.test(low)) put("avanzatore", "Sì", "Avanzatore");
    if (/centro slide|slide center/.test(low)) put("centro_slide", "Sì", "Centro slide");
    var pal = low.match(/\bpalco\b[^\n]{0,30}?(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/);
    if (pal) { put("palcoluci", "Sì", "Palco e luci"); put("palco", pal[1] + " x " + pal[2] + " m", "Dimensioni palco"); }
    else if (/\bpalco\b/.test(low)) put("palcoluci", "Sì", "Palco e luci");

    /* Attrezzatura già in sala */
    var si = [["Mixer audio", /(mixer|regia audio)[^\n.]{0,20}(della sala|present|in sala|esistent)/], ["Impianto di diffusione (casse)", /(impianto|casse|audio)[^\n.]{0,20}(della sala|presente|in sala|esistente)/],
      ["Microfoni", /microfoni[^\n.]{0,20}(della sala|present|in sala|esistent)/], ["Proiettore e telo", /(proiettore|videoproiettore)[^\n.]{0,20}(della sala|present|in sala|esistent)/]];
    var any = false;
    si.forEach(function (s) { if (s[1].test(low)) { addMulti("insala", s[0], "Già in sala: " + s[0]); any = true; } });
    if (any) d.insala_sn = "Sì";
    if (!d.amplificazione && /amplificazione|impianto audio|diffusione|\bcasse\b/.test(low) && !(any && /^Impianto/.test((d.insala || []).join("|")))) put("amplificazione", "Sì", "Amplificazione");

    return labels.filter(function (x, i) { return labels.indexOf(x) === i; });
  }

  /* Stima del tempo che resta da dedicare alla compilazione */
  function stima() {
    var sec = 0, left = 0;
    function empty(v) { return v == null || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).some(function (o) { return v[o]; })); }
    var fs = [];
    EVENT_GROUPS.forEach(function (g) { fs = fs.concat(g.fields); });
    SECTIONS.forEach(function (s) { fs = fs.concat(s.fields.filter(visible)); });
    if (!d.tipo) { sec += 3; left++; }
    fs.forEach(function (f) {
      if (f.t === "area" || (f.skipIf && f.skipIf(d)) || !empty(d[f.k])) return;
      left++; sec += (f.t === "text" || f.t === "tel" || f.t === "date" || f.t === "time") ? 8 : 4;
    });
    return { min: Math.max(1, Math.round(sec / 60)), left: left };
  }
  function tabAvanzata() {
    var h = '<div class="card"><h2>Hai una email o un testo?</h2><p class="hint">Incollalo qui: compilo quello che riconosco, senza toccare ciò che hai già scritto. Il testo resta sul dispositivo e non viene salvato.</p><textarea id="importText" placeholder="Incolla qui email, richiesta o appunti" aria-label="Email o testo da leggere"></textarea><button class="btn alt" type="button" data-act="import">Compila dal testo</button></div>';
    var st = stima();
    h = '<div class="card"><p class="est"><strong>' + (st.left ? "Tempo previsto: circa " + st.min + (st.min === 1 ? " minuto" : " minuti") : "Compilazione completata") + "</strong>" + (st.left ? " · " + st.left + " domande, quasi tutte da toccare. Puoi saltare quello che non serve." : "") + "</p></div>" + h;
    h += '<div class="card"><h2>Tipo di evento</h2><div class="grid">' + tipoHTML("") .replace('<span class="l"></span>', "") + "</div></div>";
    EVENT_GROUPS.forEach(function (g) {
      h += '<div class="card"><h2>' + g.title + '</h2><div class="grid">' + g.fields.map(fieldHTML).join("") + "</div></div>";
    });
    SECTIONS.forEach(function (s) {
      var fs = s.fields.filter(visible);
      if (!fs.length) return;
      h += '<div class="card"><h2>' + s.title + '</h2><div class="grid">' + fs.map(cell).join("") + "</div></div>";
    });
    return h + '<button class="btn" type="button" data-tab="scheda">Vedi la scheda</button>';
  }

  /* ---------- Scheda ---------- */
  function model() {
    var out = [];
    var ev = [["Evento", d.nome], ["Tipo", d.tipo ? TIPI[d.tipo].nome : ""], ["Agenzia / cliente", d.agenzia], ["Data", fmtDate(d.data)],
      ["Partecipanti", d.pax ? d.pax + " persone" : ""], ["Location", d.location], ["Sala", d.sala],
      ["Referente", [d.ref, d.tel].filter(Boolean).join(", ")], ["Inizio montaggio", d.t_mont], ["Inizio evento", d.t_inizio], ["Fine evento", d.t_fine], ["Fine smontaggio", d.t_smont]];
    out.push({ title: "Evento", rows: ev.filter(function (r) { return r[1]; }) });
    SECTIONS.forEach(function (s) {
      var rows = [];
      s.fields.filter(visible).forEach(function (f) { var v = fmt(f, d[f.k]); if (v) rows.push([f.label, v]); });
      if (rows.length) out.push({ title: s.title, rows: rows });
    });
    return out;
  }
  /* ---------- Dotazione suggerita: l'attrezzatura che l'app ricava dalle risposte, per i tecnici ---------- */
  function cntRe(k, re) {
    var v = d[k], n = 0;
    if (!v || typeof v !== "object" || Array.isArray(v)) return 0;
    Object.keys(v).forEach(function (o) { if (re.test(o)) n += +v[o] || 0; });
    return n;
  }
  function hasRe(k, re) { var v = d[k]; return Array.isArray(v) && v.some(function (o) { return re.test(o); }); }

  function dotazione() {
    var A = [], V = [], S = [], C = [], P = [], X = [];
    var palF = cntRe("mic", /Palmare.*filo/), palR = cntRe("mic", /Palmare.*radio/), arc = cntRe("mic", /Archetto/), tav = cntRe("mic", /tavolo/i);
    var wl = palR + arc, mics = wl + palF + tav;
    var slide = hasRe("sorgenti", /Slide/), video = hasRe("sorgenti", /^Video/), sito = hasRe("sorgenti", /Sito/),
      slido = hasRe("sorgenti", /Slido/), graf = hasRe("sorgenti", /Grafiche/), timer = hasRe("sorgenti", /Timer/);
    var pcAudio = slide || video || sito;
    var csl = d.centro_slide === "Sì", musica = d.musica === "Sì";
    var stream = d.collegamento === "Streaming", vcall = d.collegamento === "Videocall", coll = stream || vcall;
    var cam = d.camera || "";
    var tvL = cntRe("schermi_extra", /lati/), tvA = cntRe("schermi_extra", /altre aree/), mr = cntRe("schermi_extra", /relatori/),
      mm = cntRe("schermi_extra", /moderatori/), gob = cntRe("schermi_extra", /Gobbo/);
    var tvs = tvL + tvA + mr + mm;

    /* Audio */
    var ch = mics + (pcAudio ? 2 : 0) + (csl ? 2 : 0) + (musica ? 2 : 0) + (vcall ? 2 : 0);
    var mixSala = sala(d, "Mixer audio"), paSala = sala(d, "Impianto"), micSala = sala(d, "Microfoni");
    var chIn = mixSala && micSala ? ch - mics : ch; /* i microfoni della sala sono già sul loro mixer */
    if (chIn > 0) A.push(mixSala
      ? "Usiamo il mixer della sala: verificare modello e almeno " + chIn + " ingressi liberi (" + (micSala ? "PC, musica e collegamenti" : "microfoni, PC e musica") + ")"
      : "Mixer audio digitale con almeno " + (ch + 2) + " ingressi (microfoni, PC e scorta)");
    if (paSala && !mixSala && ch > 0) A.push("Collegamento dal nostro mixer all'impianto della sala: verificare ingressi e tipo di linea (XLR, jack o altro)");
    if (micSala && mics > 0) A.push("Microfoni forniti dalla sala: " + fmt(fieldByKey("mic"), d.mic) + ". Verificare tipo, funzionamento e batterie");
    else {
      if (palR) A.push("Microfoni palmari radio × " + palR + ", con clip e aste");
      if (palF) A.push("Microfoni palmari a filo × " + palF + ", con cavi XLR e aste");
      if (arc) A.push("Microfoni ad archetto radio × " + arc);
      if (tav) A.push("Microfoni da tavolo a filo × " + tav + ", con basi, aste e cavi XLR");
      if (wl) {
        A.push("Ricevitori wireless × " + wl + ", con antenne e distribuzione RF (frequenze da coordinare con la sala)");
        A.push("Batterie di scorta e caricabatterie per tutti i trasmettitori");
      }
    }
    var pcs = (pcAudio ? 1 : 0) + (csl ? 1 : 0) + (musica ? 1 : 0);
    if (pcs) A.push("DI box stereo × " + pcs + " (una per PC" + (musica ? " e per la musica" : "") + ")");
    if (paSala) {
      var pe0 = parseInt(d.persone_audio || d.pax, 10) || 0;
      A.push("Usiamo le casse della sala" + (pe0 ? " per circa " + pe0 + " persone" : "") + ": verificare copertura e punto di collegamento");
    } else if (d.amplificazione === "Sì") {
      var pe = parseInt(d.persone_audio || d.pax, 10) || 0, nc = parseInt(d.n_casse, 10) || 0, casse = nc;
      if (!casse && pe) casse = 2 * Math.ceil(pe / 100);
      if (casse) {
        A.push("Casse di diffusione × " + casse + (nc ? "" : " (stima per circa " + pe + " persone, da verificare in sala)") + ", con stativi o supporti");
        if (!nc && pe >= 100) A.push("Subwoofer × " + Math.ceil(casse / 4));
        if (pe >= 300) A.push("Valutare un impianto line array e casse di ritardo per le zone lontane");
      } else A.push("Impianto di diffusione (casse, stativi, cavi): numero da definire");
    } else if (d.amplificazione === "No") A.push("Nessun impianto richiesto: verificare i collegamenti con l'impianto presente in sala");
    if (musica) A.push("Sorgente per la musica di sottofondo, su linea dedicata");
    if (d.traduzione === "Sì") A.push("Sistema di traduzione simultanea: consolle interpreti, ricevitori e cuffie per il pubblico");
    if (d.registrazione === "Sì") A.push("Registrazione audio e video (PC o registratore dedicato)");

    /* Video e regia */
    var projSala = (sala(d, "Proiettore") && !/LED/.test(d.schermo || "")) || /Proiettore della sala/.test(d.schermo || "");
    var scrSala = sala(d, "Videowall"), regiaSala = sala(d, "Regia video");
    if (projSala) V.push("Collegamento al proiettore della sala: cavo HDMI lungo e adattatori (USB-C, DisplayPort)");
    else if (/nostro/.test(d.schermo || "")) V.push("Proiettore, telo, treppiede o supporti, cavi video e prolunghe");
    if (/LED/.test(d.schermo || "")) V.push(scrSala ? "Videowall o schermi della sala: verificare ingressi, risoluzione e collegamento" : "Videowall LED con processore, strutture o supporti, cavi dati e alimentazione");
    else if (scrSala && !projSala) V.push("Schermi della sala: verificare ingressi e collegamento");
    var vin = 1 + (csl ? 1 : 0) + (vcall ? 1 : 0) + (cam ? 1 : 0) + (graf ? 1 : 0) + 1;
    if (regiaSala) V.push("Usiamo la regia video della sala: verificare modello e almeno " + vin + " ingressi liberi, con uscite verso gli schermi");
    else if (d.transizioni === "Sì") V.push("Mixer video o switcher con almeno " + vin + " ingressi (PC, sorgenti e scorta), per passaggi puliti tra le sorgenti");
    else if (d.transizioni === "No") V.push("Niente mixer video: cambio sorgente diretto dal PC o con selettore HDMI (i cambi si vedranno sugli schermi)");
    if (csl) V.push("Secondo PC per il centro slide, con monitor di controllo");
    if (d.avanzatore === "Sì") V.push("Avanzatore slide × 2, con ricevitore USB e pile di scorta");
    if (/^Visuale relatore/.test(d.visuale || "")) V.push("Segnale dedicato al relatore: splitter o matrice per mandargli uno schermo diverso da quello della sala");
    if (/^Copia/.test(d.visuale || "")) V.push("Splitter video per mandare al relatore la stessa immagine della sala");
    if (/Lontana/.test(d.regia || "")) V.push("Linee lunghe verso la regia (extender HDMI o SDI, multicore o rete audio) e intercom con il palco");
    if (graf) V.push("PC per le grafiche e i sottopancia, con uscita verso il mixer video");
    if (timer) V.push("Timer relatori: software o display dedicato, visibile dal palco");
    if (slido) V.push("PC o tablet in regia per Slido e sondaggi, con connessione internet affidabile");
    if (sito) V.push("Connessione internet affidabile per le demo dal vivo, con hotspot 4G di scorta");

    /* Schermi e supporti */
    if (tvL) { S.push("TV × " + tvL + " ai lati del palco"); S.push("Staffe, piantane o carrelli per TV × " + tvL); }
    if (tvA) { S.push("TV × " + tvA + " nelle altre aree"); S.push("Piantane per TV × " + tvA); S.push("Linee video lunghe (extender su cavo di rete o wireless) per ogni area"); }
    if (mr) S.push("Monitor di rimando per relatori × " + mr + ", con stand o supporti");
    if (mm) S.push("Monitor di rimando per moderatori × " + mm + ", con stand o supporti");
    if (gob) { S.push("Gobbo × " + gob); S.push("Supporti e stativi per gobbo × " + gob); S.push("Software e controller per lo scorrimento del testo, con operatore"); }
    if (tvs + gob > 0) S.push("Cavi video e di alimentazione, ciabatte e prolunghe per ogni schermo");

    /* Collegamenti */
    if (coll) {
      C.push((stream ? "PC di streaming con scheda di acquisizione HDMI e software di diretta" : "PC dedicato alla videocall con interfaccia audio") + (d.piattaforma ? " (" + d.piattaforma + ")" : ""));
      C.push(sala(d, "Rete") ? "Rete della sala: verificare porta cablata libera, velocità e blocchi (porte aperte per lo streaming), con hotspot 4G di scorta" : "Connessione di rete cablata dedicata, con hotspot 4G di scorta");
    }
    if (vcall && /^Bidirezionale/.test(d.direzione || "")) { C.push("Mix-minus audio per evitare l'eco verso chi è collegato"); C.push("Ritorno video dei collegati su uno schermo in sala"); }
    if (vcall && /solo noi/.test(d.direzione || "")) C.push("Uscita audio e video della regia verso il PC di collegamento");
    if (vcall && /ospite/.test(d.direzione || "")) C.push("Ingresso audio dell'ospite remoto sul mixer (via DI), senza ritorno verso di lui");
    if (/Webcam/.test(cam)) C.push("Webcam professionale con treppiede e prolunga USB");
    if (/PTZ/.test(cam)) C.push("Camera PTZ con controller, supporto o treppiede e cavi video e di rete");
    if (/operatore/.test(cam)) C.push("Camera con operatore: treppiede, monitor di controllo, cavi e intercom di servizio");

    /* Palco e luci */
    if (d.palcoluci === "Sì") {
      P.push("Palco o pedana" + (d.palco ? " (" + d.palco + ")" : "") + ", con scaletta");
      P.push(sala(d, "Luci") ? "Luci della sala: verificare controllo (DMX o centralina) e chi le gestisce" : /scena/.test(d.luci || "") ? "Luci di scena e d'ambiente con centralina DMX, stativi o americana e cavi" : /ambiente/i.test(d.luci || "") ? "Luci d'ambiente con stativi, cavi e controllo" : "Luci da definire (palco o luci richiesti)");
    }

    /* Altro */
    if (d.quota === "Sì") X.push("Attrezzatura per lavori in quota: DPI anticaduta, trabattello o piattaforma");
    if (+d.sale_par > 1) X.push("Dotazione replicata per ognuna delle " + d.sale_par + " sale, con un tecnico dedicato");
    if (d.ospite === "Sì") X.push("Ingressi e monitor da palco per l'ospite (chiedere il rider dell'artista)");
    if (d.insala_sn === "Sì" && Array.isArray(d.insala) && d.insala.length) X.push("Prima del carico: confermare con il tecnico della location l'attrezzatura della sala (modello, ingressi liberi, chi la gestisce)");
    if (d.aula === "Sì") X.push("Verificare la regia fissa dell'aula e portare gli adattatori");

    var groups = [["Audio", A], ["Video e regia", V], ["Schermi e supporti", S], ["Collegamenti e riprese", C], ["Palco e luci", P], ["Altro", X]]
      .filter(function (g) { return g[1].length; });
    if (groups.length) groups.push(["Kit generale", ["Gaffer, ciabatte e prolunghe, cavi XLR, HDMI e di rete di scorta, adattatori HDMI, USB-C e DisplayPort, torcia"]]);
    return groups.map(function (g) { return { title: g[0], items: g[1] }; });
  }

  function tabScheda() {
    var m = model();
    var h = '<div class="card doc"><p class="title">' + esc(d.nome || "Evento senza nome") + '</p><p class="hint">' + esc([d.tipo ? TIPI[d.tipo].nome : "", fmtDate(d.data)].filter(Boolean).join(" · ")) + "</p>";
    m.forEach(function (s) {
      h += "<section><h3>" + esc(s.title) + '</h3><dl class="dt">' + s.rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl></section>";
    });
    h += "</div>";
    var dot = dotazione();
    if (dot.length) {
      h += '<div class="card doc"><h2>Dotazione suggerita</h2><p class="hint">Calcolata dalle risposte, per i tecnici. Da controllare prima del carico.</p>';
      dot.forEach(function (g) {
        h += "<section><h3>" + esc(g.title) + '</h3><ul class="eq">' + g.items.map(function (it) { return "<li>" + esc(it) + "</li>"; }).join("") + "</ul></section>";
      });
      h += "</div>";
    }
    h += '<div class="row"><button class="btn" type="button" data-act="pdf">Salva PDF</button><button class="btn alt" type="button" data-act="copy">Copia testo</button></div>';
    h += '<p class="toast" id="toast" role="status"></p>';
    return h;
  }

  /* ---------- Render ed eventi ---------- */
  function render() {
    var y = window.scrollY;
    $("#tabs").innerHTML = TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + "</button>"; }).join("");
    var fn = { avanzata: tabAvanzata, scheda: tabScheda }[tab];
    $("#panel").innerHTML = fn();
    $("#sub").textContent = d.tipo ? "Scheda tecnica · evento " + TIPI[d.tipo].nome.toLowerCase() : "Scheda tecnica";
    window.scrollTo(0, y);
  }
  function go(t) { tab = t; render(); window.scrollTo(0, 0); }
  function paintReset() { var b = $("#resetBtn"); if (b) b.textContent = resetArmed ? "Sicuro? Tocca ancora" : "Ricomincia"; }
  function showNotice(msg, undo) {
    var n = $("#notice");
    n.innerHTML = "<span>" + esc(msg) + "</span>" + (undo ? '<button class="btn quiet small" type="button" data-act="undo">Annulla</button>' : "");
    n.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(hideNotice, 12000);
  }
  function hideNotice() { var n = $("#notice"); clearTimeout(noticeTimer); n.hidden = true; n.innerHTML = ""; prevD = null; }

  document.addEventListener("input", function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.k && el.tagName !== "SELECT") { d[el.dataset.k] = el.value; save(); }
  });
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.k && el.tagName === "SELECT") { d[el.dataset.k] = el.value; save(); render(); }
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest("button");
    if (!el) return;
    var s = el.dataset;
    if (s.tab) return go(s.tab);
    if (s.tipo) { d.tipo = s.tipo; save(); return render(); }
    if (s.yn) { d[s.yn] = d[s.yn] === s.v ? "" : s.v; save(); return render(); }
    if (s.multi) {
      var arr = Array.isArray(d[s.multi]) ? d[s.multi] : [];
      var i = arr.indexOf(s.v);
      if (i >= 0) arr.splice(i, 1); else arr.push(s.v);
      d[s.multi] = arr; save();
      if (s.multi === "insala") return render();
      el.setAttribute("aria-pressed", i < 0);
      return;
    }
    if (s.cnt) {
      var obj = d[s.cnt] && typeof d[s.cnt] === "object" && !Array.isArray(d[s.cnt]) ? d[s.cnt] : {};
      obj[s.o] = Math.max(0, Math.min(99, (obj[s.o] || 0) + (+s.dl)));
      d[s.cnt] = obj; save();
      var out = el.parentNode.querySelector("output");
      if (out) out.textContent = obj[s.o];
      return;
    }
    if (s.act === "import") {
      var box = $("#importText"), src = box ? box.value : "";
      if (!src.trim()) return showNotice("Incolla prima un testo.", false);
      var snap = JSON.parse(JSON.stringify(d)), got = importa(src);
      if (!got.length) { d = snap; return showNotice("Non ho trovato informazioni da inserire. Prova con più dettagli o compila a mano.", false); }
      prevD = snap; save(); render();
      return showNotice("Compilati: " + got.join(", ") + ". Controlla e correggi.", true);
    }
    if (s.act === "reset") {
      if (!resetArmed) {
        resetArmed = true; paintReset();
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () { resetArmed = false; paintReset(); }, 4000);
        return;
      }
      clearTimeout(resetTimer); resetArmed = false; paintReset();
      prevD = d;
      d = blank(); persistNow(); go("avanzata");
      return showNotice("Scheda cancellata.", true);
    }
    if (s.act === "undo") {
      if (prevD) { d = prevD; hideNotice(); persistNow(); go("avanzata"); }
      return;
    }
    if (s.act === "copy") return copyText();
    if (s.act === "pdf") return makePdf();
  });

  function toast(msg, err) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg; t.className = "toast" + (err ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { var x = $("#toast"); if (x) x.textContent = ""; }, 5000);
  }

  /* ---------- Testo e PDF ---------- */
  function asText() {
    var lines = [(d.nome || "Evento senza nome").toUpperCase(), ""];
    model().forEach(function (s) {
      lines.push(s.title.toUpperCase());
      s.rows.forEach(function (r) { lines.push(r[0] + ": " + r[1]); });
      lines.push("");
    });
    var dot = dotazione();
    if (dot.length) {
      lines.push("DOTAZIONE SUGGERITA (DA VERIFICARE)");
      dot.forEach(function (g) { lines.push(g.title + ":"); g.items.forEach(function (it) { lines.push("- " + it); }); });
    }
    return lines.join("\n").trim();
  }
  function copyText() {
    var txt = asText();
    var ok = function () { toast("Testo copiato. Incollalo in WhatsApp o in una mail."); };
    var fail = function () {
      var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { toast("Copia non riuscita. Usa Salva PDF.", true); }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fail); else fail();
  }
  function clean(s) { return String(s == null ? "" : s).replace(/[^\x20-\x7E -ÿ]/g, "-").replace(/×/g, "x"); }

  function makePdf() {
    if (!window.jspdf) return toast("Il generatore PDF non si è caricato. Ricarica la pagina.", true);
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var W = 210, H = 297, M = 16, y = M;
    function ensure(h) { if (y + h > H - M) { doc.addPage(); y = M; } }
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(20);
    var t = doc.splitTextToSize(clean((d.nome || "Evento senza nome").toUpperCase()), W - 2 * M);
    doc.text(t, M, y + 6); y += t.length * 8 + 2;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90);
    doc.text(clean([d.tipo ? "Evento " + TIPI[d.tipo].nome.toLowerCase() : "", fmtDate(d.data)].filter(Boolean).join(" - ")), M, y + 3); y += 9;
    model().forEach(function (s) {
      ensure(16);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(31, 79, 216);
      doc.text(clean(s.title.toUpperCase()), M, y + 4);
      doc.setDrawColor(31, 79, 216); doc.line(M, y + 6, W - M, y + 6); y += 11;
      s.rows.forEach(function (r) {
        var lines = doc.splitTextToSize(clean(r[1]), W - 2 * M - 58);
        var left = doc.splitTextToSize(clean(r[0]), 54);
        var n = Math.max(lines.length, left.length);
        ensure(n * 5 + 2);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
        doc.text(left, M, y + 3.5);
        doc.setFontSize(10); doc.setTextColor(20);
        doc.text(lines, M + 58, y + 3.5);
        y += n * 5 + 1.5;
      });
      y += 4;
    });
    var dot = dotazione();
    if (dot.length) {
      ensure(16);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(31, 79, 216);
      doc.text("DOTAZIONE SUGGERITA (DA VERIFICARE)", M, y + 4);
      doc.setDrawColor(31, 79, 216); doc.line(M, y + 6, W - M, y + 6); y += 11;
      dot.forEach(function (g) {
        ensure(12);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(100);
        doc.text(clean(g.title.toUpperCase()), M, y + 3.5); y += 6;
        g.items.forEach(function (it) {
          var ls = doc.splitTextToSize("- " + clean(it), W - 2 * M - 4);
          ensure(ls.length * 5 + 1);
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(20);
          doc.text(ls, M + 2, y + 3.5); y += ls.length * 5 + 1;
        });
        y += 3;
      });
    }
    var name = "rider-" + (clean(d.nome || "evento").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "evento") + ".pdf";
    var buf = doc.output("arraybuffer");
    if (!window.claude || !window.claude.use) return toast("Salvataggio non disponibile qui. Usa Copia testo.", true);
    window.claude.use("downloads").then(function (dl) {
      if (!dl) return toast("Salvataggio non disponibile qui. Usa Copia testo.", true);
      return dl.save({ filename: name, data: buf }).then(function () { toast("PDF pronto."); }, function (err) {
        if (err && err.code === "declined") toast("Salvataggio annullato.", true); else toast("Salvataggio non riuscito. Usa Copia testo.", true);
      });
    }, function () { toast("Salvataggio non disponibile qui. Usa Copia testo.", true); });
  }

  render();
})();
