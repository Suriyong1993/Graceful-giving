/**
 * One place to turn a number into money and a timestamp into a Thai date.
 *
 * Before this existed, three pages each defined an identical `fmtBaht`, and
 * five more called `.toLocaleString()` with no locale and no fraction digits,
 * so the same amount printed as "฿12,000.00" on one screen and "฿12000" on
 * the next. Amounts in a ledger have to be comparable at a glance, so every
 * screen formats them the same way and renders them with `tabular-nums`.
 */

const BAHT = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BAHT_ROUNDED = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * The digits alone, grouped and always to two decimals. Use this when the
 * "฿" is its own element — see `MoneyDisplay` — so the symbol cannot sit on
 * top of the first digit and the digits still line up down a column.
 */
export function formatAmount(value: number, decimals: 0 | 2 = 2): string {
  const n = Number.isFinite(value) ? value : 0;
  return decimals === 0 ? BAHT_ROUNDED.format(n) : BAHT.format(n);
}

/**
 * Symbol and digits in one string, separated by a narrow no-break space
 * (U+202F). Run together, the "฿" glyph's ink overlaps the first digit; a
 * breaking space instead let a large balance wrap between the symbol and its
 * number, so the separator has to be both narrow and non-breaking. For text
 * — CSV, dialog copy, a toast — where markup is not available; prefer
 * `MoneyDisplay` anywhere the value is rendered into the page.
 */
export function formatBaht(value: number, decimals: 0 | 2 = 2): string {
  return `฿\u202F${formatAmount(value, decimals)}`;
}

/** Accepts the ISO strings the API returns as well as real Date objects. */
export function toDate(value: string | number | Date | null | undefined) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "20 ก.ย. 2569". Returns "—" rather than "Invalid Date". */
export function formatThaiDate(
  value: string | number | Date | null | undefined
) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Same, with the time appended. */
export function formatThaiDateTime(
  value: string | number | Date | null | undefined
) {
  const d = toDate(value);
  if (!d) return "—";
  return `${formatThaiDate(d)} ${d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
