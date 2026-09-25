import { trpc } from "@/lib/trpc";

/** Rows created before the switch to private storage still hold a full
 * public Supabase URL instead of a bare storage key. */
function isLegacyPublicUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

/**
 * Resolves a stored receipt value (a private-storage key, or a legacy
 * public URL) to a URL usable directly in <img src> / <a href>.
 * Signed URLs expire after 1 hour, so this re-fetches on mount instead of
 * caching indefinitely.
 */
export function useReceiptUrl(value: string | null | undefined) {
  const isKey = !!value && !isLegacyPublicUrl(value);
  const query = trpc.expenses.getReceiptSignedUrl.useQuery(
    { key: value ?? "" },
    { enabled: isKey, staleTime: 0, retry: false }
  );

  if (!value) return { url: null, isLoading: false };
  if (!isKey) return { url: value, isLoading: false };
  return { url: query.data?.url ?? null, isLoading: query.isLoading };
}
