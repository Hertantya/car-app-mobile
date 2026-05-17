import * as SQLite from 'expo-sqlite';
import { Car, UserPreference } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('car_app.db');
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = await getDb();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS cars (
      id        INTEGER PRIMARY KEY,
      brand     TEXT NOT NULL,
      model     TEXT NOT NULL,
      type      TEXT NOT NULL,
      image_url TEXT,
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS user_preferences (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id     INTEGER NOT NULL UNIQUE,
      action     TEXT NOT NULL CHECK(action IN ('like','skip')),
      synced     INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
};


export const saveCarsToLocal = async (cars: Car[]): Promise<void> => {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    for (const car of cars) {
      await database.runAsync(
        `INSERT OR REPLACE INTO cars (id, brand, model, type, image_url, synced_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [car.id, car.brand, car.model, car.type, car.image_url ?? null, now]
      );
    }
  });
};

export const getCarsFromLocal = async (): Promise<Car[]> => {
  const database = await getDb();
  return await database.getAllAsync<Car>(
    'SELECT id, brand, model, type, image_url FROM cars ORDER BY id ASC'
  );
};

export const getLocalCarCount = async (): Promise<number> => {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM cars'
  );
  return result?.count ?? 0;
};


export const savePreferenceLocal = async (
  carId: number,
  action: 'like' | 'skip'
): Promise<void> => {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO user_preferences (car_id, action, synced)
     VALUES (?, ?, 0)
     ON CONFLICT(car_id) DO UPDATE SET action = excluded.action, synced = 0`,
    [carId, action]
  );
};

export const getUnsyncedPreferences = async (): Promise<UserPreference[]> => {
  const database = await getDb();
  return await database.getAllAsync<UserPreference>(
    'SELECT * FROM user_preferences WHERE synced = 0'
  );
};

export const markPreferencesSynced = async (carIds: number[]): Promise<void> => {
  if (carIds.length === 0) return;
  const database = await getDb();
  const placeholders = carIds.map(() => '?').join(',');
  await database.runAsync(
    `UPDATE user_preferences SET synced = 1 WHERE car_id IN (${placeholders})`,
    carIds
  );
};

export const getSwiperCarIds = async (): Promise<number[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<{ car_id: number }>(
    'SELECT car_id FROM user_preferences'
  );
  return rows.map((r) => r.car_id);
};

export const getLocalReport = async () => {
  const database = await getDb();

  const brandRow = await database.getFirstAsync<{ brand: string; total: number }>(
    `SELECT c.brand, COUNT(*) as total
     FROM user_preferences up
     JOIN cars c ON c.id = up.car_id
     WHERE up.action = 'like'
     GROUP BY c.brand ORDER BY total DESC LIMIT 1`
  );

  const modelRow = await database.getFirstAsync<{ brand: string; model: string; total: number }>(
    `SELECT c.brand, c.model, COUNT(*) as total
     FROM user_preferences up
     JOIN cars c ON c.id = up.car_id
     WHERE up.action = 'like'
     GROUP BY c.brand, c.model ORDER BY total DESC LIMIT 1`
  );

  const typeRow = await database.getFirstAsync<{ type: string; total: number }>(
    `SELECT c.type, COUNT(*) as total
     FROM user_preferences up
     JOIN cars c ON c.id = up.car_id
     WHERE up.action = 'like'
     GROUP BY c.type ORDER BY total DESC LIMIT 1`
  );

  const likesRow = await database.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM user_preferences WHERE action = 'like'`
  );

  const skipsRow = await database.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM user_preferences WHERE action = 'skip'`
  );

  return {
    most_liked_brand: brandRow?.brand ?? null,
    most_liked_model: modelRow ? `${modelRow.brand} ${modelRow.model}` : null,
    most_liked_type:  typeRow?.type ?? null,
    total_likes: likesRow?.total ?? 0,
    total_skips: skipsRow?.total ?? 0,
  };
};

export const clearLocalData = async (): Promise<void> => {
  const database = await getDb();
  await database.execAsync(
    'DELETE FROM user_preferences; DELETE FROM cars;'
  );
};
