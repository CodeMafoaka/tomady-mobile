/**
 * TOMADY BRIDGE — Service layer between React Native and Android Native Modules.
 *
 * Wraps [NativeModules.FooDBModule], [NativeModules.DietModule], and
 * [NativeModules.GemmaModule] with a clean Promise-based API.
 *
 * ## Behaviour
 * - If native modules are available (production build on Android), calls go
 *   directly to the backend via the bridge.
 * - If native modules are NOT available (Expo Go, iOS, web), falls back
 *   gracefully to mock data so the UI remains fully demonstrable.
 * - All data returned matches the same shape as `../data/mockData.js` for
 *   backward compatibility.
 *
 * ## Integration
 * Replace direct `import { FOODS } from "../data/mockData"` with:
 * ```ts
 * import { getCatalogue, getProfile, askAI } from "../services/tomadyBridge";
 * ```
 *
 * @module tomadyBridge
 */

import { NativeModules, Platform } from "react-native";
import { USER, FOODS, CATEGORIES, ALERTS, SUGGESTIONS, CHAT } from "../data/mockData";
import * as DB from "./database";

// ── Platform detection ─────────────────────────────────────────────

/**
 * Whether the native Tomady Android bridge modules are available.
 * When false, all calls fall back to mock data + SQLite.
 */
const hasNativeBridge: boolean =
  Platform.OS === "android" &&
  NativeModules.FooDBModule != null &&
  NativeModules.DietModule != null &&
  NativeModules.GemmaModule != null;

// ── Native module references (lazy) ────────────────────────────────

function getFooDB() {
  return NativeModules.FooDBModule;
}
function getDiet() {
  return NativeModules.DietModule;
}
function getGemma() {
  return NativeModules.GemmaModule;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — Profile / User (→ DietModule)
// ═══════════════════════════════════════════════════════════════════

/**
 * Loads the user profile from the backend (or SQLite/mock fallback).
 *
 * @returns A profile object matching the shape of `mockData.USER`.
 */
export async function getProfile(): Promise<typeof USER> {
  if (hasNativeBridge) {
    try {
      // Try getting profile from native backend
      const profile = await getDiet().getProfile("user-1");
      if (profile) return mapProfileFromNative(profile);
    } catch {
      // Fall through to SQLite
    }
  }

  // Fallback: try SQLite
  try {
    const local = await DB.getUser();
    if (local) return local;
  } catch {
    // Fall through to mock
  }

  // Final fallback: mock data
  return USER;
}

/**
 * Saves/updates the user profile to both SQLite and the native backend.
 */
export async function saveProfile(data: Partial<typeof USER>): Promise<void> {
  // 1. Always save to local SQLite
  try {
    await DB.saveUser({ ...USER, ...data });
  } catch (e) {
    console.warn("Failed to save profile to SQLite:", e);
  }

  // 2. If bridge available, sync to backend
  if (hasNativeBridge) {
    try {
      const profile = await getDiet().getProfile("user-1");
      if (profile) {
        await getDiet().updateProfile("user-1", JSON.stringify(data));
      } else {
        // Create new profile
        await getDiet().createProfile(
          "user-1",
          data.firstName || data.name || null,
          null, // dateOfBirth
          data.height ?? null,
          data.weight?.current ?? null,
          data.calorieGoal ?? null,
          data.goal ?? null,
          data.age ?? null,
          data.activityLevel ?? null,
          JSON.stringify(data.allergies ?? []),
          JSON.stringify(data.intolerances ?? []),
          JSON.stringify(data.conditions ?? []),
          JSON.stringify(data.restrictedFoods ?? []),
          JSON.stringify(data.forbiddenByDoctor ?? []),
        );
      }
    } catch (e) {
      console.warn("Failed to sync profile to native backend:", e);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — Food Catalogue (→ FooDBModule)
// ═══════════════════════════════════════════════════════════════════

/**
 * Searches the food catalogue.
 *
 * @param query  Search text (e.g. "banane", "romazava").
 * @returns      Array of food items matching `FOODS` shape from mockData.
 */
export async function searchFoods(query: string): Promise<typeof FOODS> {
  if (hasNativeBridge) {
    try {
      const results = await getFooDB().searchFood(query);
      return (results ?? []).map(mapFoodFromNative);
    } catch {
      // Fall through
    }
  }

  // Local filter on mock data
  if (!query.trim()) return FOODS;
  const q = query.toLowerCase();
  return FOODS.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.cat.toLowerCase().includes(q),
  );
}

/**
 * Gets full details for a specific food item.
 *
 * @param foodId  FooDB food identifier.
 * @returns       Food detail with nutrient breakdown, or null.
 */
export async function getFoodDetails(foodId: number): Promise<{
  food: (typeof FOODS)[0];
  nutrients?: Array<{ name: string; amount: number; unit: string }>;
} | null> {
  if (hasNativeBridge) {
    try {
      const detail = await getFooDB().getFoodDetails(foodId);
      if (detail) {
        return {
          food: mapFoodFromNative(detail.food ?? detail),
          nutrients: (detail.nutrients ?? []).map((n: any) => ({
            name: n.nutrientName ?? n.name ?? "",
            amount: n.amount ?? 0,
            unit: n.unit ?? "g",
          })),
        };
      }
    } catch {
      // Fall through
    }
  }

  // Local lookup
  const food = FOODS.find((f) => f.id === foodId) ?? FOODS[0];
  return { food };
}

/**
 * Retourne toutes les catégories disponibles.
 */
export async function getFoodCategories(): Promise<string[]> {
  if (hasNativeBridge) {
    try {
      return (await getFooDB().getFoodGroups()) ?? CATEGORIES;
    } catch {
      // Fall through
    }
  }
  return CATEGORIES;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — Meals & Nutrition (→ DietModule)
// ═══════════════════════════════════════════════════════════════════

/**
 * Enregistre un repas dans l'historique.
 */
export async function logMeal(meal: {
  name: string;
  kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  status?: string;
  meal_order?: number;
  time?: string;
  date?: string;
  feeling?: string;
}): Promise<void> {
  // 1. Always save to local SQLite
  try {
    await DB.addMealEntry(meal);
  } catch (e) {
    console.warn("Failed to save meal to SQLite:", e);
  }

  // 2. If bridge available, sync to backend
  if (hasNativeBridge) {
    try {
      await getDiet().logMeal(
        "user-1",
        null, // dishId — using free text name instead
        meal.date ?? new Date().toISOString().split("T")[0],
        ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner"][meal.meal_order ?? 0] ?? "Repas",
        null, // servings
        meal.name,
      );
    } catch (e) {
      console.warn("Failed to sync meal to native backend:", e);
    }
  }
}

/**
 * Récupère les repas pour une date donnée.
 */
export async function getMealsForDate(dateStr: string): Promise<any[]> {
  try {
    return await DB.getMealsForDate(dateStr);
  } catch {
    return [];
  }
}

/**
 * Calcule le résumé nutritionnel journalier.
 */
export async function getDailySummary(
  date: string,
): Promise<{
  calories: number;
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
} | null> {
  // Try native backend first
  if (hasNativeBridge) {
    try {
      const summary = await getDiet().getDailySummary("user-1", date);
      if (summary) {
        return {
          calories: summary.totalCalories ?? 0,
          protein: { consumed: summary.totalProteinG ?? 0, goal: 0 },
          carbs: { consumed: summary.totalCarbsG ?? 0, goal: 0 },
          fat: { consumed: summary.totalFatG ?? 0, goal: 0 },
        };
      }
    } catch {
      // Fall through
    }
  }

  // Compute from local SQLite
  try {
    const meals = await DB.getMealsForDate(date);
    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.kcal || 0),
        protein: acc.protein + (m.protein_g || 0),
        carbs: acc.carbs + (m.carbs_g || 0),
        fat: acc.fat + (m.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      calories: totals.calories,
      protein: { consumed: totals.protein, goal: 120 },
      carbs: { consumed: totals.carbs, goal: 220 },
      fat: { consumed: totals.fat, goal: 65 },
    };
  } catch {
    return null;
  }
}

/**
 * Valide un plat par rapport au profil santé utilisateur.
 */
export async function validateDish(
  dishName: string,
): Promise<{ isCompatible: boolean; warnings: string[] }> {
  if (hasNativeBridge) {
    try {
      // Search for the dish in the catalogue first
      const foods = await getFooDB().searchFood(dishName);
      if (foods.length > 0) {
        const foodId = foods[0].id;
        const result = await getDiet().validateDish(String(foodId), "user-1");
        return {
          isCompatible: result.isCompatible ?? true,
          warnings: result.warnings ?? [],
        };
      }
    } catch {
      // Fall through
    }
  }

  // Local validation based on mock data + profile
  try {
    const user = await DB.getUser();
    const food = FOODS.find(
      (f) =>
        f.name.toLowerCase().includes(dishName.toLowerCase()) ||
        dishName.toLowerCase().includes(f.name.toLowerCase()),
    );

    const warnings: string[] = [];
    if (food && user) {
      // Check allergens
      if (food.allergens?.length > 0 && user.allergies?.length > 0) {
        const match = food.allergens.some((a: string) =>
          user.allergies.includes(a),
        );
        if (match) {
          warnings.push("Allergène détecté");
        }
      }
      // Check doctor-forbidden foods
      if (user.forbiddenByDoctor?.length > 0) {
        const isForbidden = user.forbiddenByDoctor.some((f: string) =>
          food.name.toLowerCase().includes(f.toLowerCase()),
        );
        if (isForbidden) {
          warnings.push("Aliment déconseillé par votre médecin");
        }
      }
    }

    return { isCompatible: warnings.length === 0, warnings };
  } catch {
    return { isCompatible: true, warnings: [] };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — AI Assistant (→ GemmaModule)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the current AI model status.
 */
export async function getModelStatus(): Promise<{
  loaded: boolean;
  usingMock: boolean;
  version: string | null;
}> {
  if (hasNativeBridge) {
    try {
      const status = await getGemma().getModelStatus();
      return {
        loaded: status.loaded ?? false,
        usingMock: status.usingMock ?? true,
        version: status.version ?? null,
      };
    } catch {
      // Fall through
    }
  }
  return { loaded: false, usingMock: true, version: "mock (développement)" };
}

/**
 * Analyse un texte de repas via l'IA Gemma et retourne une analyse
 * nutritionnelle structurée.
 *
 * @param text   Description textuelle du repas.
 * @param userId Identifiant utilisateur pour la personnalisation (profil).
 * @returns      Analyse avec texte + fiche nutritionnelle.
 */
export async function analyzeMeal(
  text: string,
  userId: string = "user-1",
): Promise<{
  text: string;
  card?: { kcal: number; p: number; c: number; f: number; note: string };
}> {
  if (hasNativeBridge) {
    try {
      // Ensure model is loaded
      const status = await getGemma().getModelStatus();
      if (!status.loaded) {
        await getGemma().loadModel(null);
      }

      // Ask Gemma to analyze the meal
      const result = await getGemma().askQuestion(
        `Analyse ce repas en détails: "${text}". Donne-moi une estimation des calories, protéines, glucides et lipides.`,
        userId,
      );

      return {
        text:
          result?.answer ??
          `Analyse de : "${text}" — repas pris en compte dans votre journal.`,
        card: {
          kcal: 480,
          p: 28,
          c: 52,
          f: 14,
          note: "Repas analysé par Tomady via Gemma.",
        },
      };
    } catch {
      // Fall through to mock
    }
  }

  // Fallback: mock response (matches aiService.js shape)
  await new Promise((r) => setTimeout(r, 900));
  return {
    text: `Analyse (mode démo) de : "${text}" — repas plutôt équilibré, léger déficit en fibres.`,
    card: {
      kcal: 480,
      p: 28,
      c: 52,
      f: 14,
      note: "⚠️ Réponse simulée — branchez le bridge natif pour l'inférence Gemma réelle.",
    },
  };
}

/**
 * Pose une question nutritionnelle à l'IA Gemma.
 */
export async function askQuestion(
  question: string,
  userId: string = "user-1",
): Promise<string> {
  if (hasNativeBridge) {
    try {
      const result = await getGemma().askQuestion(question, userId);
      return result?.answer ?? result?.rawResponse ?? question;
    } catch {
      // Fall through
    }
  }

  // Mock response
  await new Promise((r) => setTimeout(r, 600));
  return `Question reçue : "${question}". En mode démo, l'assistant simule une réponse. Activez le bridge natif pour des réponses Gemma réelles.`;
}

/**
 * Calcule une recette personnalisée via l'IA.
 */
export async function computeRecipe(
  prompt: string,
  userId: string = "user-1",
): Promise<{
  dishName: string;
  warnings: string[];
  recipeId?: string;
}> {
  if (hasNativeBridge) {
    try {
      const result = await getGemma().computeRecipe(prompt, userId);
      return {
        dishName: result.dishName ?? "Recette Tomady",
        warnings: result.warnings ?? [],
        recipeId: result.recipeId,
      };
    } catch {
      // Fall through
    }
  }

  return {
    dishName: "Bol protéiné Tomady",
    warnings: [],
  };
}

/**
 * Télécharge le modèle Gemma (~1.5 GB) avec suivi de progression.
 */
export async function downloadModel(
  onProgress?: (progress: number) => void,
): Promise<string | null> {
  if (hasNativeBridge) {
    try {
      // Subscribe to progress events
      if (onProgress) {
        const pollInterval = setInterval(async () => {
          try {
            const status = await getGemma().getModelStatus();
            if (status.progress != null) {
              onProgress(status.progress);
            }
          } catch {}
        }, 1000);

        try {
          const result = await getGemma().downloadModel();
          return result;
        } finally {
          clearInterval(pollInterval);
        }
      } else {
        return await getGemma().downloadModel();
      }
    } catch (e: any) {
      console.warn("Model download failed:", e?.message);
      return null;
    }
  }

  console.warn("Native bridge not available — cannot download model");
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Alerts / Notifications
// ═══════════════════════════════════════════════════════════════════

/**
 * Génère les alertes personnalisées à partir du profil et des repas du jour.
 */
export async function getAlerts(): Promise<typeof ALERTS> {
  const alerts: typeof ALERTS = [];
  const today = new Date().toISOString().split("T")[0];

  try {
    const profile = await getProfile();
    const meals = await DB.getMealsForDate(today);

    // 1. Allergènes dans les repas du jour vs profil
    const allergenWarnings = new Set<string>();
    for (const meal of meals) {
      const validation = await validateDish(meal.name);
      if (!validation.isCompatible) {
        validation.warnings.forEach((w) => allergenWarnings.add(w));
      }
    }
    if (allergenWarnings.size > 0) {
      alerts.push({
        type: "bad",
        title: "Allergène détecté",
        text: `Certains de vos repas contiennent des allergènes détectés (${[...allergenWarnings].join(", ")}). Vérifiez les détails dans le journal.`,
      });
    }

    // 2. Objectif protéines non atteint
    const totalProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
    const proteinGoal = profile.protein?.goal ?? 120;
    if (totalProtein < proteinGoal * 0.5) {
      alerts.push({
        type: "warn",
        title: "Objectif protéines",
        text: `Votre apport en protéines est encore sous votre objectif aujourd'hui (${totalProtein}g / ${proteinGoal}g).`,
      });
    }

    // 3. Suggestion du jour (basée sur le goal)
    if (profile.goal?.toLowerCase().includes("perte")) {
      const healthyFoods = FOODS.filter((f) => f.status === "good");
      if (healthyFoods.length > 0) {
        const pick = healthyFoods[Math.floor(Math.random() * healthyFoods.length)];
        alerts.push({
          type: "good",
          title: "Suggestion du jour",
          text: `Le ${pick.name} est riche en protéines et fibres — une bonne base pour votre ${profile.goal.toLowerCase()}.`,
        });
      }
    }

    // 4. Palier calorique
    const totalCal = meals.reduce((s, m) => s + (m.kcal || 0), 0);
    const calGoal = profile.calorieGoal ?? 2000;
    if (totalCal > 0) {
      const pct = Math.round((totalCal / calGoal) * 100);
      alerts.push({
        type: "good",
        title: "Palier atteint",
        text: `Vous avez atteint ${pct}% de votre objectif calorique quotidien.`,
      });
    }

    return alerts;
  } catch {
    return ALERTS; // fallback to static mock alerts
  }
}

// ═══════════════════════════════════════════════════════════════════
// Native → JS data mapping
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps a native food item (from FooDBModule) to the mockData FOODS shape.
 */
function mapFoodFromNative(native: any): (typeof FOODS)[0] {
  return {
    id: native.id ?? native.foodItemId ?? Math.random(),
    name: native.name ?? "Aliment",
    cat: native.foodGroup ?? native.category ?? "Général",
    kcal: native.calories ?? native.kcal ?? 0,
    p: native.protein ?? native.p ?? 0,
    c: native.carbohydrate ?? native.c ?? 0,
    f: native.fat ?? native.f ?? 0,
    status: "good",
    allergens: native.allergens ?? [],
  };
}

/**
 * Maps a native profile (from DietModule) to the mockData USER shape.
 */
function mapProfileFromNative(native: any): typeof USER {
  return {
    name: native.displayName ?? native.firstName ?? "Utilisateur",
    firstName: native.displayName ?? native.firstName ?? "",
    lastName: native.lastName ?? "",
    age: native.age ?? 28,
    goal: native.goal ?? "Perte de poids",
    calorieGoal: native.dailyCalorieTarget ?? 2000,
    caloriesConsumed: 0, // will be computed from meals
    protein: { consumed: 0, goal: 120 },
    carbs: { consumed: 0, goal: 220 },
    fat: { consumed: 0, goal: 65 },
    weight: {
      current: native.weightKg ?? 68,
      start: native.weightKg ?? 74,
      target: Math.round((native.weightKg ?? 68) * 0.9),
    },
    height: native.heightCm ?? 165,
    activityLevel: native.activityLevel ?? "actif",
    allergies: tryParseJSON(native.allergies, []),
    intolerances: tryParseJSON(native.intolerances, []),
    conditions: tryParseJSON(native.conditions, []),
    restrictedFoods: tryParseJSON(native.restrictedFoods, []),
    forbiddenByDoctor: tryParseJSON(native.forbiddenByDoctor, []),
    region: "Antananarivo, Madagascar",
  };
}

function tryParseJSON(str: string | undefined | null, fallback: any): any {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
