/**
 * In-memory SQLite mock for tests.
 * Replaces lib/db/turso so API routes never hit a real Turso instance.
 */

type Row = Record<string, unknown>;

const store: Map<string, Row[]> = new Map();

function tableRows(table: string): Row[] {
  if (!store.has(table)) store.set(table, []);
  return store.get(table)!;
}

// Very small SQL parser — handles SELECT, INSERT, UPDATE, DELETE on a single table.
function parseTable(sql: string): string {
  const m =
    sql.match(/FROM\s+(\w+)/i) ||
    sql.match(/INTO\s+(\w+)/i) ||
    sql.match(/UPDATE\s+(\w+)/i) ||
    sql.match(/DELETE\s+FROM\s+(\w+)/i);
  return m?.[1] ?? "";
}

export function seedTable(table: string, rows: Row[]): void {
  store.set(table, [...rows]);
}

export function clearStore(): void {
  store.clear();
}

export function getTableRows(table: string): Row[] {
  return tableRows(table);
}

// Mock implementations exposed as jest.fn() so tests can assert call counts
export const mockQuery = jest.fn(async (sql: string, args: unknown[] = []): Promise<Row[]> => {
  const table = parseTable(sql);
  const rows = tableRows(table);

  // Support basic WHERE id = ? filtering
  const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
  if (whereMatch && args.length) {
    const col = whereMatch[1];
    return rows.filter((r) => String(r[col]) === String(args[0]));
  }
  return rows;
});

export const mockQueryOne = jest.fn(async (sql: string, args: unknown[] = []): Promise<Row | null> => {
  const results = await mockQuery(sql, args);
  return results[0] ?? null;
});

export const mockExecute = jest.fn(async (_sql: string, _args: unknown[] = []) => ({
  rowsAffected: 1,
  lastInsertRowid: BigInt(1),
}));

// Call this in beforeEach to reset call history and the store
export function resetDb(): void {
  clearStore();
  mockQuery.mockClear();
  mockQueryOne.mockClear();
  mockExecute.mockClear();
}
