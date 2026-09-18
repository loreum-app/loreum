/**
 * The integration suite empties every table between tests. Pointed at a
 * development database that is a data-loss bug, not a test run: it deletes the
 * worlds you are working on and the sessions your browser holds.
 *
 * So the suite refuses to run destructive SQL unless the database it is
 * connected to is clearly a throwaway test database.
 */

const TEST_DB_SUFFIX = "_test";

/** The database name from a Postgres connection URL, or null if unparseable. */
export function databaseNameFromUrl(url: string): string | null {
  const match = /\/([^/?]+)(\?|$)/.exec(url);
  return match?.[1] ?? null;
}

export function isTestDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  const name = databaseNameFromUrl(url);
  return name !== null && name.endsWith(TEST_DB_SUFFIX);
}

/**
 * Throws unless DATABASE_URL names a test database. Call before anything that
 * destroys data.
 */
export function assertTestDatabase(url = process.env.DATABASE_URL): void {
  if (isTestDatabaseUrl(url)) return;

  const name = url ? (databaseNameFromUrl(url) ?? url) : "(DATABASE_URL unset)";
  throw new Error(
    `Refusing to run destructive test SQL against "${name}": the database name ` +
      `must end in "${TEST_DB_SUFFIX}". This guard exists because the suite ` +
      `truncates every table, which would delete development data. Point ` +
      `DATABASE_URL at a dedicated test database (see apps/api/.env.test).`,
  );
}
