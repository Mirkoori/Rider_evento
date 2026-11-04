/* Impostazioni dell'app.
 *
 * aiEndpoint: indirizzo del servizio che legge le descrizioni (vedi README, "Attivare l'analisi").
 *             Vuoto = l'analisi non è collegata e funziona solo la demo con l'esempio incluso.
 * appToken:   codice condiviso, uguale a quello impostato nel servizio (APP_TOKEN). Opzionale.
 *             Chiunque apra il sito può leggerlo: serve solo contro l'uso casuale, non è una protezione.
 */
window.RIDER_CONFIG = {
  aiEndpoint: "",
  appToken: ""
};
