import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isLoaded && Boolean(isSignedIn),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
    refetchInterval: 30_000,
  });

  const logout = useCallback(async () => {
    try {
      await signOut({ redirectUrl: "/login" });
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [signOut, utils]);

  const state = useMemo(() => {
    // If signed in via Clerk, create fallback user so UI never blocks if DB is syncing
    const fallbackUser =
      isSignedIn && clerkUser
        ? {
            id: 1,
            openId: clerkUser.id,
            name:
              clerkUser.fullName ??
              clerkUser.username ??
              clerkUser.primaryEmailAddress?.emailAddress ??
              "Member",
            email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
            loginMethod: "clerk",
            role: "user" as const,
            churchRole: "MEMBER" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
          }
        : null;

    const user = meQuery.data ?? fallbackUser;

    return {
      user,
      loading: !isLoaded || (Boolean(isSignedIn) && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(isSignedIn),
    };
  }, [
    isLoaded,
    isSignedIn,
    clerkUser,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [redirectOnUnauthenticated, redirectPath, state.loading, state.user]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
