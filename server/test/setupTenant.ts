import { randomUUID } from "node:crypto";

/**
 * Runs before each test file's modules load, which is the only point early
 * enough: DEFAULT_CHURCH_ID in server/db.ts reads CHURCH_ID at module scope.
 *
 * Only set when a database is configured. Without DATABASE_URL the integration
 * suites skip themselves and the unit tests never reach a database, so leaving
 * CHURCH_ID unset keeps their fixtures reading the ordinary default.
 */
if (process.env.DATABASE_URL) {
  process.env.CHURCH_ID = `test-${randomUUID()}`;
}
