import type { ChurchRole } from "@shared/roles";

export type RoleHolderRow = {
  name: string | null;
  churchRole: string | null;
  churchRoles: string | null;
};

/** Roles whose holders are listed by name on the Profile page. */
export const NAMED_ROLES = [
  "SUPER_ADMIN",
  "PASTOR",
  "TREASURER",
  "DEACON",
  "COUNTER",
] as const satisfies readonly ChurchRole[];

export type RoleHolders = {
  holders: Record<(typeof NAMED_ROLES)[number], string[]>;
  /** Members are counted, not named: the page is visible to every member. */
  memberCount: number;
};

function rolesOf(row: RoleHolderRow): string[] {
  const list = (row.churchRoles ?? "")
    .split(",")
    .map(r => r.trim())
    .filter(Boolean);
  if (row.churchRole && !list.includes(row.churchRole))
    list.push(row.churchRole);
  return list.length > 0 ? list : ["MEMBER"];
}

/**
 * Groups users by church role. A user with several roles appears under each
 * of them. Users without a name are left out of the named lists, because an
 * email address or OAuth id is not something to show to every member.
 */
export function groupRoleHolders(rows: RoleHolderRow[]): RoleHolders {
  const holders = Object.fromEntries(
    NAMED_ROLES.map(role => [role, [] as string[]])
  ) as RoleHolders["holders"];
  let memberCount = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    for (const role of rolesOf(row)) {
      if (role === "MEMBER") {
        memberCount += 1;
      } else if (name && role in holders) {
        holders[role as keyof typeof holders].push(name);
      }
    }
  }

  for (const list of Object.values(holders))
    list.sort((a, b) => a.localeCompare(b, "th"));
  return { holders, memberCount };
}
