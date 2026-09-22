import { Link } from "wouter";

/**
 * Terms of use and privacy policy. The text describes what the code actually
 * stores and which third parties receive data (Clerk, Neon, Supabase Storage,
 * LINE, Google Gemini). The church that runs the system must review it and
 * fill in its own contact details before it goes live.
 */

type Section = { heading: string; body: string[] };

const UPDATED = "22 กันยายน 2569";

const TERMS: Section[] = [
  {
    heading: "1. ขอบเขตของบริการ",
    body: [
      "Grace-giving เป็นระบบบันทึกการถวาย รายจ่าย กองทุน งบประมาณ และการอนุมัติเบิกจ่ายของคริสตจักร",
      "คริสตจักรเป็นผู้ดูแลระบบและเป็นเจ้าของข้อมูลทั้งหมดในระบบ",
    ],
  },
  {
    heading: "2. บัญชีผู้ใช้",
    body: [
      "ผู้ใช้ต้องเข้าสู่ระบบด้วยบัญชีของตนเอง ห้ามให้ผู้อื่นใช้บัญชีแทน",
      "สิทธิ์ของผู้ใช้ขึ้นอยู่กับบทบาทที่ผู้ดูแลระบบกำหนด เช่น เหรัญญิก ศิษยาภิบาล ทีมนับเงิน หรือสมาชิก",
    ],
  },
  {
    heading: "3. ความถูกต้องของข้อมูล",
    body: [
      "ผู้บันทึกรายการต้องตรวจสอบยอดเงินและเอกสารก่อนบันทึก",
      "ข้อมูลที่ระบบอ่านจากภาพสลิปโดยอัตโนมัติอาจผิดพลาด เหรัญญิกต้องตรวจและอนุมัติทุกรายการก่อนลงบัญชี",
    ],
  },
  {
    heading: "4. การใช้งานที่ไม่อนุญาต",
    body: [
      "ห้ามแก้ไขหรือลบหลักฐานทางการเงินโดยไม่มีสิทธิ์",
      "ห้ามนำข้อมูลผู้ถวายหรือสมาชิกไปใช้นอกงานของคริสตจักร",
    ],
  },
  {
    heading: "5. การเปลี่ยนแปลงข้อกำหนด",
    body: [
      "คริสตจักรอาจแก้ไขข้อกำหนดนี้ วันที่แก้ไขล่าสุดแสดงอยู่ด้านบนของหน้า",
    ],
  },
];

const PRIVACY: Section[] = [
  {
    heading: "1. ข้อมูลที่ระบบเก็บ",
    body: [
      "ข้อมูลบัญชีผู้ใช้: ชื่อ อีเมล รูปโปรไฟล์ เบอร์โทรศัพท์ และบทบาทในคริสตจักร",
      "ข้อมูลสมาชิก: ชื่อ เบอร์โทรศัพท์ อีเมล หมายเลขซองถวาย และบัญชี LINE ที่ผูกไว้",
      "ข้อมูลการเงิน: ยอดถวาย ชื่อผู้ถวาย รายจ่าย ใบเสร็จ และประวัติการอนุมัติ",
      "ภาพสลิปโอนเงินที่สมาชิกส่งผ่าน LINE และข้อมูลที่อ่านได้จากสลิป เช่น ชื่อผู้โอน ธนาคาร และยอดเงิน",
    ],
  },
  {
    heading: "2. ผู้ที่เห็นข้อมูล",
    body: [
      "ชื่อผู้ถวายแสดงเฉพาะผู้ดูแลระบบและเหรัญญิก ผู้ใช้บทบาทอื่นเห็นเฉพาะยอดรวม",
      "ภาพสลิปเก็บในพื้นที่จัดเก็บแบบส่วนตัว ระบบเปิดภาพผ่านลิงก์ที่หมดอายุภายใน 1 ชั่วโมง",
    ],
  },
  {
    heading: "3. ผู้ให้บริการภายนอก",
    body: [
      "Clerk: ยืนยันตัวตนผู้ใช้",
      "Neon: ฐานข้อมูล PostgreSQL",
      "Supabase Storage: เก็บไฟล์ใบเสร็จและภาพสลิป",
      "LINE: รับภาพสลิปและส่งข้อความตอบกลับ",
      "Google Gemini: อ่านข้อความจากภาพสลิป",
    ],
  },
  {
    heading: "4. สิทธิ์ของเจ้าของข้อมูล",
    body: [
      "ท่านขอดู แก้ไข หรือลบข้อมูลส่วนบุคคลของท่านได้ โดยติดต่อผู้ดูแลระบบของคริสตจักร",
      "คริสตจักรอาจต้องเก็บหลักฐานทางการเงินไว้ตามระยะเวลาที่กฎหมายกำหนด แม้ท่านขอลบข้อมูล",
    ],
  },
  {
    heading: "5. ติดต่อ",
    body: ["ส่งคำขอเกี่ยวกับข้อมูลส่วนบุคคลถึงผู้ดูแลระบบของคริสตจักร"],
  },
];

function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: Section[];
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-ink">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/login"
          className="text-sm font-semibold text-ink-2 underline"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-ink-2">แก้ไขล่าสุด {UPDATED}</p>
        {sections.map(section => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-lg font-bold">{section.heading}</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {section.body.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </div>
  );
}

export function Terms() {
  return <LegalPage title="ข้อกำหนดการใช้งาน" sections={TERMS} />;
}

export function Privacy() {
  return <LegalPage title="นโยบายความเป็นส่วนตัว" sections={PRIVACY} />;
}

/** Footer links shown under the sign-in and sign-up forms. */
export function LegalLinks() {
  return (
    <p className="mt-6 text-center text-xs text-ink-2">
      การใช้งานระบบถือว่ายอมรับ{" "}
      <Link href="/terms" className="underline">
        ข้อกำหนดการใช้งาน
      </Link>{" "}
      และ{" "}
      <Link href="/privacy" className="underline">
        นโยบายความเป็นส่วนตัว
      </Link>
    </p>
  );
}
