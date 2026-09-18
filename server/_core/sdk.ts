import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Request } from "express";
import * as db from "../db";
import { ENV } from "./env";
import type { User } from "../../drizzle/schema";

const clerkClient = createClerkClient({ secretKey: ENV.clerkSecretKey });

export type AuthenticatedUser = User;

export const sdk = {
  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const authHeader = req.headers.authorization ?? "";
    const sessionToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (req.cookies?.["__session"] ?? "");

    if (!sessionToken) {
      throw new Error("No session token provided");
    }

    // Verify token with Clerk
    const payload = await verifyToken(sessionToken, {
      secretKey: ENV.clerkSecretKey,
    });
    const clerkUserId = payload.sub;

    if (!clerkUserId) {
      throw new Error("Invalid session token: missing sub");
    }

    // Get user from DB if available
    let user: User | undefined;
    try {
      user = await db.getUserByOpenId(clerkUserId);
    } catch (e) {
      console.warn("[Database] getUserByOpenId failed:", e);
      user = undefined;
    }

    if (!user) {
      let clerkUser: any = null;
      try {
        clerkUser = await clerkClient.users.getUser(clerkUserId);
      } catch (err) {
        console.warn("[Clerk] Failed to fetch user from Clerk API:", err);
      }

      const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
      const name =
        `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
        clerkUser?.username ||
        "Admin";

      try {
        await db.upsertUser({
          openId: clerkUserId,
          name,
          email,
          loginMethod: clerkUser?.externalAccounts?.[0]?.provider ?? "email",
          role: "admin",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByOpenId(clerkUserId);
      } catch (err) {
        console.warn("[Database] Failed to upsert user:", err);
      }

      // Safe fallback if DB is not connected or still initializing
      if (!user) {
        user = {
          id: 1,
          openId: clerkUserId,
          name,
          email,
          loginMethod: "clerk",
          role: "admin",
          churchRole: "SUPER_ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };
      }
    }

    try {
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    } catch {}

    return user;
  },
};
