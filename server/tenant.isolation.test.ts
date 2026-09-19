import { describe, expect, it, vi, afterEach } from "vitest";
import { sql } from "drizzle-orm";

/**
 * Locks in the isolation that keeps an integration run away from real data.
 *
 * Before this existed, the integration suites wrote under "demo-church", the
 * tenant the running application uses, so a run pointed at a live database
 * mixed test rows into real ones.
 *
 * Every loader below pins NODE_ENV explicitly. These modules read it at module
 * scope, so a test that inherited the ambient value would pass on a developer
 * machine and fail in the Vercel build, where NODE_ENV is "production".
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Load server/db.ts under a chosen environment and tenant. */
async function loadDb(nodeEnv: string, churchId: string) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("CHURCH_ID", churchId);
  return import("./db");
}

/** Load the tenant helper alone; it never reads NODE_ENV. */
async function loadTenant(churchId: string) {
  vi.resetModules();
  vi.stubEnv("CHURCH_ID", churchId);
  return import("./test/tenant");
}

describe("DEFAULT_CHURCH_ID", () => {
  it("falls back to demo-church when CHURCH_ID is unset", async () => {
    const db = await loadDb("test", "");
    expect(db.DEFAULT_CHURCH_ID).toBe("demo-church");
  });

  it("takes the tenant from CHURCH_ID when set", async () => {
    const db = await loadDb("test", "test-1234");
    expect(db.DEFAULT_CHURCH_ID).toBe("test-1234");
  });
});

describe("the production boot guard", () => {
  it("refuses to start when a test tenant reaches production", async () => {
    await expect(loadDb("production", "test-abc")).rejects.toThrow(/CHURCH_ID/);
  });

  it("names the offending tenant and the remedy", async () => {
    await expect(loadDb("production", "test-abc")).rejects.toThrow(
      /"test-abc".*Unset CHURCH_ID/s
    );
  });

  it("allows the default tenant in production", async () => {
    const db = await loadDb("production", "");
    expect(db.DEFAULT_CHURCH_ID).toBe("demo-church");
  });

  it("allows a non-test tenant in production", async () => {
    const db = await loadDb("production", "second-church");
    expect(db.DEFAULT_CHURCH_ID).toBe("second-church");
  });

  it("stays out of the way outside production, where the suites run", async () => {
    const db = await loadDb("test", "test-abc");
    expect(db.DEFAULT_CHURCH_ID).toBe("test-abc");
  });

  it("stays out of the way in development", async () => {
    const db = await loadDb("development", "test-abc");
    expect(db.DEFAULT_CHURCH_ID).toBe("test-abc");
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
    const tenant = await loadTenant("demo-church");
    const db = recordingDb();
    await tenant.purgeTenant(db);
    expect(db.statements).toHaveLength(0);
  });

  it("refuses to delete anything for a tenant that merely contains 'test'", async () => {
    const tenant = await loadTenant("not-a-test-tenant");
    const db = recordingDb();
    await tenant.purgeTenant(db);
    expect(db.statements).toHaveLength(0);
  });

  it("deletes for an isolated tenant", async () => {
    const tenant = await loadTenant("test-abc");
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
      const tenant = await loadTenant(value);
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
