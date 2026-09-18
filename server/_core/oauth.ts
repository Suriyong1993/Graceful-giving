import type { Express } from "express";

// OAuth routes previously handled Manus SSO login.
// Auth is now managed by Clerk — no server-side OAuth callback needed.
// Clerk validates tokens on each API request via sdk.authenticateRequest().
export function registerOAuthRoutes(_app: Express) {
  // No-op: Clerk handles authentication entirely client-side + token verification.
}
