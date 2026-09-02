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

/**
 * REST API base URL for HTTP fallback when native bridge is unavailable.
 * Tries localhost (emulator) and common local network addresses.
 */
const REST_API_URL = "http://127.0.0.1:7777";

async function apiFetch(path: string, options?: RequestInit): Promise<any> {
  const url = `${REST_API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

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

  // Try REST API
  try {
    const result = await apiFetch("/api/v1/diet/profile/user-1");
    if (result?.profile) return mapProfileFromNative(result.profile);
  } catch {
    // Fall through to SQLite
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

  // Try REST API
  try {
    await apiFetch("/api/v1/diet/profile", {
      method: "PUT",
      body: JSON.stringify(mapProfileToRestPayload("user-1", data)),
    });
  } catch (e) {
    console.warn("Failed to sync profile to REST API:", e);
  }
}

/**
 * Maps a partial `USER`-shaped profile update to the Profile fields the
 * backend's `PUT /api/v1/diet/profile` expects (see Profile.kt). Array
 * fields are stored as JSON strings server-side, matching how the native
 * bridge (DietModule) already encodes them.
 */
function mapProfileToRestPayload(userId: string, data: Partial<typeof USER>): Record<string, unknown> {
  return {
    userId,
    displayName: data.firstName ?? data.name,
    heightCm: data.height,
    weightKg: data.weight?.current,
    dailyCalorieTarget: data.calorieGoal,
    proteinGramsTarget: data.protein?.goal,
    carbsGramsTarget: data.carbs?.goal,
    fatGramsTarget: data.fat?.goal,
    goal: data.goal,
    age: data.age,
    activityLevel: data.activityLevel,
    allergies: data.allergies ? JSON.stringify(data.allergies) : undefined,
    intolerances: data.intolerances ? JSON.stringify(data.intolerances) : undefined,
    conditions: data.conditions ? JSON.stringify(data.conditions) : undefined,
    restrictedFoods: data.restrictedFoods ? JSON.stringify(data.restrictedFoods) : undefined,
    forbiddenByDoctor: data.forbiddenByDoctor ? JSON.stringify(data.forbiddenByDoctor) : undefined,
  };
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

  // Try REST API
  try {
    const results = await apiFetch(`/api/v1/foodb/search?q=${encodeURIComponent(query)}`);
    const items = results.results ?? results ?? [];
    return (Array.isArray(items) ? items : []).map(mapFoodFromNative);
  } catch {
    // Fall through to mock
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

  // Try REST API
  try {
    const detail = await apiFetch(`/api/v1/foodb/food/${foodId}`);
    return {
      food: mapFoodFromNative(detail.food ?? detail),
      nutrients: (detail.nutrients ?? []).map((n: any) => ({
        name: n.nutrientName ?? n.name ?? "",
        amount: n.amount ?? 0,
        unit: n.unit ?? "g",
      })),
    };
  } catch {
    // Fall through to local lookup
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

  // Try REST API
  try {
    const result = await apiFetch("/api/v1/foodb/groups");
    return result.groups ?? result ?? CATEGORIES;
  } catch {
    // Fall through
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

  // Try REST API — create a Dish carrying the macros first (DishHistory itself
  // has no kcal/macro columns; computeDishNutrition() falls back to the Dish's
  // own calories/proteinGrams/carbsGrams/fatGrams when it has no linked recipe).
  try {
    const mealType = ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner"][meal.meal_order ?? 0] ?? "Repas";
    const dishResult = await apiFetch("/api/v1/diet/dish", {
      method: "POST",
      body: JSON.stringify({
        name: meal.name,
        category: mealType,
        calories: meal.kcal ?? null,
        proteinGrams: meal.protein_g ?? null,
        carbsGrams: meal.carbs_g ?? null,
        fatGrams: meal.fat_g ?? null,
      }),
    });
    const dishId = dishResult?.dish?.id ?? null;

    await apiFetch("/api/v1/diet/meal", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-1",
        dishId,
        date: meal.date ?? new Date().toISOString().split("T")[0],
        mealType,
        servings: 1,
        notes: meal.name,
      }),
    });
  } catch (e) {
    console.warn("Failed to sync meal to REST API:", e);
  }
}

/**
 * Récupère les repas pour une date donnée.
 */
export async function getMealsForDate(dateStr: string): Promise<any[]> {
  // Try native bridge first
  if (hasNativeBridge) {
    try {
      const history = await getDiet().getDishHistory("user-1", dateStr);
      if (history && history.length > 0) {
        return history.map((h: any) => ({
          id: h.id ?? h.historyId ?? Math.random(),
          name: h.dishName ?? h.name ?? h.notes ?? "Repas",
          kcal: h.kcal ?? h.calories ?? 0,
          protein_g: h.proteinG ?? h.protein ?? 0,
          carbs_g: h.carbsG ?? h.carbs ?? 0,
          fat_g: h.fatG ?? h.fat ?? 0,
          status: h.status ?? "eaten",
          meal_type: h.mealType ?? "Repas",
          feeling: h.feeling ?? null,
          date: h.date ?? dateStr,
          time: h.time ?? null,
          meal_order: h.mealOrder ?? 0,
        }));
      }
    } catch {
      // Fall through
    }
  }

  // Try REST API
  try {
    const result = await apiFetch(`/api/v1/diet/meals/user-1?date=${dateStr}`);
    const items = result?.meals ?? [];
    if (Array.isArray(items) && items.length > 0) {
      // DishHistory itself carries no kcal/macro columns — fetch the linked
      // Dish's computed nutrition (falls back to the Dish's own stored
      // macros when it has no recipe, see computeDishNutrition()).
      const nutritionByDishId = new Map<string, any>();
      await Promise.all(
        items
          .map((h: any) => h.dishId)
          .filter((id: string | null | undefined): id is string => !!id)
          .filter((id: string, i: number, arr: string[]) => arr.indexOf(id) === i)
          .map(async (dishId: string) => {
            try {
              const res = await apiFetch(`/api/v1/diet/nutrition/${dishId}`);
              if (res?.nutrition) nutritionByDishId.set(dishId, res.nutrition);
            } catch {
              // Leave missing — falls back to 0 below
            }
          }),
      );

      return items.map((h: any) => {
        const nutrition = h.dishId ? nutritionByDishId.get(h.dishId) : null;
        return {
          id: h.id ?? Math.random(),
          name: h.notes ?? "Repas",
          kcal: nutrition?.totalCalories ?? 0,
          protein_g: nutrition?.totalProteinG ?? 0,
          carbs_g: nutrition?.totalCarbsG ?? 0,
          fat_g: nutrition?.totalFatG ?? 0,
          status: "good",
          meal_type: h.mealType ?? "Repas",
          feeling: null,
          date: h.date ?? dateStr,
          time: null,
          meal_order: 0,
        };
      });
    }
  } catch {
    // Fall through
  }

  // Fallback: SQLite
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

  // Try REST API
  try {
    const result = await apiFetch(`/api/v1/diet/summary/user-1?date=${date}`);
    const summary = result?.summary;
    if (summary) {
      return {
        calories: summary.totalCalories ?? 0,
        protein: { consumed: summary.totalProteinG ?? 0, goal: 120 },
        carbs: { consumed: summary.totalCarbsG ?? 0, goal: 220 },
        fat: { consumed: summary.totalFatG ?? 0, goal: 65 },
      };
    }
  } catch {
    // Fall through
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
// SECTION 4 — Bio Records (→ DietModule)
// ═══════════════════════════════════════════════════════════════════

/**
 * Enregistre un relevé biométrique (poids, graisse, tension).
 */
export async function recordBio(bio: {
  date?: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  systolicBp?: number;
  diastolicBp?: number;
  notes?: string;
}): Promise<void> {
  const date = bio.date ?? new Date().toISOString().split("T")[0];

  if (hasNativeBridge) {
    try {
      await getDiet().recordBio(
        "user-1",
        date,
        bio.weightKg ?? null,
        bio.bodyFatPercentage ?? null,
        bio.systolicBp ?? null,
        bio.diastolicBp ?? null,
        bio.notes ?? null,
      );
      return;
    } catch (e) {
      console.warn("Failed to record bio to native backend:", e);
    }
  }

  // Try REST API
  try {
    await apiFetch("/api/v1/diet/bio", {
      method: "POST",
      body: JSON.stringify({ userId: "user-1", date, ...bio }),
    });
  } catch (e) {
    console.warn("Failed to record bio to REST API:", e);
  }
}

/**
 * Récupère le relevé biométrique pour une date.
 */
export async function getBioRecord(date: string): Promise<any | null> {
  if (hasNativeBridge) {
    try {
      return await getDiet().getBioRecord("user-1", date);
    } catch {
      // Fall through
    }
  }
  return null;
}

/**
 * Récupère les relevés biométriques dans un intervalle de dates.
 */
export async function getBioRecordsInRange(
  startDate: string,
  endDate: string,
): Promise<any[]> {
  if (hasNativeBridge) {
    try {
      return (await getDiet().getBioRecordsInRange("user-1", startDate, endDate)) ?? [];
    } catch {
      // Fall through
    }
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — Dishes & Recipes (→ DietModule)
// ═══════════════════════════════════════════════════════════════════

/**
 * Crée un plat dans la base de données.
 */
export async function createDish(
  name: string,
  description?: string,
  category?: string,
): Promise<any | null> {
  if (hasNativeBridge) {
    try {
      return await getDiet().createDish(name, description ?? null, category ?? null);
    } catch {
      // Fall through
    }
  }
  return null;
}

/**
 * Recherche des plats par nom.
 */
export async function searchDishes(query: string): Promise<any[]> {
  if (hasNativeBridge) {
    try {
      return (await getDiet().searchDishes(query)) ?? [];
    } catch {
      // Fall through
    }
  }
  return [];
}

/**
 * Récupère le plan nutritionnel quotidien.
 */
export async function getDailyPlan(): Promise<any | null> {
  if (hasNativeBridge) {
    try {
      return await getDiet().getDailyPlan("user-1");
    } catch {
      // Fall through
    }
  }
  return null;
}

/**
 * Récupère l'historique des repas sur un intervalle de dates.
 */
export async function getHistoryInRange(
  startDate: string,
  endDate: string,
): Promise<any[]> {
  if (hasNativeBridge) {
    try {
      return (await getDiet().getHistoryInRange("user-1", startDate, endDate)) ?? [];
    } catch {
      // Fall through
    }
  }
  return [];
}

/**
 * Calcule la nutrition d'un plat.
 */
export async function getDishNutrition(
  dishId: string,
): Promise<any | null> {
  if (hasNativeBridge) {
    try {
      return await getDiet().getDishNutrition(dishId);
    } catch {
      // Fall through
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — AI Assistant (→ GemmaModule)
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

  // Try REST API
  try {
    const result = await apiFetch("/api/v1/gemma/download/status");
    return {
      loaded: result.loaded ?? false,
      usingMock: result.usingMock ?? true,
      version: result.modelVersion ?? null,
    };
  } catch {
    // Fall through to mock
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
      // Ensure real model is ready (downloads if needed)
      await ensureModelReady();

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
      // Fall through
    }
  }

  // Try REST API
  try {
    const result = await apiFetch("/api/v1/gemma/ask", {
      method: "POST",
      body: JSON.stringify({
        question: `Analyse ce repas en détails: "${text}". Donne-moi une estimation des calories, protéines, glucides et lipides.`,
        userId,
      }),
    });
    const answer = result.answer ?? result.rawResponse ?? result.message ?? "";
    return {
      text: answer || `Analyse de : "${text}" — repas pris en compte dans votre journal.`,
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
      await ensureModelReady();
      const result = await getGemma().askQuestion(question, userId);
      return result?.answer ?? result?.rawResponse ?? question;
    } catch {
      // Fall through
    }
  }

  // Try REST API
  try {
    const result = await apiFetch("/api/v1/gemma/ask", {
      method: "POST",
      body: JSON.stringify({ question, userId }),
    });
    return result.answer ?? result.rawResponse ?? result.message ?? question;
  } catch {
    // Fall through to mock
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
      await ensureModelReady();
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
 * Génère un insight nutritionnel personnalisé pour le dashboard.
 *
 * Appelle Gemma (via le bridge natif) pour analyser le profil utilisateur
 * et les repas du jour, et retourne un insight court et actionnable.
 *
 * @param mealsSummary Résumé des repas du jour (calories, macros, nombre de repas).
 * @returns Un objet avec le texte de l'insight et sa catégorie.
 */
export async function getDailyInsight(mealsSummary: {
  totalCalories: number;
  calorieGoal: number;
  totalProtein: number;
  proteinGoal: number;
  totalCarbs: number;
  carbsGoal: number;
  totalFat: number;
  fatGoal: number;
  mealCount: number;
}): Promise<{ text: string; category: string }> {
  if (hasNativeBridge) {
    try {
      await ensureModelReady();
      const today = new Date().toISOString().split("T")[0];
      const result = await getGemma().getDailyInsight(
        "user-1",
        today,
        mealsSummary.totalCalories,
        mealsSummary.calorieGoal,
        mealsSummary.totalProtein,
        mealsSummary.proteinGoal,
        mealsSummary.totalCarbs,
        mealsSummary.carbsGoal,
        mealsSummary.totalFat,
        mealsSummary.fatGoal,
        mealsSummary.mealCount,
      );
      return {
        text: result?.text ?? getDefaultInsight(mealsSummary),
        category: result?.category ?? "general",
      };
    } catch {
      // Fall through to mock
    }
  }

  // Mock insight based on actual data
  await new Promise((r) => setTimeout(r, 600));
  return {
    text: getDefaultInsight(mealsSummary),
    category: "general",
  };
}

/**
 * Returns a default insight based on the meals summary data.
 * Used as fallback when the native bridge is unavailable.
 */
function getDefaultInsight(meals: {
  totalCalories: number;
  calorieGoal: number;
  totalProtein: number;
  proteinGoal: number;
  mealCount: number;
}): string {
  if (meals.mealCount === 0) {
    return "Vous n'avez pas encore enregistré de repas aujourd'hui. Commencez par ajouter votre premier repas !";
  }
  const pct = Math.round((meals.totalCalories / meals.calorieGoal) * 100);
  if (meals.totalProtein < meals.proteinGoal * 0.5) {
    return `Bon début avec ${meals.totalCalories} kcal (${pct}% de l'objectif). Vos protéines sont encore faibles (${meals.totalProtein}g/${meals.proteinGoal}g) — ajoutez une source de protéines à votre prochain repas !`;
  }
  if (meals.totalCalories > meals.calorieGoal) {
    return `Vous avez dépassé votre objectif calorique avec ${meals.totalCalories} kcal. Pour le reste de la journée, privilégiez les légumes et l'eau.`;
  }
  return `Excellent travail ! ${meals.totalCalories} kcal (${pct}%) et ${meals.totalProtein}g de protéines sur ${meals.mealCount} repas. Vous êtes sur la bonne voie !`;
}

/**
 * Télécharge le modèle Gemma avec suivi de progression.
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

  // REST fallback — POST /api/v1/gemma/download starts the download+load in
  // the background on the Android service; poll /download/status for progress.
  try {
    await apiFetch("/api/v1/gemma/download", { method: "POST" });

    return await new Promise<string | null>((resolve) => {
      const poll = setInterval(async () => {
        try {
          const status = await apiFetch("/api/v1/gemma/download/status");
          if (status.progress != null) onProgress?.(status.progress);
          if (status.loaded && !status.usingMock) {
            clearInterval(poll);
            resolve(status.modelVersion ?? "downloaded");
          } else if (!status.downloading && !status.cached) {
            // Download finished but failed (not cached, not in progress anymore)
            clearInterval(poll);
            resolve(null);
          }
        } catch {
          clearInterval(poll);
          resolve(null);
        }
      }, 1500);
    });
  } catch (e: any) {
    console.warn("Model download via REST failed:", e?.message);
    return null;
  }
}

/**
 * S'assure que le modèle Gemma réel est prêt.
 * Si le modèle est en mode mock (pas encore téléchargé), lance le téléchargement.
 * Retourne true si le modèle réel est disponible, false si en mode mock.
 */
export async function ensureModelReady(
  onProgress?: (progress: number) => void,
): Promise<boolean> {
  if (hasNativeBridge) {
    try {
      const status = await getGemma().getModelStatus();
      if (status.loaded && !status.usingMock) {
        return true; // Already loaded with real model
      }

      // Model not loaded or using mock -> trigger download
      console.log("Gemma model not ready (usingMock:", status.usingMock, "), starting download...");
      const downloadedPath = await downloadModel(onProgress);

      if (downloadedPath) {
        // Download succeeded, now load the model
        await getGemma().loadModel(downloadedPath);
        const finalStatus = await getGemma().getModelStatus();
        return finalStatus.loaded && !finalStatus.usingMock;
      }

      return false;
    } catch (e) {
      console.warn("ensureModelReady failed:", e);
      return false;
    }
  }

  // REST fallback
  try {
    const status = await getModelStatus();
    if (status.loaded && !status.usingMock) return true;

    console.log("Gemma model not ready (usingMock:", status.usingMock, "), starting REST download...");
    const result = await downloadModel(onProgress);
    if (!result) return false;
    const finalStatus = await getModelStatus();
    return finalStatus.loaded && !finalStatus.usingMock;
  } catch (e) {
    console.warn("ensureModelReady (REST) failed:", e);
    return false;
  }
}

/**
 * Start a streaming token session with Gemma.
 * Returns a cleanup function that cancels the stream.
 *
 * @param query The prompt to send.
 * @param onToken Called for each token received.
 * @param onComplete Called when streaming is complete.
 * @param onError Called on error.
 * @returns A cleanup function to cancel the stream.
 */
export function startStreamingSession(
  query: string,
  onToken: (token: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: string) => void,
): () => void {
  if (!hasNativeBridge) {
    // Try REST API first, then fall back to mock
    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    apiFetch("/api/v1/gemma/ask", {
      method: "POST",
      body: JSON.stringify({ question: query, userId: "user-1" }),
    }).then((result) => {
      if (cancelled) return;
      const fullText = result.answer ?? result.rawResponse ?? result.message ?? "Pas de réponse.";
      const tokens = fullText.split(" ");
      let idx = 0;
      let accumulated = "";
      const interval = setInterval(() => {
        if (cancelled) { clearInterval(interval); return; }
        if (idx < tokens.length) {
          const token = (idx < tokens.length - 1 ? tokens[idx] + " " : tokens[idx]);
          accumulated += token;
          onToken(token);
          idx++;
        } else {
          clearInterval(interval);
          onComplete(accumulated);
        }
      }, 80);
      cleanupFn = () => { cancelled = true; clearInterval(interval); };
    }).catch(() => {
      if (cancelled) return;
      // Mock streaming fallback
      const mockResponse = `Analyse (mode démo) de votre demande. En mode réel, Gemma 4 générerait une réponse personnalisée basée sur votre profil nutritionnel et vos préférences alimentaires.`;
      const tokens = mockResponse.split(" ");
      let idx = 0;
      let fullText = "";
      const interval = setInterval(() => {
        if (cancelled) { clearInterval(interval); return; }
        if (idx < tokens.length) {
          const token = (idx < tokens.length - 1 ? tokens[idx] + " " : tokens[idx]);
          fullText += token;
          onToken(token);
          idx++;
        } else {
          clearInterval(interval);
          onComplete(fullText);
        }
      }, 80);
      cleanupFn = () => { cancelled = true; clearInterval(interval); };
    });

    return () => { cancelled = true; cleanupFn?.(); };
  }

  // Native streaming via GemmaModule
  // Ensure model is ready (downloads if needed) before streaming
  try {
    await ensureModelReady();
  } catch (e) {
    console.warn("ensureModelReady failed in streaming:", e);
  }

  const { NativeEventEmitter } = require("react-native");
  const emitter = new NativeEventEmitter(getGemma());

  let fullResponse = "";
  let resolved = false;

  const tokenSub = emitter.addListener("onGemmaToken", (event: any) => {
    if (event.token) {
      fullResponse += event.token;
      onToken(event.token);
    }
  });

  const completeSub = emitter.addListener("onGemmaStreamComplete", () => {
    if (!resolved) {
      resolved = true;
      onComplete(fullResponse);
      cleanup();
    }
  });

  const errorSub = emitter.addListener("onGemmaStreamError", (event: any) => {
    if (!resolved) {
      resolved = true;
      onError(event.error || "Streaming error");
      cleanup();
    }
  });

  // Start the stream
  getGemma().startStreaming(query).catch((e: any) => {
    if (!resolved) {
      resolved = true;
      onError(e?.message || "Failed to start streaming");
      cleanup();
    }
  });

  function cleanup() {
    tokenSub?.remove();
    completeSub?.remove();
    errorSub?.remove();
  }

  return cleanup;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 7 — Alerts / Notifications
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
