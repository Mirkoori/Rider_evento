// Servizio che legge la descrizione di un evento: inoltra il testo (e le foto) a Claude e restituisce la risposta.
// La chiave Anthropic resta qui, sul server, e non finisce mai nell'app.
//
// Variabili da impostare (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY  chiave API Anthropic (obbligatoria)
//   APP_TOKEN          codice condiviso con config.js (consigliato)
//   ALLOWED_ORIGIN     indirizzo del sito, es. https://nome.github.io (consigliato, altrimenti qualunque sito)
//   ANTHROPIC_MODEL    modello da usare (facoltativa, default claude-sonnet-5-5)

const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5";
const ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const TOKEN = Deno.env.get("APP_TOKEN") ?? "";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const MAX_PROMPT = 60_000; // caratteri
const MAX_IMAGES = 4;
const MAX_IMAGE_B64 = 3_000_000; // caratteri base64 per immagine

const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "content-type, x-app-token, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return reply(405, { error: "metodo non consentito" });
  if (!API_KEY) return reply(500, { error: "chiave non configurata" });
  if (TOKEN && req.headers.get("x-app-token") !== TOKEN) return reply(401, { error: "non autorizzato" });

  let input: { prompt?: unknown; images?: unknown };
  try { input = await req.json(); } catch { return reply(400, { error: "richiesta non valida" }); }

  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  if (!prompt.trim() || prompt.length > MAX_PROMPT) return reply(400, { error: "testo mancante o troppo lungo" });

  const content: unknown[] = [];
  const images = Array.isArray(input.images) ? input.images.slice(0, MAX_IMAGES) : [];
  for (const im of images) {
    const data = (im as { data?: unknown })?.data;
    if (typeof data !== "string" || data.length > MAX_IMAGE_B64) return reply(400, { error: "immagine non valida" });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
  }
  content.push({ type: "text", text: prompt });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2500,
      system: "Rispondi sempre e solo con un oggetto JSON valido, senza altro testo.",
      messages: [{ role: "user", content }],
    }),
  });

  if (res.status === 429) return reply(429, { error: "troppe richieste" });
  if (!res.ok) return reply(502, { error: "servizio non disponibile" });

  const data = await res.json();
  const text = Array.isArray(data.content)
    ? data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("")
    : "";
  if (!text) return reply(502, { error: "risposta vuota" });
  return reply(200, { text });
});
