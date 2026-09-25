import type { ChurchRole } from "@shared/roles";

export type RoleHoldersQuery = {
  isLoading: boolean;
  data?: {
    holders: Partial<Record<ChurchRole, string[]>>;
    memberCount: number;
  };
};

/** Shows who holds a role, or "ยังไม่กำหนด" when nobody does. */
export function roleHolderLabel(
  role: ChurchRole,
  query: RoleHoldersQuery
): string {
  if (query.isLoading) return "กำลังโหลด...";
  if (!query.data) return "ยังไม่กำหนด";
  if (role === "MEMBER") {
    const count = query.data.memberCount;
    return count > 0 ? `สมาชิก ${count} คน` : "ยังไม่กำหนด";
  }
  const names = query.data.holders[role] ?? [];
  return names.length > 0 ? names.join(", ") : "ยังไม่กำหนด";
}
