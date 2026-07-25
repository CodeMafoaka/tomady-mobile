/* ============================================================
   TOMADY — Service de base de données locale SQLite
   =============================================================
   Relations :
     users 1―* weight_entries (à venir)
     users 1―* meal_entries   (à venir)
     users 1―* chat_messages  (à venir)

   Contrat :
     initDatabase()   → crée les tables si absentes
     getUser()        → objet USER complet (ou null si vide)
     saveUser(data)   → insert ou update l'utilisateur id=1
   ============================================================ */

import * as SQLite from "expo-sqlite";

/** Instance réutilisée de la base (singleton) */
let _db = null;

async function getDb() {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync("tomady.db");
  }
  return _db;
}

/* ───────────────────────────────────────────
   Initialisation : création des tables
   ─────────────────────────────────────────── */

export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY DEFAULT 1,
      first_name      TEXT    NOT NULL DEFAULT '',
      last_name       TEXT    NOT NULL DEFAULT '',
      age             INTEGER,
      height_cm       INTEGER,
      weight_current  REAL,
      weight_start    REAL,
      weight_target   REAL,
      goal            TEXT    DEFAULT 'Perte de poids',
      calorie_goal    INTEGER DEFAULT 2000,
      activity_level  TEXT    DEFAULT 'modéré',
      region          TEXT    DEFAULT '',
      allergies       TEXT    DEFAULT '[]',
      intolerances    TEXT    DEFAULT '[]',
      conditions      TEXT    DEFAULT '[]',
      restricted_foods TEXT   DEFAULT '[]',
      forbidden_by_doctor TEXT DEFAULT '[]',
      created_at      TEXT    DEFAULT (datetime('now')),
      updated_at      TEXT    DEFAULT (datetime('now'))
    );
  `);
}

/* ───────────────────────────────────────────
   Lecture du profil utilisateur
   Retourne un objet USER complet (compatible mockData)
   ou null si la table est vide.
   ─────────────────────────────────────────── */

export async function getUser() {
  const db = await getDb();
  const row = await db.getFirstAsync("SELECT * FROM users WHERE id = 1");
  if (!row) return null;

  return {
    name: row.first_name,
    firstName: row.first_name,
    lastName: row.last_name,
    age: row.age,
    goal: row.goal,
    calorieGoal: row.calorie_goal,
    activityLevel: row.activity_level,
    region: row.region,
    height: row.height_cm,

    // Nombres du jour — mis à zéro car calculés depuis meal_entries plus tard
    caloriesConsumed: 0,
    protein: { consumed: 0, goal: Math.round((row.calorie_goal * 0.25) / 4) || 120 },
    carbs: { consumed: 0, goal: Math.round((row.calorie_goal * 0.45) / 4) || 220 },
    fat: { consumed: 0, goal: Math.round((row.calorie_goal * 0.30) / 9) || 65 },

    // Poids
    weight: {
      current: row.weight_current,
      start: row.weight_start || row.weight_current,
      target: row.weight_target || Math.round((row.weight_current || 68) * 0.9),
    },

    // Tableaux JSON → parsés
    allergies: JSON.parse(row.allergies || "[]"),
    intolerances: JSON.parse(row.intolerances || "[]"),
    conditions: JSON.parse(row.conditions || "[]"),
    restrictedFoods: JSON.parse(row.restricted_foods || "[]"),
    forbiddenByDoctor: JSON.parse(row.forbidden_by_doctor || "[]"),
  };
}

/* ───────────────────────────────────────────
   Sauvegarde du profil utilisateur
   Insert si absent, Update si existant (id=1).
   ─────────────────────────────────────────── */

export async function saveUser(userData) {
  if (!userData) return;

  const db = await getDb();

  const row = {
    first_name: userData.firstName || userData.name || "",
    last_name: userData.lastName || "",
    age: userData.age ?? null,
    height_cm: userData.height ?? null,
    weight_current: userData.weight?.current ?? null,
    weight_start: userData.weight?.start ?? null,
    weight_target: userData.weight?.target ?? null,
    goal: userData.goal || "Perte de poids",
    calorie_goal: userData.calorieGoal ?? 2000,
    activity_level: userData.activityLevel || "modéré",
    region: userData.region || "",
    allergies: JSON.stringify(userData.allergies || []),
    intolerances: JSON.stringify(userData.intolerances || []),
    conditions: JSON.stringify(userData.conditions || []),
    restricted_foods: JSON.stringify(userData.restrictedFoods || []),
    forbidden_by_doctor: JSON.stringify(userData.forbiddenByDoctor || []),
  };

  const existing = await db.getFirstAsync("SELECT id FROM users WHERE id = 1");

  if (existing) {
    await db.runAsync(
      `UPDATE users SET
        first_name = ?, last_name = ?, age = ?, height_cm = ?,
        weight_current = ?, weight_start = ?, weight_target = ?,
        goal = ?, calorie_goal = ?, activity_level = ?, region = ?,
        allergies = ?, intolerances = ?, conditions = ?,
        restricted_foods = ?, forbidden_by_doctor = ?,
        updated_at = datetime('now')
      WHERE id = 1`,
      [
        row.first_name, row.last_name, row.age, row.height_cm,
        row.weight_current, row.weight_start, row.weight_target,
        row.goal, row.calorie_goal, row.activity_level, row.region,
        row.allergies, row.intolerances, row.conditions,
        row.restricted_foods, row.forbidden_by_doctor,
      ],
    );
  } else {
    await db.runAsync(
      `INSERT INTO users (
        first_name, last_name, age, height_cm,
        weight_current, weight_start, weight_target,
        goal, calorie_goal, activity_level, region,
        allergies, intolerances, conditions,
        restricted_foods, forbidden_by_doctor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.first_name, row.last_name, row.age, row.height_cm,
        row.weight_current, row.weight_start, row.weight_target,
        row.goal, row.calorie_goal, row.activity_level, row.region,
        row.allergies, row.intolerances, row.conditions,
        row.restricted_foods, row.forbidden_by_doctor,
      ],
    );
  }
}
