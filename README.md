# Rider Evento

App per schede tecniche e rider di eventi. Si sceglie il tipo di evento (aziendale, medico, universitario), si compila la scheda e l'app prepara la dotazione suggerita per i tecnici, con PDF da condividere.

È una web app installabile (PWA): si apre da un link, si installa sul telefono con un tocco e funziona anche senza rete. Non serve passare dagli store. I dati restano sul dispositivo di chi la usa e non vengono inviati a nessun server.

## Installarla

- **Android (Chrome)**: compare il pulsante **Installa** in alto, oppure menu ⋮ → *Installa app*.
- **iPhone (Safari)**: tocca Condividi → *Aggiungi a Home*. Deve essere Safari.
- **Computer (Chrome o Edge)**: icona di installazione nella barra dell'indirizzo.

Dopo la prima apertura con rete l'app si apre anche offline.

## Cosa fa

- **Compila**: tipo di evento, dati generali, attrezzatura già presente in sala (la dotazione si adatta: niente mixer o casse se ci sono già), audio, regia e video, streaming e videocall, palco e luci. Le domande cambiano in base alle risposte.
- **Scheda**: riepilogo, **dotazione suggerita** per i tecnici (mixer, microfoni, DI, supporti per TV e gobbo, casse e altro, con le quantità calcolate), PDF e testo da copiare.
- **Ricomincia**: azzera la scheda, con Annulla per i 12 secondi successivi.

## Pubblicazione

Il sito si pubblica con GitHub Pages: in *Settings → Pages* scegli come Source *GitHub Actions* (oppure *Deploy from a branch*, ramo `main`, cartella principale: funziona lo stesso). La pubblicazione parte a ogni push sul ramo `main`.

## Aggiornare l'app

Dopo ogni modifica ai file aumenta il numero in `sw.js` (`rider-evento-v5` → `v6`), così chi l'ha installata riceve la versione nuova alla riapertura successiva.

## File

- `index.html`, `styles.css`, `app.js`: l'app.
- `shim.js`: salvataggio del PDF, installazione, offline.
- `sw.js`, `manifest.webmanifest`, `icons/`: installazione e funzionamento offline.
- `fonts/`, `vendor/`: caratteri e libreria PDF (jsPDF, licenza MIT) in locale, nessuna rete esterna.
- `.github/workflows/pages.yml`: pubblicazione automatica su GitHub Pages.
