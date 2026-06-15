import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getDb } from "../lib/db/turso";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCreateSql(sql: string, tableName: string, tmpName: string): string {
  const tableNamePattern = new RegExp(`^(CREATE TABLE\\s+)(?:"?${escapeRegExp(tableName)}"?)`, "i");
  const replaceTable = sql.replace(tableNamePattern, `$1"${tmpName}"`);
  return replaceTable.replace(/"users_old"/g, '"users"').replace(/\busers_old\b/g, 'users');
}

(async () => {
  const db = getDb();
  try {
    const tablesResult = await db.execute({
      sql: "SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%users_old%'",
      args: [],
    });
    const tables = (tablesResult.rows as any[]).map((row) => ({ name: row.name as string, sql: row.sql as string }));
    if (tables.length === 0) {
      console.log('No tables with users_old references found.');
      return;
    }

    console.log(`Found ${tables.length} affected tables:`);
    for (const t of tables) {
      console.log(' -', t.name);
    }

    await db.execute({ sql: 'PRAGMA foreign_keys=OFF', args: [] });

    for (const table of tables) {
      const tmpTable = `${table.name}_fixtmp`;
      const createSql = normalizeCreateSql(table.sql, table.name, tmpTable);

      console.log(`Recreating ${table.name} via ${tmpTable}`);

      const indexResult = await db.execute({
        sql: "SELECT name, type, sql FROM sqlite_master WHERE tbl_name = ? AND type IN ('index','trigger') AND sql IS NOT NULL",
        args: [table.name],
      });
      const extraDefs = (indexResult.rows as any[]).map((row) => ({ name: row.name as string, type: row.type as string, sql: row.sql as string }));

      await db.execute({ sql: createSql, args: [] });

      const tableInfo = await db.execute({ sql: `PRAGMA table_info('${table.name}')`, args: [] });
      const cols = (tableInfo.rows as any[]).map((row) => `"${row.name}"`).join(", ");
      await db.execute({ sql: `INSERT INTO "${tmpTable}" (${cols}) SELECT ${cols} FROM "${table.name}"`, args: [] });
      await db.execute({ sql: `DROP TABLE "${table.name}"`, args: [] });
      await db.execute({ sql: `ALTER TABLE "${tmpTable}" RENAME TO "${table.name}"`, args: [] });

      for (const extra of extraDefs) {
        // Recreate indexes/triggers for the new table
        const fixedSql = extra.sql.replace(new RegExp(`\\b${escapeRegExp(table.name)}\\b`, 'g'), `"${table.name}"`);
        await db.execute({ sql: fixedSql, args: [] });
      }
    }

    await db.execute({ sql: 'PRAGMA foreign_keys=ON', args: [] });
    console.log('Database schema repair complete.');
  } catch (error) {
    console.error('Repair failed:', error);
    process.exit(1);
  }
})();
