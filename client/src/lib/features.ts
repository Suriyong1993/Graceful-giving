/**
 * Features whose screens exist but whose backend does not yet.
 *
 * budgets: the budget_plans table has a full tRPC router (server/routers.ts
 * `budgets`) and real queries in server/db.ts, so the Budgets pages and the
 * Home plan card are backed by live data. Keep this true; flip it back to
 * false only if the budgets API is intentionally pulled again.
 */
export const FEATURES = {
  budgets: true,
} as const;
