/**
 * Creates a throwaway database for the integration suite and drops it
 * afterwards, so tests never touch the development database.
 *
 * The Postgres server from docker-compose is reused; only the database inside
 * it is created and dropped, which takes about a second.
 */
import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";
import pg from "pg";
import { databaseNameFromUrl, isTestDatabaseUrl } from "./db-guard";

const apiRoot = path.resolve(__dirname, "../..");

/** Swap the database name in a Postgres connection URL. */
function withDatabase(url: string, database: string): string {
  return url.replace(/\/([^/?]+)(\?|$)/, `/${database}$2`);
}

async function withAdminClient(
  url: string,
  fn: (client: pg.Client) => Promise<void>,
): Promise<void> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await fn(client);
  } finally {
    await client.end();
  }
}

export default async function globalSetup() {
  // CI supplies a test DATABASE_URL directly; locally we derive one from .env
  // so nobody has to maintain a second connection string by hand.
  if (!process.env.DATABASE_URL) {
    config({ path: path.join(apiRoot, ".env") });
  }

  // The unit-test job (`test:unit`) runs with no database at all. Nothing to
  // provision, and the guard still stops anything that tries to truncate.
  const configured = process.env.DATABASE_URL;
  if (!configured) return;

  // Never reuse the configured database: derive a sibling <name>_test.
  const testUrl = isTestDatabaseUrl(configured)
    ? configured
    : withDatabase(configured, `${databaseNameFromUrl(configured)}_test`);
  const testDb = databaseNameFromUrl(testUrl)!;
  process.env.DATABASE_URL = testUrl;

  const adminUrl = withDatabase(testUrl, "postgres");
  await withAdminClient(adminUrl, async (client) => {
    await client.query(`DROP DATABASE IF EXISTS "${testDb}" WITH (FORCE)`);
    await client.query(`CREATE DATABASE "${testDb}"`);
  });

  // `migrate deploy` (not `db push`): applies the committed migrations, so the
  // test schema is exactly what production gets, and it runs non-interactively.
  execSync("npx prisma migrate deploy", {
    cwd: apiRoot,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });

  return async () => {
    await withAdminClient(adminUrl, async (client) => {
      await client.query(`DROP DATABASE IF EXISTS "${testDb}" WITH (FORCE)`);
    });
  };
}
