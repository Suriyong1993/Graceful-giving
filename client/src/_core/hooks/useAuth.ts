import { useUser, useClerk } from "@clerk/clerk-react";
import { useCallback } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const logout = useCallback(async () => {
    await signOut({ redirectUrl: "/login" });
  }, [signOut]);

  return {
    user: isSignedIn && user
      ? {
          id: 0, // DB id populated by backend; client uses Clerk user directly
          openId: user.id,
          name: user.fullName ?? user.username ?? null,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          role: "user" as const,
        }
      : null,
    loading: !isLoaded,
    error: null,
    isAuthenticated: Boolean(isSignedIn),
    refresh: () => {},
    logout,
  };
}
