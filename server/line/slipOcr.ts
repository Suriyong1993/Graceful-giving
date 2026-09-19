/**
 * Slip OCR — AI extraction of Thai bank transfer slip data
 *
 * Uses the existing invokeLLM() (Forge API, OpenAI-compatible) which
 * already supports image_url content parts. No additional packages needed.
 *
 * Returns per-field confidence scores. Callers use these to determine
 * whether the slip needs manual review (needs_review) vs is ready to match.
 *
 * AI role: EXTRACT ONLY — never approve or reject financial transactions.
 */

import { invokeLLM } from "../_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlipExtraction {
  /** Raw text response from AI before JSON parsing */
  rawText: string;
  /** Transfer amount in THB (null if unreadable) */
  amount: number | null;
  /** 0.0–1.0 confidence for amount */
  amountConfidence: number;
  /** Transfer date as ISO string "YYYY-MM-DD" (null if unreadable) */
  transferDate: string | null;
  /** Transfer time as "HH:MM" (null if unreadable) */
  transferTime: string | null;
  /** 0.0–1.0 confidence for date/time */
  dateConfidence: number;
  /** Sender name as printed on slip (null if absent) */
  senderName: string | null;
  /** 0.0–1.0 confidence for sender name */
  senderConfidence: number;
  /** Bank transaction reference / ID (null if absent) */
  referenceNumber: string | null;
  /** 0.0–1.0 confidence for reference number */
  referenceConfidence: number;
  /** Source bank name e.g. "SCB", "กสิกรไทย" (null if unreadable) */
  bankName: string | null;
  /** Receiver account name (null if absent) */
  receiverName: string | null;
  /** AI notes or caveats */
  notes: string | null;
}

/** Threshold below which a field is considered low-confidence → needs_review */
export const CONFIDENCE_THRESHOLD = 0.85;

/** Critical fields that must all exceed threshold for auto-processing */
const CRITICAL_FIELDS = ["amount", "referenceNumber"] as const;

/** Returns true if the slip should be flagged for manual review */
export function requiresReview(extraction: SlipExtraction): boolean {
  if (extraction.amountConfidence < CONFIDENCE_THRESHOLD) return true;
  if (extraction.referenceConfidence < CONFIDENCE_THRESHOLD) return true;
  if (extraction.amount === null) return true;
  return false;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `คุณคือระบบอ่านและดึงข้อมูลจากสลิปการโอนเงินธนาคารไทย

**หน้าที่**: ดึงข้อมูลเท่านั้น — ห้ามอนุมัติ ห้ามตัดสินใจ ห้ามให้คำแนะนำด้านการเงิน

**ข้อมูลที่ต้องดึง**:
- amount: จำนวนเงิน (ตัวเลข THB เท่านั้น ไม่มีสัญลักษณ์)
- amountConfidence: ความมั่นใจ 0.0–1.0
- transferDate: วันที่โอน (YYYY-MM-DD) หรือ null
- transferTime: เวลาที่โอน (HH:MM 24h) หรือ null
- dateConfidence: ความมั่นใจวันที่/เวลา 0.0–1.0
- senderName: ชื่อผู้โอน หรือ null
- senderConfidence: ความมั่นใจชื่อผู้โอน 0.0–1.0
- referenceNumber: หมายเลขอ้างอิง/เลขที่รายการ หรือ null
- referenceConfidence: ความมั่นใจหมายเลขอ้างอิง 0.0–1.0
- bankName: ชื่อธนาคารต้นทาง หรือ null
- receiverName: ชื่อผู้รับ หรือ null
- notes: หมายเหตุถ้ารูปไม่ชัดหรือมีข้อสังเกต หรือ null

**กฎ**:
- ถ้าอ่านข้อมูลไม่ได้ ให้ตั้ง null — ห้ามเดา
- ถ้ารูปเบลอหรือถ่ายไม่ตรง ให้ amountConfidence ต่ำ
- ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น`;

const OUTPUT_SCHEMA = {
  name: "slip_extraction",
  schema: {
    type: "object",
    properties: {
      amount: { type: ["number", "null"] },
      amountConfidence: { type: "number", minimum: 0, maximum: 1 },
      transferDate: { type: ["string", "null"] },
      transferTime: { type: ["string", "null"] },
      dateConfidence: { type: "number", minimum: 0, maximum: 1 },
      senderName: { type: ["string", "null"] },
      senderConfidence: { type: "number", minimum: 0, maximum: 1 },
      referenceNumber: { type: ["string", "null"] },
      referenceConfidence: { type: "number", minimum: 0, maximum: 1 },
      bankName: { type: ["string", "null"] },
      receiverName: { type: ["string", "null"] },
      notes: { type: ["string", "null"] },
    },
    required: [
      "amount", "amountConfidence",
      "transferDate", "transferTime", "dateConfidence",
      "senderName", "senderConfidence",
      "referenceNumber", "referenceConfidence",
      "bankName", "receiverName", "notes",
    ],
    additionalProperties: false,
  },
  strict: true,
};

// ─── Main extraction function ─────────────────────────────────────────────────

export async function extractSlipData(
  signedImageUrl: string
): Promise<SlipExtraction> {
  let rawText = "";

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: signedImageUrl, detail: "high" },
            },
            {
              type: "text",
              text: "กรุณาอ่านสลิปนี้และดึงข้อมูลตามที่กำหนด ตอบเป็น JSON เท่านั้น",
            },
          ],
        },
      ],
      outputSchema: OUTPUT_SCHEMA,
      maxTokens: 600,
    });

    const content = result.choices[0]?.message?.content;
    rawText = typeof content === "string" ? content : JSON.stringify(content ?? "");

    // Parse JSON — handle cases where model wraps in markdown fence
    let parsed: Omit<SlipExtraction, "rawText">;
    try {
      parsed = JSON.parse(rawText) as Omit<SlipExtraction, "rawText">;
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned non-JSON response");
      parsed = JSON.parse(match[0]) as Omit<SlipExtraction, "rawText">;
    }

    return { rawText, ...parsed };
  } catch (err) {
    console.error("[SlipOCR] extraction failed:", err);
    return {
      rawText,
      amount: null,
      amountConfidence: 0,
      transferDate: null,
      transferTime: null,
      dateConfidence: 0,
      senderName: null,
      senderConfidence: 0,
      referenceNumber: null,
      referenceConfidence: 0,
      bankName: null,
      receiverName: null,
      notes: `Extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
