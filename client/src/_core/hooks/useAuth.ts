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
    // Someone signed in through Clerk whose row has not synced yet still gets
    // a usable app rather than a blocked screen. The fallback carries the
    // LOWEST privileges on purpose: every role gate in the client reads this
    // user, so guessing high would hand a plain member the treasurer's and
    // the admin's screens for as long as auth.me is unresolved — and
    // permanently if it fails. Their real role replaces this as soon as
    // auth.me answers.
    const fallbackUser =
      isSignedIn && clerkUser
        ? {
            id: 0,
            openId: clerkUser.id,
            name:
              clerkUser.fullName ??
              clerkUser.username ??
              clerkUser.primaryEmailAddress?.emailAddress ??
              "สมาชิก",
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
      // Stay "loading" until the real role is known, so the route guards and
      // the navigation wait rather than rendering against the fallback and
      // flipping once the answer lands. A disabled query (signed out) reports
      // isLoading false, so this does not stall the login page.
      loading: !isLoaded || meQuery.isLoading,
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
