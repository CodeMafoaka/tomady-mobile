/* ============================================================
   TOMADY — Service de base de données locale SQLite
   =============================================================
   Relations :
     users 1―* weight_entries  ✓
     users 1―* meal_entries    ✓
     users 1―* chat_messages   ✓

   Contrat :
     initDatabase()      → crée les tables si absentes
     getUser()           → objet USER complet (ou null si vide)
     saveUser(data)      → insert ou update l'utilisateur id=1
     getMealsForDate()   → repas pour une date donnée
     getTodayMeals()     → repas du jour
     addMealEntry()      → ajoute un repas
     deleteMealEntry()   → supprime un repas
     updateMealFeeling() → met à jour le ressenti
     getChatMessages()   → historique des conversations
     addChatMessage()    → ajoute un message
     clearChatMessages() → efface l'historique
     getWeightEntries()  → historique du poids
     addWeightEntry()    → ajoute une pesée
     deleteWeightEntry() → supprime une pesée
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
      id               INTEGER PRIMARY KEY DEFAULT 1,
      first_name       TEXT    NOT NULL DEFAULT '',
      last_name        TEXT    NOT NULL DEFAULT '',
      age              INTEGER,
      height_cm        INTEGER,
      weight_current   REAL,
      weight_start     REAL,
      weight_target    REAL,
      goal             TEXT    DEFAULT 'Perte de poids',
      calorie_goal     INTEGER DEFAULT 2000,
      activity_level   TEXT    DEFAULT 'modéré',
      region           TEXT    DEFAULT '',
      allergies        TEXT    DEFAULT '[]',
      intolerances     TEXT    DEFAULT '[]',
      conditions       TEXT    DEFAULT '[]',
      restricted_foods TEXT    DEFAULT '[]',
      forbidden_by_doctor TEXT DEFAULT '[]',
      created_at       TEXT    DEFAULT (datetime('now')),
      updated_at       TEXT    DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meal_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER DEFAULT 1,
      date       TEXT    NOT NULL DEFAULT (date('now')),
      meal_order INTEGER,
      name       TEXT    NOT NULL,
      time       TEXT,
      kcal       INTEGER,
      protein_g  REAL,
      carbs_g    REAL,
      fat_g      REAL,
      status     TEXT    DEFAULT 'good',
      feeling    TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `);

  // Index pour les requêtes fréquentes par date
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_meals_date
    ON meal_entries(user_id, date);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER DEFAULT 1,
      role       TEXT    NOT NULL,
      text_content TEXT  NOT NULL,
      card_kcal  INTEGER,
      card_p     REAL,
      card_c     REAL,
      card_f     REAL,
      card_note  TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_chat_date
    ON chat_messages(created_at);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weight_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER DEFAULT 1,
      kg         REAL    NOT NULL,
      date       TEXT    NOT NULL DEFAULT (date('now')),
      notes      TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_weight_date
    ON weight_entries(user_id, date);
  `);
}

/* ───────────────────────────────────────────
   UTILISATEUR
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

    // Totaux du jour — recalculés depuis meal_entries dans l'app
    caloriesConsumed: 0,
    protein: { consumed: 0, goal: Math.round((row.calorie_goal * 0.25) / 4) || 120 },
    carbs: { consumed: 0, goal: Math.round((row.calorie_goal * 0.45) / 4) || 220 },
    fat: { consumed: 0, goal: Math.round((row.calorie_goal * 0.30) / 9) || 65 },

    weight: {
      current: row.weight_current,
      start: row.weight_start || row.weight_current,
      target: row.weight_target || Math.round((row.weight_current || 68) * 0.9),
    },

    allergies: JSON.parse(row.allergies || "[]"),
    intolerances: JSON.parse(row.intolerances || "[]"),
    conditions: JSON.parse(row.conditions || "[]"),
    restrictedFoods: JSON.parse(row.restricted_foods || "[]"),
    forbiddenByDoctor: JSON.parse(row.forbidden_by_doctor || "[]"),
  };
}

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

/* ───────────────────────────────────────────
   REPAS (meal_entries)
   ─────────────────────────────────────────── */

/**
 * Récupère les repas pour une date donnée (format 'YYYY-MM-DD').
 * Retourne un tableau trié par meal_order puis id.
 */
export async function getMealsForDate(dateStr) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM meal_entries
     WHERE user_id = 1 AND date = ?
     ORDER BY meal_order ASC, id ASC`,
    [dateStr],
  );
  return rows.map(normalizeMealRow);
}

/**
 * Raccourci : repas du jour courant.
 */
export async function getTodayMeals() {
  const today = new Date().toISOString().split("T")[0];
  return getMealsForDate(today);
}

/**
 * Ajoute un repas et retourne son id.
 *
 * @param {object} meal
 * @param {string}  meal.name        — obligatoire
 * @param {number}  [meal.kcal]
 * @param {number}  [meal.protein_g]
 * @param {number}  [meal.carbs_g]
 * @param {number}  [meal.fat_g]
 * @param {string}  [meal.status]    — 'good' | 'warn' | 'bad'
 * @param {number}  [meal.meal_order]— 0‑3 (index du créneau)
 * @param {string}  [meal.time]      — HH:MM (auto si absent)
 * @param {string}  [meal.feeling]
 * @param {string}  [meal.date]      — YYYY-MM-DD (aujourd'hui si absent)
 */
export async function addMealEntry(meal) {
  const db = await getDb();
  const now = new Date();
  const timeStr =
    meal.time ||
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dateStr = meal.date || now.toISOString().split("T")[0];

  const result = await db.runAsync(
    `INSERT INTO meal_entries
      (user_id, date, meal_order, name, time, kcal, protein_g, carbs_g, fat_g, status, feeling)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      dateStr,
      meal.meal_order ?? null,
      meal.name || "",
      timeStr,
      meal.kcal ?? null,
      meal.protein_g ?? null,
      meal.carbs_g ?? null,
      meal.fat_g ?? null,
      meal.status || "good",
      meal.feeling || null,
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Met à jour le ressenti (feeling) d'un repas.
 */
/**
 * Supprime un repas par son id.
 */
export async function deleteMealEntry(id) {
  const db = await getDb();
  await db.runAsync("DELETE FROM meal_entries WHERE id = ?", [id]);
}

/**
 * Met à jour le ressenti (feeling) d'un repas.
 */
export async function updateMealFeeling(id, feeling) {
  const db = await getDb();
  await db.runAsync("UPDATE meal_entries SET feeling = ? WHERE id = ?", [
    feeling,
    id,
  ]);
}

/* ───────────────────────────────────────────
   CHAT (chat_messages)
   ─────────────────────────────────────────── */

/**
 * Récupère tous les messages du chat, du plus ancien au plus récent.
 */
export async function getChatMessages() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM chat_messages
     WHERE user_id = 1
     ORDER BY id ASC`,
  );
  return rows.map(normalizeChatRow);
}

/**
 * Ajoute un message dans l'historique.
 *
 * @param {object} msg
 * @param {string}  msg.role          — 'user' | 'assistant'
 * @param {string}  msg.text_content
 * @param {number}  [msg.card_kcal]
 * @param {number}  [msg.card_p]
 * @param {number}  [msg.card_c]
 * @param {number}  [msg.card_f]
 * @param {string}  [msg.card_note]
 */
export async function addChatMessage(msg) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO chat_messages
      (user_id, role, text_content, card_kcal, card_p, card_c, card_f, card_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      msg.role,
      msg.text_content || "",
      msg.card_kcal ?? null,
      msg.card_p ?? null,
      msg.card_c ?? null,
      msg.card_f ?? null,
      msg.card_note || null,
    ],
  );
}

/**
 * Efface tout l'historique des messages.
 */
export async function clearChatMessages() {
  const db = await getDb();
  await db.runAsync("DELETE FROM chat_messages WHERE user_id = 1");
}

/* ───────────────────────────────────────────
   POIDS (weight_entries)
   ─────────────────────────────────────────── */

/**
 * Récupère toutes les entrées de poids, triées par date décroissante.
 */
export async function getWeightEntries() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM weight_entries
     WHERE user_id = 1
     ORDER BY date DESC, id DESC`,
  );
  return rows.map(normalizeWeightRow);
}

/**
 * Récupère les entrées de poids pour une plage de jours.
 * @param {number} days — ex: 7, 30, 90, 365
 */
export async function getWeightEntriesSince(days) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM weight_entries
     WHERE user_id = 1
       AND date >= date('now', ?)
     ORDER BY date ASC, id ASC`,
    [`-${days} days`],
  );
  return rows.map(normalizeWeightRow);
}

/**
 * Ajoute une entrée de poids.
 */
export async function addWeightEntry(kg, dateStr) {
  const db = await getDb();
  const d = dateStr || new Date().toISOString().split("T")[0];
  await db.runAsync(
    `INSERT INTO weight_entries (user_id, kg, date) VALUES (?, ?, ?)`,
    [1, kg, d],
  );
}

/**
 * Supprime une entrée de poids.
 */
export async function deleteWeightEntry(id) {
  const db = await getDb();
  await db.runAsync("DELETE FROM weight_entries WHERE id = ?", [id]);
}

/* ───────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────── */

function normalizeMealRow(row) {
  return {
    id: row.id,
    name: row.name,
    time: row.time,
    kcal: row.kcal,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    status: row.status,
    feeling: row.feeling,
    meal_order: row.meal_order,
    date: row.date,
  };
}

function normalizeChatRow(row) {
  const msg = {
    from: row.role,
    text: row.text_content,
  };
  if (row.card_kcal !== null) {
    msg.card = {
      kcal: row.card_kcal,
      p: row.card_p,
      c: row.card_c,
      f: row.card_f,
      note: row.card_note,
    };
  }
  return msg;
}

function normalizeWeightRow(row) {
  return {
    id: row.id,
    kg: row.kg,
    date: row.date,
    notes: row.notes,
  };
}
