/**
 * Weekly offering count and reconciliation.
 *
 * Shared by the client (live variance while the counters type) and the server
 * (enforces the same rules before a session may be posted). Keep it pure so
 * both sides always agree.
 *
 * All arithmetic runs in satang (1 baht = 100 satang) integers. Thai coins
 * include 0.25 and 0.50 baht, so summing baht as floats drifts.
 */

export type CashKind = "note" | "coin";

export interface Denomination {
  /** Face value in baht. */
  value: number;
  kind: CashKind;
  label: string;
}

/**
 * Thai currency in circulation, highest first. The 20 baht note is the most
 * common note in an offering bag — never drop it from the count sheet.
 */
export const THB_DENOMINATIONS: readonly Denomination[] = [
  { value: 1000, kind: "note", label: "ธนบัตร 1000" },
  { value: 500, kind: "note", label: "ธนบัตร 500" },
  { value: 100, kind: "note", label: "ธนบัตร 100" },
  { value: 50, kind: "note", label: "ธนบัตร 50" },
  { value: 20, kind: "note", label: "ธนบัตร 20" },
  { value: 10, kind: "coin", label: "เหรียญ 10" },
  { value: 5, kind: "coin", label: "เหรียญ 5" },
  { value: 2, kind: "coin", label: "เหรียญ 2" },
  { value: 1, kind: "coin", label: "เหรียญ 1" },
  { value: 0.5, kind: "coin", label: "เหรียญ 50 สตางค์" },
  { value: 0.25, kind: "coin", label: "เหรียญ 25 สตางค์" },
];

export function toSatang(baht: number): number {
  return Math.round(baht * 100);
}

export function toBaht(satang: number): number {
  return satang / 100;
}

export interface EnvelopeInput {
  amount: number;
  method: "cash" | "transfer" | "check";
}

export interface CashCountInput {
  denomination: number;
  kind: CashKind;
  quantity: number;
}

export interface DeductionInput {
  amount: number;
}

export interface BankRecordInput {
  amount: number;
  type: "transfer_in" | "cash_deposit";
}

export interface ReconciliationInput {
  envelopes: readonly EnvelopeInput[];
  cashCounts: readonly CashCountInput[];
  deductions: readonly DeductionInput[];
  bankRecords: readonly BankRecordInput[];
}

/** Every figure is baht; variances are signed (positive = เกิน, negative = ขาด). */
export interface Reconciliation {
  /** ยอดถวายทั้งหมดตามซอง (ทุกช่องทาง) */
  offeringTotal: number;
  envelopeCashTotal: number;
  envelopeTransferTotal: number;
  envelopeCheckTotal: number;
  /** ยอดนับเงินสดได้จริง */
  countedCashTotal: number;
  /** นับได้ − ซองเงินสด */
  cashVariance: number;
  /** ยอดหักเบิกจากถุงถวาย */
  deductionTotal: number;
  /** นับได้ − หักเบิก = ยอดที่ต้องนำฝาก */
  expectedDeposit: number;
  actualCashDeposit: number;
  /** ฝากจริง − ที่ต้องนำฝาก */
  depositVariance: number;
  actualTransferIn: number;
  /** เข้าบัญชีจริง − ซองโอน */
  transferVariance: number;
  /** true when all three variances are zero. */
  isBalanced: boolean;
}

function sumSatang(values: readonly number[]): number {
  return values.reduce((total, value) => total + toSatang(value), 0);
}

export function reconcile(input: ReconciliationInput): Reconciliation {
  const envelopeCash = sumSatang(
    input.envelopes.filter(e => e.method === "cash").map(e => e.amount)
  );
  const envelopeTransfer = sumSatang(
    input.envelopes.filter(e => e.method === "transfer").map(e => e.amount)
  );
  const envelopeCheck = sumSatang(
    input.envelopes.filter(e => e.method === "check").map(e => e.amount)
  );
  const offeringTotal = envelopeCash + envelopeTransfer + envelopeCheck;

  const countedCash = input.cashCounts.reduce(
    (total, row) => total + toSatang(row.denomination) * row.quantity,
    0
  );

  const deductions = sumSatang(input.deductions.map(d => d.amount));
  const expectedDeposit = countedCash - deductions;

  const cashDeposit = sumSatang(
    input.bankRecords.filter(r => r.type === "cash_deposit").map(r => r.amount)
  );
  const transferIn = sumSatang(
    input.bankRecords.filter(r => r.type === "transfer_in").map(r => r.amount)
  );

  const cashVariance = countedCash - envelopeCash;
  const depositVariance = cashDeposit - expectedDeposit;
  const transferVariance = transferIn - envelopeTransfer;

  return {
    offeringTotal: toBaht(offeringTotal),
    envelopeCashTotal: toBaht(envelopeCash),
    envelopeTransferTotal: toBaht(envelopeTransfer),
    envelopeCheckTotal: toBaht(envelopeCheck),
    countedCashTotal: toBaht(countedCash),
    cashVariance: toBaht(cashVariance),
    deductionTotal: toBaht(deductions),
    expectedDeposit: toBaht(expectedDeposit),
    actualCashDeposit: toBaht(cashDeposit),
    depositVariance: toBaht(depositVariance),
    actualTransferIn: toBaht(transferIn),
    transferVariance: toBaht(transferVariance),
    isBalanced:
      cashVariance === 0 && depositVariance === 0 && transferVariance === 0,
  };
}

/**
 * The invariant the church audits against:
 * ยอดถวายเงินสด − ยอดหักเบิก = ยอดนำฝากธนาคาร
 *
 * Checked against the counted cash rather than the envelope total, because the
 * counted cash is what physically went into the deposit bag.
 */
export function checkDepositIdentity(r: Reconciliation): boolean {
  return (
    toSatang(r.countedCashTotal) - toSatang(r.deductionTotal) ===
    toSatang(r.actualCashDeposit)
  );
}

export const COUNTING_STATUSES = [
  "counting",
  "counted",
  "verified",
  "posted",
  "closed",
] as const;

export type CountingStatus = (typeof COUNTING_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<CountingStatus, readonly CountingStatus[]> = {
  counting: ["counted"],
  counted: ["counting", "verified"],
  verified: ["counted", "posted"],
  posted: ["closed"],
  closed: [],
};

export function canTransition(
  from: CountingStatus,
  to: CountingStatus
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Counters may only edit envelopes and the count sheet while still counting. */
export function isEditable(status: CountingStatus): boolean {
  return status === "counting";
}
