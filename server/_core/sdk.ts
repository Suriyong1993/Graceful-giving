import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Request } from "express";
import * as db from "../db";
import { ENV } from "./env";
import type { User } from "../../drizzle/schema";

const clerkClient = createClerkClient({ secretKey: ENV.clerkSecretKey });

export type AuthenticatedUser = User;

export const sdk = {
  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    // Verify Clerk session token from Authorization header or __session cookie
    const authHeader = req.headers.authorization ?? "";
    const sessionToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (req.cookies?.["__session"] ?? "");

    if (!sessionToken) {
      throw new Error("No session token provided");
    }

    // Verify with Clerk
    const payload = await verifyToken(sessionToken, {
      secretKey: ENV.clerkSecretKey,
    });
    const clerkUserId = payload.sub;

    if (!clerkUserId) {
      throw new Error("Invalid session token");
    }

    // Get or create user in our DB
    let user = await db.getUserByOpenId(clerkUserId);

    if (!user) {
      // Fetch user info from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? null;
      const name =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        clerkUser.username ||
        null;

      await db.upsertUser({
        openId: clerkUserId,
        name,
        email,
        loginMethod: clerkUser.externalAccounts[0]?.provider ?? "email",
        lastSignedIn: new Date(),
      });

      user = await db.getUserByOpenId(clerkUserId);
    }

    if (!user) {
      throw new Error("User not found after upsert");
    }

    // Update last signed in
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

    return user;
  },
};
