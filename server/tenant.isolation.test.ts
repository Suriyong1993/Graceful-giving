import { describe, expect, it, vi, afterEach } from "vitest";
import { sql } from "drizzle-orm";

/**
 * Locks in the isolation that keeps an integration run away from real data.
 *
 * Before this existed, the integration suites wrote under "demo-church", the
 * tenant the running application uses, so a run pointed at a live database
 * mixed test rows into real ones.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Re-import a module with CHURCH_ID stubbed, since both read it at module scope. */
async function loadWithChurchId(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) vi.stubEnv("CHURCH_ID", "");
  else vi.stubEnv("CHURCH_ID", value);
  return {
    db: await import("./db"),
    tenant: await import("./test/tenant"),
  };
}

describe("DEFAULT_CHURCH_ID", () => {
  it("falls back to demo-church when CHURCH_ID is unset", async () => {
    const { db } = await loadWithChurchId(undefined);
    expect(db.DEFAULT_CHURCH_ID).toBe("demo-church");
  });

  it("takes the tenant from CHURCH_ID when set", async () => {
    const { db } = await loadWithChurchId("test-1234");
    expect(db.DEFAULT_CHURCH_ID).toBe("test-1234");
  });
});

describe("purgeTenant", () => {
  function recordingDb() {
    const statements: unknown[] = [];
    return {
      statements,
      execute: async (q: ReturnType<typeof sql>) => {
        statements.push(q);
        return undefined;
      },
    };
  }

  it("refuses to delete anything when the tenant is not isolated", async () => {
    const { tenant } = await loadWithChurchId("demo-church");
    const db = recordingDb();
    await tenant.purgeTenant(db);
    expect(db.statements).toHaveLength(0);
  });

  it("refuses to delete anything for a tenant that merely contains 'test'", async () => {
    const { tenant } = await loadWithChurchId("not-a-test-tenant");
    const db = recordingDb();
    await tenant.purgeTenant(db);
    expect(db.statements).toHaveLength(0);
  });

  it("deletes for an isolated tenant, children before parents", async () => {
    const { tenant } = await loadWithChurchId("test-abc");
    const db = recordingDb();
    await tenant.purgeTenant(db);

    // cash_counts (no churchId column) plus every tenant-scoped table.
    expect(db.statements.length).toBeGreaterThan(10);
  });

  it("marks only a test- prefixed tenant as isolated", async () => {
    for (const [value, expected] of [
      ["test-abc", true],
      ["demo-church", false],
      ["production", false],
      ["my-test-church", false],
    ] as const) {
      const { tenant } = await loadWithChurchId(value);
      expect(tenant.isIsolatedTenant, value).toBe(expected);
    }
  });
});

describe("the setup file", () => {
  it("only assigns a tenant when a database is configured", async () => {
    // Without DATABASE_URL the integration suites skip and nothing reaches a
    // database, so CHURCH_ID stays unset and fixtures use the ordinary default.
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("CHURCH_ID", "");
    await import("./test/setupTenant");
    expect(process.env.CHURCH_ID).toBeFalsy();
  });

  it("assigns a unique test- tenant when DATABASE_URL is present", async () => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "postgresql://user@host:5432/db");
    vi.stubEnv("CHURCH_ID", "");
    await import("./test/setupTenant");
    expect(process.env.CHURCH_ID).toMatch(/^test-[0-9a-f-]{36}$/);
  });
});
