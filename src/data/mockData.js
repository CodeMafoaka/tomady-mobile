/* ---------- mock data ---------- */

export const USER = {
  name: "Aïna",
  goal: "Perte de poids",
  calorieGoal: 2000,
  caloriesConsumed: 1240,
  protein: { consumed: 64, goal: 120 },
  carbs: { consumed: 150, goal: 220 },
  fat: { consumed: 40, goal: 65 },
  weight: { current: 68, start: 74, target: 63 },
  allergies: ["Arachides", "Fruits de mer"],
  conditions: ["Légère hypertension"],
  region: "Antananarivo, Madagascar",
};

export const MEALS_TODAY = [
  { name: "Avoine & fruits rouges", time: "07:30", kcal: 320, status: "good" },
  { name: "Riz, poulet grillé, légumes", time: "12:45", kcal: 540, status: "good" },
  { name: "Barre chocolatée", time: "16:00", kcal: 210, status: "warn" },
  { name: "Dîner — à ajouter", time: "—", kcal: null, status: null },
];

export const WEIGHT_DATA = [
  { d: "S1", kg: 74 }, { d: "S2", kg: 73 }, { d: "S3", kg: 72 }, { d: "S4", kg: 71 },
  { d: "S5", kg: 70 }, { d: "S6", kg: 69 }, { d: "S7", kg: 68 },
];

export const FOODS = [
  { id: 1, name: "Romazava", cat: "Plats locaux", kcal: 310, p: 28, c: 14, f: 15, status: "good" },
  { id: 2, name: "Ravitoto sy henakisoa", cat: "Plats locaux", kcal: 480, p: 22, c: 12, f: 34, status: "warn" },
  { id: 3, name: "Vary amin'anana", cat: "Plats locaux", kcal: 260, p: 9, c: 45, f: 5, status: "good" },
  { id: 4, name: "Salade de quinoa & poulet", cat: "Déjeuner", kcal: 390, p: 32, c: 38, f: 10, status: "good" },
  { id: 5, name: "Smoothie mangue-banane", cat: "Boissons", kcal: 210, p: 3, c: 48, f: 1, status: "good" },
  { id: 6, name: "Beignets sucrés (mofo)", cat: "Snacks", kcal: 340, p: 4, c: 40, f: 17, status: "warn" },
  { id: 7, name: "Cari de crevettes", cat: "Dîner", kcal: 300, p: 24, c: 10, f: 18, status: "bad" },
];

export const CATEGORIES = ["Plats locaux", "Petit-déjeuner", "Déjeuner", "Dîner", "Fruits", "Légumes", "Protéines", "Snacks", "Boissons"];

export const ALERTS = [
  { type: "bad", title: "Allergène détecté", text: "Le «Cari de crevettes» contient des fruits de mer, présents dans vos allergies déclarées." },
  { type: "warn", title: "Objectif protéines", text: "Votre apport en protéines est encore sous votre objectif aujourd'hui (64g / 120g)." },
  { type: "good", title: "Suggestion du jour", text: "Le Romazava est riche en protéines et fibres — une bonne base pour votre dîner." },
  { type: "good", title: "Palier atteint", text: "Vous avez atteint 80% de votre objectif calorique quotidien." },
];

export const CHAT = [
  { from: "user", text: "J'ai mangé du riz, du poulet et des légumes." },
  {
    from: "ai",
    text: "Voici l'analyse de votre repas — il est plutôt équilibré, avec un léger déficit en fibres.",
    card: {
      kcal: 540, p: 34, c: 58, f: 12,
      note: "Riche en protéines maigres, adapté à votre objectif de perte de poids.",
    },
  },
];

export const SUGGESTIONS = [
  "Que puis-je manger ce soir ?",
  "Pourquoi suis-je fatigué après le déjeuner ?",
  "Propose-moi un repas adapté à mon objectif",
];
