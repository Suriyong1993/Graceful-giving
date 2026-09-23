/**
 * Features whose screens exist but whose backend does not yet.
 *
 * budgets: the budget_plans table exists, but no tRPC router reads or
 * writes it, so the Budgets pages and the Home plan card can only show an
 * empty state. Keep them out of the menu, the router and Home until the
 * API and the approval workflow exist; then set this to true.
 */
export const FEATURES = {
  budgets: false,
} as const;
