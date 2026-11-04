# Rider Evento

App per schede tecniche e rider di eventi. Descrivi l'evento a parole, l'app compila la scheda, chiede solo ciò che manca e prepara la dotazione per i tecnici, con PDF da condividere.

È una web app installabile (PWA): si apre da un link, si installa sul telefono con un tocco e funziona anche senza rete. Non serve passare dagli store.

## Pubblicarla su GitHub (5 minuti)

1. Su github.com crea un repository nuovo (pubblico: Pages gratuito lo richiede) e carica tutti i file di questa cartella, comprese le cartelle `.github`, `icons`, `fonts`, `vendor` e `supabase`.
2. Nel repository vai su **Settings → Pages** e in **Build and deployment → Source** scegli **GitHub Actions**.
3. Alla prima pubblicazione (o da **Actions → Pubblica su GitHub Pages → Run workflow**) il sito va online in uno-due minuti all'indirizzo `https://TUO-NOME.github.io/NOME-REPOSITORY/`.
4. Manda quel link a chi vuole provarla.

## Installarla

- **Android (Chrome)**: compare il pulsante **Installa** in alto, oppure menu ⋮ → *Installa app*.
- **iPhone (Safari)**: tocca Condividi → *Aggiungi a Home*. Deve essere Safari.
- **Computer (Chrome o Edge)**: icona di installazione nella barra dell'indirizzo.

Dopo la prima apertura con rete l'app si apre anche offline. I dati restano sul dispositivo di chi la usa.

## Cosa funziona subito e cosa no

- Funziona senza configurare nulla: parte **Avanzata** (tutti i campi), scheda riepilogativa, **dotazione suggerita** per i tecnici, PDF e testo da copiare, dizionario personale, Ricomincia con Annulla.
- **L'analisi del testo** (scrivi o incolla e l'app compila) richiede un piccolo servizio con la chiave Anthropic. Finché non è collegato, il pulsante Analizza funziona solo con l'esempio incluso, in modalità demo dichiarata come tale. Non legge ancora PDF e Word, solo testo e foto.

## Attivare l'analisi

La chiave Anthropic non deve mai stare nell'app o su GitHub. Sta in un servizio a parte, qui una funzione Supabase già scritta in `supabase/functions/analizza`.

1. Crea un progetto su supabase.com (il piano gratuito basta).
2. Installa la CLI di Supabase, poi da questa cartella: `supabase login`, `supabase link --project-ref TUO-PROJECT-REF`.
3. Imposta i segreti:
   `supabase secrets set ANTHROPIC_API_KEY=... APP_TOKEN=una-parola-lunga ALLOWED_ORIGIN=https://TUO-NOME.github.io`
4. Pubblica la funzione: `supabase functions deploy analizza --no-verify-jwt`.
5. In `config.js` scrivi l'indirizzo `https://TUO-PROJECT-REF.supabase.co/functions/v1/analizza` e lo stesso `APP_TOKEN`, poi carica il file su GitHub.

Attenzione: `APP_TOKEN` in `config.js` lo può leggere chiunque apra il sito. Serve contro l'uso casuale, non è una protezione vera. Imposta un **limite di spesa mensile** sul tuo account Anthropic e, se il link circola troppo, cambia il token.

## Aggiornare l'app

Dopo ogni modifica ai file aumenta il numero in `sw.js` (`rider-evento-v1` → `v2`), così chi l'ha installata riceve la versione nuova alla riapertura successiva.

## File

- `index.html`, `styles.css`, `app.js`: l'app.
- `shim.js`: salvataggio del PDF, analisi, installazione, offline.
- `config.js`: indirizzo del servizio di analisi.
- `sw.js`, `manifest.webmanifest`, `icons/`: installazione e funzionamento offline.
- `fonts/`, `vendor/`: caratteri e libreria PDF (jsPDF, licenza MIT) in locale, nessuna rete esterna.
- `supabase/`: il servizio di analisi.
- `.github/workflows/pages.yml`: pubblicazione automatica su GitHub Pages.
