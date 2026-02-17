/**
 * SQLite with OPFS Setup
 *
 * Using SQLite in the browser with wa-sqlite and OPFS backend.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Database {
  exec(sql: string, params?: any[]): Promise<any[][]>;
  run(
    sql: string,
    params?: any[],
  ): Promise<{ changes: number; lastInsertRowid: number }>;
  get<T>(sql: string, params?: any[]): Promise<T | undefined>;
  all<T>(sql: string, params?: any[]): Promise<T[]>;
  close(): Promise<void>;
}

export interface SQLiteConfig {
  filename: string;
  poolSize?: number;
}

// ============================================================================
// WA-SQLITE SETUP
// ============================================================================

/**
 * Initialize wa-sqlite with OPFS backend
 */
export async function createDatabase(config: SQLiteConfig): Promise<Database> {
  // Dynamic imports for wa-sqlite
  const { default: SQLiteESMFactory } = await import('wa-sqlite');
  const { OPFSCoopSyncVFS } =
    await import('wa-sqlite/src/examples/OPFSCoopSyncVFS.js');

  // Initialize SQLite
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module);

  // Register OPFS VFS
  const vfs = await OPFSCoopSyncVFS.create(config.filename, module);
  sqlite3.vfs_register(vfs, true);

  // Open database
  const db = await sqlite3.open_v2(config.filename);

  return createDatabaseWrapper(sqlite3, db);
}

/**
 * Create wrapper with Promise-based API
 */
function createDatabaseWrapper(sqlite3: any, db: number): Database {
  return {
    async exec(sql: string, params: any[] = []): Promise<any[][]> {
      const results: any[][] = [];

      await sqlite3.exec(
        db,
        sql,
        (row: any[]) => {
          results.push(row);
        },
        params,
      );

      return results;
    },

    async run(
      sql: string,
      params: any[] = [],
    ): Promise<{ changes: number; lastInsertRowid: number }> {
      await sqlite3.exec(db, sql, undefined, params);

      return {
        changes: sqlite3.changes(db),
        lastInsertRowid: sqlite3.last_insert_rowid(db),
      };
    },

    async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
      const rows = await this.all<T>(sql, params);
      return rows[0];
    },

    async all<T>(sql: string, params: any[] = []): Promise<T[]> {
      const results: T[] = [];
      const columns: string[] = [];

      await sqlite3.exec(
        db,
        sql,
        (row: any[], cols: string[]) => {
          if (columns.length === 0) {
            columns.push(...cols);
          }

          const obj: any = {};
          columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          results.push(obj);
        },
        params,
      );

      return results;
    },

    async close(): Promise<void> {
      await sqlite3.close(db);
    },
  };
}

// ============================================================================
// ALTERNATIVE: SQL.JS SETUP
// ============================================================================

/**
 * Initialize sql.js (simpler but less performant)
 */
export async function createSqlJsDatabase(): Promise<Database> {
  const initSqlJs = (await import('sql.js')).default;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  // Try to load existing database from OPFS
  let data: Uint8Array | undefined;
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('database.sqlite');
    const file = await fileHandle.getFile();
    data = new Uint8Array(await file.arrayBuffer());
  } catch {
    // Database doesn't exist yet
  }

  const db = new SQL.Database(data);

  return createSqlJsWrapper(db);
}

function createSqlJsWrapper(db: any): Database {
  return {
    async exec(sql: string, params: any[] = []): Promise<any[][]> {
      const stmt = db.prepare(sql);
      stmt.bind(params);

      const results: any[][] = [];
      while (stmt.step()) {
        results.push(stmt.get());
      }
      stmt.free();

      return results;
    },

    async run(
      sql: string,
      params: any[] = [],
    ): Promise<{ changes: number; lastInsertRowid: number }> {
      db.run(sql, params);

      return {
        changes: db.getRowsModified(),
        lastInsertRowid:
          db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || 0,
      };
    },

    async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
      const rows = await this.all<T>(sql, params);
      return rows[0];
    },

    async all<T>(sql: string, params: any[] = []): Promise<T[]> {
      const stmt = db.prepare(sql);
      stmt.bind(params);

      const columns = stmt.getColumnNames();
      const results: T[] = [];

      while (stmt.step()) {
        const row = stmt.get();
        const obj: any = {};
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        results.push(obj);
      }
      stmt.free();

      return results;
    },

    async close(): Promise<void> {
      // Save to OPFS before closing
      const data = db.export();
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle('database.sqlite', {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();

      db.close();
    },
  };
}

// ============================================================================
// REPOSITORY PATTERN
// ============================================================================

export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repository<T extends Entity> {
  findById(id: string): Promise<T | undefined>;
  findAll(): Promise<T[]>;
  findWhere(where: Partial<T>): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
}

export function createRepository<T extends Entity>(
  db: Database,
  tableName: string,
): Repository<T> {
  return {
    async findById(id: string): Promise<T | undefined> {
      return db.get<T>(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    },

    async findAll(): Promise<T[]> {
      return db.all<T>(`SELECT * FROM ${tableName} ORDER BY createdAt DESC`);
    },

    async findWhere(where: Partial<T>): Promise<T[]> {
      const keys = Object.keys(where);
      const conditions = keys.map((k) => `${k} = ?`).join(' AND ');
      const values = Object.values(where);

      return db.all<T>(
        `SELECT * FROM ${tableName} WHERE ${conditions}`,
        values,
      );
    },

    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const fullData = { ...data, id, createdAt: now, updatedAt: now };
      const keys = Object.keys(fullData);
      const placeholders = keys.map(() => '?').join(', ');
      const values = Object.values(fullData);

      await db.run(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
        values,
      );

      return fullData as T;
    },

    async update(id: string, data: Partial<T>): Promise<T | undefined> {
      const now = new Date().toISOString();
      const updateData = { ...data, updatedAt: now };

      const keys = Object.keys(updateData);
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      const values = [...Object.values(updateData), id];

      const result = await db.run(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        values,
      );

      if (result.changes === 0) return undefined;

      return this.findById(id);
    },

    async delete(id: string): Promise<boolean> {
      const result = await db.run(`DELETE FROM ${tableName} WHERE id = ?`, [
        id,
      ]);
      return result.changes > 0;
    },
  };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

export async function example() {
  // Initialize database
  const db = await createDatabase({ filename: 'myapp.db' });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create repository
  interface User extends Entity {
    email: string;
    name: string;
  }

  const users = createRepository<User>(db, 'users');

  // CRUD operations
  const user = await users.create({
    email: 'alice@example.com',
    name: 'Alice',
  });
  console.log('Created:', user);

  const found = await users.findById(user.id);
  console.log('Found:', found);

  await users.update(user.id, { name: 'Alice Smith' });

  const all = await users.findAll();
  console.log('All users:', all);

  await users.delete(user.id);

  // Close database
  await db.close();
}
