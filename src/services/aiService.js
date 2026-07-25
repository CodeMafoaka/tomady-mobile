/**
 * Point d'intégration IA — Gemma (local / offline).
 *
 * >>> ÉQUIPE BACKEND : remplacez le contenu de analyzeMealText() et
 * analyzeMealAudio() par l'appel réel au modèle Gemma embarqué
 * (ex: MediaPipe LLM Inference avec un .task Gemma, ou llama.rn / llama.cpp
 * avec un modèle Gemma quantisé). Ne changez pas la signature ni la forme
 * de l'objet retourné : le reste de l'app (Assistant, Vocal, Journal) en dépend.
 *
 * Contrat :
 *   analyzeMealText(text: string) => Promise<{
 *     text: string,                       // message de réponse affiché dans le chat
 *     card: { kcal, p, c, f, note: string } // résumé nutritionnel structuré
 *   }>
 *
 *   analyzeMealAudio(uri: string) => Promise<{
 *     transcript: string,                 // texte transcrit (speech-to-text)
 *     kcal, p, c, f: number
 *   }>
 *
 *   getModelStatus() => "loading" | "ready" | "unavailable"
 *     // >>> ÉQUIPE BACKEND : remplacez "ready" par le vrai statut du modèle.
 */

/// Retourne le statut actuel du modèle Gemma local.
/// Pour l'instant : toujours "ready" en mode démo.
/// >>> ÉQUIPE BACKEND : branchez ici la vraie détection du modèle (ex: vérifier
///     que le fichier .task Gemma est téléchargé et chargé en mémoire).
export function getModelStatus() {
  return "ready";
}

function fakeLatency(ms = 900) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mock local — permet à l'UI de rester démontrable tant que Gemma n'est pas branché.
export async function analyzeMealText(text) {
  await fakeLatency();
  return {
    text: `Analyse (mode démo) de : "${text}" — repas plutôt équilibré, léger déficit en fibres.`,
    card: {
      kcal: 480,
      p: 28,
      c: 52,
      f: 14,
      note: "⚠️ Réponse simulée — à remplacer par l'inférence Gemma locale dans aiService.js.",
    },
  };
}

// Mock local pour la voix — à remplacer par speech-to-text + analyzeMealText/Gemma.
export async function analyzeMealAudio(_uri) {
  await fakeLatency(1200);
  const transcript = "J'ai mangé du riz, des haricots et une banane.";
  return {
    transcript,
    kcal: 430,
    p: 16,
    c: 72,
    f: 6,
  };
}
