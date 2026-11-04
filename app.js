(function () {
  var KEY = "rider-evento-v2";
  var TIPI = {
    aziendale: { nome: "Aziendale", desc: "Convention, cene di gala, presentazioni" },
    medico: { nome: "Medico", desc: "Congressi, corsi, sale parallele" },
    universitario: { nome: "Universitario", desc: "Aule, seminari, lauree" }
  };
  var TABS = [["rapida", "Descrivi"], ["avanzata", "Avanzata"], ["scheda", "Scheda"]];

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

  var SECTIONS = [
    { id: "audio", title: "Audio", fields: [
      { k: "mic", label: "Microfoni: quanti e quali", t: "count", opts: ["Palmare", "Archetto", "Lavalier", "Tavolo / leggio"] },
      { k: "amplificazione", label: "Serve impianto di amplificazione?", t: "yn" },
      { k: "persone_audio", label: "Persone da coprire (per calcolare le casse)", t: "text", num: true, unit: "persone", ph: "Se vuoto uso i partecipanti", when: function (d) { return d.amplificazione === "Sì"; }, skipIf: function (d) { return !!d.pax; } },
      { k: "n_casse", label: "Numero di casse (se già deciso)", t: "text", num: true, when: function (d) { return d.amplificazione === "Sì"; } },
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
  var QPRIO = ["tipo", "data", "location", "sorgenti", "transizioni", "mic", "amplificazione", "persone_audio", "regia", "collegamento", "camera", "schermo", "schermi_extra", "centro_slide", "musica", "t_inizio", "pax"];

  function blank() {
    return { tipo: "", nome: "", agenzia: "", data: "", pax: "", location: "", sala: "", ref: "", tel: "",
      t_mont: "", t_inizio: "", t_fine: "", t_smont: "", qtext: "", analizzato: false, dedotti: [], qlist: [], nonCapiti: [] };
  }

  var d, tab = "rapida", toastTimer = null, resetTimer = null, resetArmed = false;
  try { var raw = localStorage.getItem(KEY); if (raw) d = JSON.parse(raw); } catch (e) {}
  if (!d || typeof d !== "object") d = blank();
  if (!Array.isArray(d.dedotti)) d.dedotti = [];
  if (!Array.isArray(d.qlist)) d.qlist = [];
  if (!Array.isArray(d.nonCapiti)) d.nonCapiti = [];

  /* Il dizionario personale resta salvato a parte: Ricomincia non lo cancella. */
  var GKEY = "rider-evento-dizionario-v1", gloss = "", runId = 0, prevD = null, prevFiles = null, noticeTimer = null;
  try { gloss = localStorage.getItem(GKEY) || ""; } catch (e) {}
  function saveGloss() { try { localStorage.setItem(GKEY, gloss); } catch (e) {} }

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
  function widget(k) {
    if (k === "tipo") return tipoHTML("Che tipo di evento è?");
    var f = fieldByKey(k);
    return f && visible(f) ? cell(f) : "";
  }

  /* ---------- Avanzata ---------- */
  function tabAvanzata() {
    var h = '<div class="card"><h2>Tipo di evento</h2><div class="grid">' + tipoHTML("") .replace('<span class="l"></span>', "") + "</div></div>";
    EVENT_GROUPS.forEach(function (g) {
      h += '<div class="card"><h2>' + g.title + '</h2><div class="grid">' + g.fields.map(fieldHTML).join("") + "</div></div>";
    });
    SECTIONS.forEach(function (s) {
      var fs = s.fields.filter(visible);
      if (!fs.length) return;
      h += '<div class="card"><h2>' + s.title + '</h2><div class="grid">' + fs.map(cell).join("") + "</div></div>";
    });
    h += '<div class="card"><h2>Dizionario</h2><p class="hint">Le parole che usi tu o le agenzie, una per riga, nella forma "termine = significato". Ne conosco già molte. Resta salvato anche dopo Ricomincia.</p>' +
      '<label class="f" for="f_gloss"><span class="l">Le mie parole</span><textarea id="f_gloss" data-gloss="1" placeholder="gelato = microfono palmare">' + esc(gloss) + "</textarea></label></div>";
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
    var pal = cntRe("mic", /Palmare/), arc = cntRe("mic", /Archetto/), lav = cntRe("mic", /Lavalier/), tav = cntRe("mic", /Tavolo/);
    var wl = pal + arc + lav, mics = wl + tav;
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
    if (ch > 0) A.push("Mixer audio digitale con almeno " + (ch + 2) + " ingressi (microfoni, PC e scorta)");
    if (pal) A.push("Microfoni palmari wireless × " + pal + ", con clip e aste");
    if (arc) A.push("Microfoni ad archetto wireless × " + arc);
    if (lav) A.push("Microfoni lavalier wireless × " + lav + ", con clip e fissaggi");
    if (tav) A.push("Microfoni da tavolo o leggio × " + tav + ", con basi, aste e cavi XLR");
    if (wl) {
      A.push("Ricevitori wireless × " + wl + ", con antenne e distribuzione RF (frequenze da coordinare con la sala)");
      A.push("Batterie di scorta e caricabatterie per tutti i trasmettitori");
    }
    var pcs = (pcAudio ? 1 : 0) + (csl ? 1 : 0) + (musica ? 1 : 0);
    if (pcs) A.push("DI box stereo × " + pcs + " (una per PC" + (musica ? " e per la musica" : "") + ")");
    if (d.amplificazione === "Sì") {
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
    if (/Proiettore della sala/.test(d.schermo || "")) V.push("Collegamento al proiettore della sala: cavo HDMI lungo e adattatori (USB-C, DisplayPort)");
    if (/nostro/.test(d.schermo || "")) V.push("Proiettore, telo, treppiede o supporti, cavi video e prolunghe");
    if (/LED/.test(d.schermo || "")) V.push("Videowall LED con processore, strutture o supporti, cavi dati e alimentazione");
    var vin = 1 + (csl ? 1 : 0) + (vcall ? 1 : 0) + (cam ? 1 : 0) + (graf ? 1 : 0) + 1;
    if (d.transizioni === "Sì") V.push("Mixer video o switcher con almeno " + vin + " ingressi (PC, sorgenti e scorta), per passaggi puliti tra le sorgenti");
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
      C.push("Connessione di rete cablata dedicata, con hotspot 4G di scorta");
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
      P.push(/scena/.test(d.luci || "") ? "Luci di scena e d'ambiente con centralina DMX, stativi o americana e cavi" : /ambiente/i.test(d.luci || "") ? "Luci d'ambiente con stativi, cavi e controllo" : "Luci da definire (palco o luci richiesti)");
    }

    /* Altro */
    if (d.quota === "Sì") X.push("Attrezzatura per lavori in quota: DPI anticaduta, trabattello o piattaforma");
    if (+d.sale_par > 1) X.push("Dotazione replicata per ognuna delle " + d.sale_par + " sale, con un tecnico dedicato");
    if (d.ospite === "Sì") X.push("Ingressi e monitor da palco per l'ospite (chiedere il rider dell'artista)");
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

  /* ---------- Descrivi: Claude legge il testo e compila la scheda ---------- */
  var qfiles = [], sampleFn = null, imgOK = false, busy = false, qstatus = "", qerr = false;
  var EXAMPLE = "Il 20 novembre congresso di cardiologia al Centro Congressi di Modena, sala plenaria, circa 180 persone. 6 relatori al tavolo, il moderatore ha il gelato e ci servono 2 microfoni volanti per le domande dal pubblico. Regia in fondo alla sala. I relatori portano le slide PowerPoint su chiavetta, c'è un video di apertura e usiamo Slido per le domande. Ci serve il centro slide. Collegamento con la sede di Milano: loro ci vedono e basta. Musica di sottofondo all'ingresso. Si parte alle 9, si finisce alle 17:30.";

  function missingKeys() {
    var out = [];
    QPRIO.forEach(function (k) {
      if (out.length >= 4 || d.dedotti.indexOf(k) >= 0) return;
      if (k === "tipo") { if (!d.tipo) out.push(k); return; }
      var f = fieldByKey(k);
      if (f && visible(f) && isEmpty(d[k]) && !(f.skipIf && f.skipIf(d))) out.push(k);
    });
    return out;
  }

  function tabRapida() {
    if (d.analizzato) {
      /* Se una risposta rende rilevante un'altra domanda (es. streaming, poi tipo di ripresa), la aggiungo. */
      QPRIO.forEach(function (k) {
        var f = fieldByKey(k);
        if (f && f.when && visible(f) && isEmpty(d[k]) && !(f.skipIf && f.skipIf(d)) && d.qlist.indexOf(k) < 0 && d.dedotti.indexOf(k) < 0) d.qlist.push(k);
      });
    }
    var h = '<div class="card"><h2>Racconta l\'evento</h2>' +
      '<p class="hint">Scrivi come lo diresti a voce, oppure incolla la mail ricevuta. Basta anche poco: ti chiedo solo quello che manca.</p>' +
      '<label class="f" for="f_qtext"><span class="l">Descrizione</span><textarea id="f_qtext" data-k="qtext" style="min-height:170px" placeholder="Es. Il 20 novembre congresso di cardiologia, 180 persone, 6 relatori al tavolo...">' + esc(d.qtext || "") + "</textarea></label>";
    if (qfiles.length) h += '<div class="files">' + qfiles.map(function (f, i) { return '<span class="fchip">' + esc(f.name) + '<button type="button" data-delq="' + i + '" aria-label="Togli ' + esc(f.name) + '">&times;</button></span>'; }).join("") + "</div>";
    h += '<input id="qInput" type="file" accept="image/*,.txt,.eml,.csv,.md,text/plain" multiple hidden>' +
      '<div class="row"><button class="btn" type="button" data-act="analizza"' + (busy ? " disabled" : "") + ">" + (busy ? "Sto leggendo" : "Analizza") + '</button><button class="btn alt" type="button" data-act="addq">Aggiungi foto o file</button></div>' +
      '<p class="toast' + (qerr ? " err" : "") + '" id="qstatus" role="status">' + esc(qstatus) + "</p>";
    if (!(d.qtext || "").trim()) h += '<button class="btn quiet" type="button" data-act="esempio">Prova con un esempio</button>';
    h += "</div>";
    if (!d.analizzato) return h;

    var flat = [];
    model().forEach(function (s) { flat = flat.concat(s.rows); });
    h += '<div class="card doc"><h2>Ho capito questo</h2>' +
      (flat.length ? '<dl class="dt">' + flat.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : '<p class="hint">Non ho trovato dati chiari nel testo.</p>') + "</div>";
    var ded = d.dedotti.map(widget).filter(Boolean);
    if (ded.length) h += '<div class="card review"><h2>Controlla</h2><p class="hint">Non era scritto chiaro, l\'ho dedotto. Correggi se sbaglio.</p><div class="grid">' + ded.join("") + "</div></div>";
    if (d.nonCapiti && d.nonCapiti.length) {
      h += '<div class="card review"><h2>Termini che non conosco</h2><p class="hint">Scrivi cosa significano: li imparo e li ricordo anche per le prossime schede.</p><div class="grid">' +
        d.nonCapiti.map(function (t, i) { return '<label class="f wide" for="gl_' + i + '"><span class="l">' + esc(t) + '</span><input id="gl_' + i + '" type="text" data-gl="' + esc(t) + '" placeholder="Es. microfono palmare"></label>'; }).join("") +
        '</div><button class="btn alt" type="button" data-act="insegna">Salva e rianalizza</button></div>';
    }
    var q = d.qlist.map(widget).filter(Boolean);
    if (q.length) h += '<div class="card"><h2>Mi manca</h2><div class="grid">' + q.join("") + "</div></div>";
    h += '<button class="btn" type="button" data-tab="scheda">Vedi la scheda</button>';
    return h;
  }

  function setStatus(msg, err) {
    qstatus = msg; qerr = !!err;
    var el = $("#qstatus");
    if (el) { el.textContent = msg; el.className = "toast" + (err ? " err" : ""); }
  }
  function copyFor(code) {
    if (code === "offline") return "Serve internet per l'analisi. Intanto puoi compilare nella parte Avanzata.";
    if (code === "rate_limited") return "Troppe richieste ravvicinate. Riprova tra qualche minuto.";
    if (code === "images_unavailable" || code === "image_rejected") return "Non riesco a leggere l'immagine. Prova con un altro file o incolla il testo.";
    if (code === "invalid_json" || code === "empty_completion" || code === "refused") return "Non sono riuscito a leggere bene. Aggiungi qualche dettaglio e riprova.";
    if (code === "none" || code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") return "L'analisi automatica non è disponibile qui. Compila i campi nella parte Avanzata.";
    return "Qualcosa non ha funzionato. Riprova.";
  }

  function addQFiles(files) {
    var msg = "", pending = 0;
    Array.prototype.forEach.call(files || [], function (file) {
      if (/^image\//.test(file.type)) {
        if (!imgOK) { msg = "Le foto non si possono leggere in questa vista. Incolla il testo."; return; }
        qfiles.push({ name: file.name || "foto", kind: "img", blob: file });
      } else if (file.type === "text/plain" || /\.(txt|eml|csv|md)$/i.test(file.name)) {
        pending++;
        var fr = new FileReader();
        fr.onload = function () { qfiles.push({ name: file.name, kind: "txt", text: String(fr.result).slice(0, 60000) }); if (--pending === 0) render(); };
        fr.onerror = function () { if (--pending === 0) render(); };
        fr.readAsText(file);
      } else {
        msg = "Questo formato non si legge ancora. Incolla il testo oppure carica uno screenshot.";
      }
    });
    qstatus = msg; qerr = !!msg;
    if (!pending) render();
  }

  /* Gergo del settore noto di serie: "termini = significato (campo: valore)". */
  var BUILTIN = [
    "gelato, cono, microfono a gelato, microfono a mano, radiomicrofono a mano = microfono palmare (mic: Palmare)",
    "microfono volante, microfono per le domande, microfono per il pubblico = microfono palmare (mic: Palmare)",
    "archetto, headset, microfono a cuffia, microfono ad archetto = microfono ad archetto (mic: Archetto)",
    "lavalier, lavaliere, spilla, microfono a spilla, microfono a clip, microfono da petto, cravattino = microfono lavalier (mic: Lavalier)",
    "microfono da tavolo, microfono da banco, collo d'oca, microfono da leggio = microfono da tavolo o leggio (mic: Tavolo / leggio)",
    "gobbo, teleprompter, suggeritore = gobbo (schermi_extra: Gobbo)",
    "confidence monitor, monitor di rimando, rimando per il relatore = monitor di rimando per i relatori (schermi_extra)",
    "ledwall, led wall, parete led, maxischermo led, schermo led = videowall LED (schermo: Videowall LED)",
    "beamer, videoproiettore, proiettore = proiettore (schermo: Proiettore della sala se è della location, Proiettore nostro se lo portiamo noi; se non è chiaro non compilare)",
    "TV in foyer, monitor in ingresso, schermi nelle altre sale = TV in altre aree (schermi_extra)",
    "clicker, pointer, presenter, telecomando slide, telecomando per le slide = avanzatore slide (avanzatore: Sì)",
    "countdown, semaforo, timer sul palco, cronometro relatori = timer relatori (sorgenti: Timer relatori)",
    "Slido, Mentimeter, Menti, Wooclap, Kahoot, sondaggio live, Q&A live = Slido o sondaggi dal vivo (sorgenti)",
    "PowerPoint, PPT, Keynote, presentazione = slide (sorgenti: Slide (PowerPoint, Keynote))",
    "filmato, video di apertura, spot, motion = video (sorgenti: Video)",
    "sottopancia, lower third, titoli = grafiche e sottopancia (sorgenti: Grafiche e sottopancia)",
    "diretta, live streaming, webcast = streaming (collegamento: Streaming)",
    "Zoom, Teams, Meet, collegamento con la sede, relatore da remoto, ospite in collegamento = videocall (collegamento: Videocall)",
    "evento ibrido, hybrid = in presenza più collegamento remoto: videocall se ci sono relatori remoti, streaming se il pubblico segue da casa",
    "traduzione, interpreti, cabine, cuffie per la traduzione = traduzione simultanea (traduzione: Sì)",
    "musichetta, sottofondo, background music, intro musicale = musica di sottofondo (musica: Sì)",
    "impianto, impianto voci, casse, diffusione, PA = amplificazione (amplificazione: Sì)",
    "pedana, palchetto = palco (palcoluci: Sì)",
    "americana, truss, fari, teste mobili = luci (palcoluci: Sì)",
    "transizioni pulite, passaggi puliti, cambi puliti, senza stacchi, dissolvenze, regia video, mixer video = transizioni pulite richieste (transizioni: Sì)",
    "cambi diretti dal PC, niente regia video, non servono passaggi puliti, basta il PC = transizioni pulite non richieste (transizioni: No)",
    "centro slide, slide center, speaker ready room = centro slide (centro_slide: Sì)",
    "regia a fianco del palco, regia sul palco = regia vicina (regia: Vicina al palco); regia in fondo, regia dietro = regia lontana (regia: Lontana dal palco)",
    "congresso, ECM, convegno medico, corso di formazione medica = tipo medico",
    "laurea, seminario, aula magna, lezione = tipo universitario",
    "convention, cena di gala, kick-off, town hall, team building, presentazione prodotto = tipo aziendale"
  ];
  function glossaryText() {
    var user = (gloss || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean).join("\n").slice(0, 3000);
    return BUILTIN.map(function (l) { return "- " + l; }).join("\n") + (user ? "\n\nTermini personali di chi usa l'app (priorità massima):\n" + user : "");
  }
  function glossKeys() {
    var out = [];
    (gloss || "").split("\n").forEach(function (l) {
      var p = l.split("=");
      if (p.length > 1) p[0].split(",").forEach(function (t) { t = t.trim().toLowerCase(); if (t) out.push(t); });
    });
    return out;
  }

  function buildPrompt(text) {
    var lines = allFields().map(function (f) {
      var h = f.k + ": " + f.label;
      if (f.t === "yn") h += ' (solo "Sì" o "No")';
      else if (f.t === "select") h += " (uno tra: " + f.opts.join(" | ") + ")";
      else if (f.t === "multi") h += " (lista, valori ammessi: " + f.opts.join(" | ") + ")";
      else if (f.t === "count") h += " (oggetto con il numero per tipo, chiavi ammesse: " + f.opts.join(" | ") + ')';
      else if (f.t === "date") h += " (AAAA-MM-GG)";
      else if (f.t === "time") h += " (HH:MM, 24 ore)";
      else if (f.num) h += " (solo cifre)";
      return "- " + h;
    });
    return "Sei l'assistente di un service audio video italiano. Ti arriva la richiesta di un'agenzia che organizza un evento: scritta a mano, incollata da una mail o fotografata. Compila la scheda tecnica con quello che c'è scritto.\n\n" +
      "Rispondi solo con un oggetto JSON di questa forma:\n" +
      '{"valori": {chiave: valore}, "dedotti": [chiavi], "note_extra": "frase breve", "non_capiti": [termini]}\n\n' +
      "Regole:\n" +
      "- In valori metti solo i campi di cui trovi un'informazione. Se non c'è, non mettere la chiave.\n" +
      "- Puoi fare deduzioni ragionevoli e ovvie per chi lavora nel settore (es. relatori seduti a un tavolo implicano microfoni da tavolo, un collegamento con un'altra sede implica una videocall, una diretta su una piattaforma implica streaming). Ogni chiave dedotta, e non scritta in modo esplicito, va anche nella lista dedotti.\n" +
      "- Non inventare date, nomi, numeri di persone o orari che non compaiono. Se c'è un numero di microfoni senza il tipo, non compilare mic e scrivilo in note_extra.\n" +
      "- Per una data senza anno usa l'anno più vicino nel futuro. Oggi è " + new Date().toISOString().slice(0, 10) + ".\n" +
      "- tipo: uno tra aziendale | medico | universitario, in base alla descrizione.\n" +
      "- transizioni: metti Sì solo se il testo parla di regia video, mixer video, passaggi puliti o dissolvenze, No solo se dice che bastano cambi diretti o che si vuole risparmiare. Non dedurlo dalla sola presenza di più sorgenti o telecamere, perché dipende dal budget.\n" +
      "- note_extra: altre informazioni tecniche utili che non rientrano nei campi.\n" +
      "- Il testo usa spesso il gergo del settore. Interpreta i termini con i significati del dizionario qui sotto, che ha la precedenza sulle tue ipotesi.\n" +
      "- Se trovi un termine tecnico o di gergo che si riferisce ad attrezzatura o allestimento e non riesci a collegarlo con sicurezza a un campo, non indovinare: mettilo in non_capiti (solo il termine, al massimo 5, mai parole comuni).\n\n" +
      "Dizionario del settore (termini = significato):\n" + glossaryText() + "\n\nCampi (chiave: significato):\n- tipo\n" + lines.join("\n") + "\n\nMateriale ricevuto:\n" + (text || "(solo nelle immagini allegate)");
  }

  function applyExtract(r) {
    var vals = r && r.valori && typeof r.valori === "object" ? r.valori : r;
    var applied = {}, n = 0;
    if (typeof vals.tipo === "string" && TIPI[vals.tipo]) { d.tipo = vals.tipo; applied.tipo = 1; n++; }
    allFields().forEach(function (f) {
      var v = vals[f.k];
      if (v == null || v === "") return;
      var ok = false;
      if (f.t === "yn") { v = v === true ? "Sì" : v === false ? "No" : v; if (v === "Sì" || v === "No") { d[f.k] = v; ok = true; } }
      else if (f.t === "multi") { var arr = [].concat(v).filter(function (o) { return f.opts.indexOf(o) >= 0; }); if (arr.length) { d[f.k] = arr; ok = true; } }
      else if (f.t === "count") {
        if (typeof v === "object" && !Array.isArray(v)) {
          var o = {}, any = false;
          f.opts.forEach(function (opt) { var c = parseInt(v[opt], 10); if (c > 0) { o[opt] = Math.min(c, 99); any = true; } });
          if (any) { d[f.k] = o; ok = true; }
        }
      }
      else if (f.t === "select") { if (f.opts.indexOf(v) >= 0) { d[f.k] = v; ok = true; } }
      else if (f.t === "date") { if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) { d[f.k] = String(v); ok = true; } }
      else if (f.t === "time") { var mt = /^(\d{1,2}):(\d{2})$/.exec(String(v)); if (mt) { d[f.k] = ("0" + mt[1]).slice(-2) + ":" + mt[2]; ok = true; } }
      else if (f.num) { var num = String(v).replace(/[^\d]/g, ""); if (num) { d[f.k] = num; ok = true; } }
      else { d[f.k] = String(v).slice(0, 200); ok = true; }
      if (ok) { applied[f.k] = 1; n++; }
    });
    if (r && r.note_extra) { d.logistica_note = [d.logistica_note, String(r.note_extra).slice(0, 400)].filter(Boolean).join(" "); n++; }
    var known = glossKeys();
    d.nonCapiti = (Array.isArray(r && r.non_capiti) ? r.non_capiti : []).map(function (x) { return String(x).trim().slice(0, 40); })
      .filter(function (x) { return x && known.indexOf(x.toLowerCase()) < 0; }).slice(0, 5);
    d.dedotti = (Array.isArray(r && r.dedotti) ? r.dedotti : []).filter(function (k) { return applied[k]; });
    d.qlist = missingKeys();
    return n;
  }

  function analizza() {
    if (busy) return;
    var text = (d.qtext || "").trim();
    var txt = qfiles.filter(function (f) { return f.kind === "txt"; }).map(function (f) { return "--- " + f.name + " ---\n" + f.text; }).join("\n\n");
    var imgs = qfiles.filter(function (f) { return f.kind === "img"; }).map(function (f) { return f.blob; });
    if (!text && !txt && !imgs.length) return setStatus("Scrivi qualcosa o aggiungi un file.", true);
    if (!window.claude || !window.claude.use) return setStatus(copyFor("none"), true);
    busy = true; setStatus("Sto leggendo. Può servire qualche secondo.");
    var btn = document.querySelector('[data-act="analizza"]');
    if (btn) { btn.disabled = true; btn.textContent = "Sto leggendo"; }
    var my = ++runId;
    var done = function (msg, err) { if (my !== runId) return; busy = false; qstatus = msg; qerr = !!err; render(); };
    (sampleFn ? Promise.resolve(sampleFn) : window.claude.use("sample")).then(function (s) {
      if (!s) throw { code: "none" };
      sampleFn = s;
      var opts = { modelTier: "default" };
      if (imgs.length) { if (!imgOK) throw { code: "images_unavailable" }; opts.images = imgs; }
      return s.json(buildPrompt([text, txt].filter(Boolean).join("\n\n")), opts);
    }).then(function (r) {
      if (my !== runId) return;
      if (!r || typeof r !== "object" || Array.isArray(r)) throw { code: "invalid_json" };
      var n = applyExtract(r);
      d.analizzato = true; save();
      done((sampleFn && sampleFn.demo ? "Demo: risultato d'esempio. " : "") + (n ? "Ho letto " + n + " informazioni." : "Non ho trovato informazioni chiare. Rispondi alle domande qui sotto."), !n);
    }).catch(function (e) { done(copyFor(e && e.code), true); });
  }

  /* ---------- Render ed eventi ---------- */
  function render() {
    var y = window.scrollY;
    $("#tabs").innerHTML = TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + "</button>"; }).join("");
    var fn = { rapida: tabRapida, avanzata: tabAvanzata, scheda: tabScheda }[tab];
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
  function hideNotice() { var n = $("#notice"); clearTimeout(noticeTimer); n.hidden = true; n.innerHTML = ""; prevD = null; prevFiles = null; }

  document.addEventListener("input", function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.k && el.tagName !== "SELECT") { d[el.dataset.k] = el.value; save(); }
    if (el.dataset && el.dataset.gloss) { gloss = el.value; saveGloss(); }
  });
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.k && el.tagName === "SELECT") { d[el.dataset.k] = el.value; save(); render(); }
    if (el.id === "qInput") addQFiles(el.files);
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
    if (s.act === "analizza") return analizza();
    if (s.act === "addq") return $("#qInput").click();
    if (s.act === "esempio") { d.qtext = EXAMPLE; save(); return render(); }
    if (s.delq) { qfiles.splice(+s.delq, 1); return render(); }
    if (s.act === "reset") {
      if (!resetArmed) {
        resetArmed = true; paintReset();
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () { resetArmed = false; paintReset(); }, 4000);
        return;
      }
      clearTimeout(resetTimer); resetArmed = false; paintReset();
      prevD = d; prevFiles = qfiles;
      runId++; busy = false;
      d = blank(); qfiles = []; qstatus = ""; qerr = false; persistNow(); go("rapida");
      return showNotice("Scheda cancellata. Il dizionario è rimasto.", true);
    }
    if (s.act === "undo") {
      if (prevD) { runId++; busy = false; d = prevD; qfiles = prevFiles || []; hideNotice(); persistNow(); go("rapida"); }
      return;
    }
    if (s.act === "insegna") {
      var add = [];
      document.querySelectorAll("[data-gl]").forEach(function (inp) { var m = inp.value.trim(); if (m) add.push(inp.dataset.gl + " = " + m); });
      if (!add.length) return setStatus("Scrivi cosa significa almeno un termine.", true);
      gloss = (gloss ? gloss.replace(/\s+$/, "") + "\n" : "") + add.join("\n"); saveGloss();
      d.nonCapiti = [];
      return analizza();
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
  if (window.claude && window.claude.use) {
    window.claude.use("sample").then(function (s) {
      sampleFn = s;
      if (s && s.limits) s.limits().then(function (l) { imgOK = !!(l && l.images); }, function () {});
    }, function () {});
  }
})();
