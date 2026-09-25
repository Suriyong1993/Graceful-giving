import { Link } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Terms of use and privacy policy, served without a session (see PUBLIC_PATHS
 * in App.tsx) because a member has to be able to read them before signing in.
 *
 * The text describes what this code actually does today — which tables hold
 * personal data, which third parties are called from server/*.ts, and who can
 * read what. The church name and the contact address are not written here: they
 * come from church_profiles through church.publicContact.
 *
 * Someone at the church must still review this before it goes live. The two
 * lines marked NEEDS-CHURCH-REVIEW cannot be answered from the repository.
 */

type Section = { heading: string; body: string[] };

const UPDATED = "25 กันยายน 2569";

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
      "ภาพสลิปและไฟล์ใบเสร็จอยู่ในพื้นที่จัดเก็บส่วนตัว ระบบเปิดไฟล์ผ่านลิงก์ที่มีอายุจำกัด และกำหนด no-store ไว้ที่ proxy เพื่อให้เบราว์เซอร์ไม่เก็บไฟล์ไว้",
    ],
  },
  {
    heading: "3. ผู้ให้บริการภายนอก",
    body: [
      "Clerk: ยืนยันตัวตนและออกเซสชันผู้ใช้",
      "LINE Messaging API: รับภาพสลิปจากแชตและส่งข้อความตอบกลับ",
      "Google Gemini: อ่านข้อความจากภาพสลิป (การถอดอักขระ)",
      "พื้นที่จัดเก็บไฟล์ของแพลตฟอร์มที่โฮสต์ระบบ: เก็บภาพสลิปและไฟล์ใบเสร็จ",
      "ฐานข้อมูล PostgreSQL ที่คริสตจักรใช้บริการอยู่ (NEEDS-CHURCH-REVIEW: ระบุชื่อผู้ให้บริการฐานข้อมูลและผู้รับจ้างดูแลระบบก่อนเผยแพร่)",
    ],
  },
  {
    heading: "4. ระยะเวลาการเก็บข้อมูล",
    body: [
      "รายการทางการเงินและหลักฐานคงอยู่ในระบบเพื่อการทำบัญชีและการตรวจสอบย้อนหลัง",
      "NEEDS-CHURCH-REVIEW: ระยะเวลาเก็บเอกสารตามข้อกำหนดของคริสตจักรและกรมสรรพากร",
    ],
  },
  {
    heading: "5. สิทธิ์ของเจ้าของข้อมูล",
    body: [
      "ท่านขอดู แก้ไข หรือลบข้อมูลส่วนบุคคลของท่านได้ โดยติดต่อผู้ดูแลระบบของคริสตจักร",
      "คริสตจักรอาจต้องเก็บหลักฐานทางการเงินไว้ตามระยะเวลาที่กฎหมายกำหนด แม้ท่านขอลบข้อมูล",
    ],
  },
];

export type PublicContact = {
  churchName: string | null;
  privacyContactEmail: string | null;
};

/**
 * The last section of the privacy policy. Both halves say what is missing when
 * the church has not filled it in yet, instead of naming a person the code
 * cannot verify.
 */
export function contactSection(
  contact: PublicContact | undefined
): Section {
  const controller = contact?.churchName
    ? `ผู้ควบคุมข้อมูลส่วนบุคคล: ${contact.churchName}`
    : "ผู้ควบคุมข้อมูลส่วนบุคคล: คริสตจักรที่ใช้ระบบนี้ (ยังไม่ได้ตั้งชื่อในหน้าตั้งค่า)";
  const channel = contact?.privacyContactEmail
    ? `ส่งคำขอเกี่ยวกับข้อมูลส่วนบุคคลทางอีเมล ${contact.privacyContactEmail}`
    : "ส่งคำขอเกี่ยวกับข้อมูลส่วนบุคคลถึงผู้ดูแลระบบของคริสตจักร (ยังไม่ได้ตั้งอีเมลติดต่อในหน้าตั้งค่า)";
  return {
    heading: "6. ผู้ควบคุมข้อมูลและช่องทางติดต่อ",
    body: [controller, channel],
  };
}


function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: Section[];
}) {
  return (
    <div className="min-h-screen bg-[#F6F8FC] px-4 py-8 sm:py-12">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl text-sm font-bold text-[#1E4470] hover:bg-[#EEF2F8] px-2 -ml-2 py-2 focus-visible:ring-2 focus-visible:ring-[#D97706]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          กลับไปหน้าเข้าสู่ระบบ
        </Link>

        <div className="mt-4 rounded-2xl border border-[#DDE5F0] bg-white p-6 sm:p-8 card-elevation-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FEF3C7] text-[#B45309]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0C1B33] tracking-tight">
                {title}
              </h1>
              <p className="mt-0.5 text-xs text-[#64748B]">
                แก้ไขล่าสุด {UPDATED}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {sections.map(section => (
              <section key={section.heading}>
                <h2 className="text-base font-bold text-[#1E4470]">
                  {section.heading}
                </h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#475569]">
                  {section.body.map(line => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

export function Terms() {
  return <LegalPage title="ข้อกำหนดการใช้งาน" sections={TERMS} />;
}

export function Privacy() {
  const contact = trpc.church.publicContact.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60_000,
  });
  const sections = contact.isPending
    ? PRIVACY
    : [...PRIVACY, contactSection(contact.data)];
  return <LegalPage title="นโยบายความเป็นส่วนตัว" sections={sections} />;
}

/** Footer links shown under the sign-in and sign-up forms. */
export function LegalLinks() {
  return (
    <p className="mt-6 text-center text-xs text-[#64748B]">
      การใช้งานระบบถือว่ายอมรับ{" "}
      <Link
        href="/terms"
        className="underline decoration-[#DDE5F0] underline-offset-2 hover:text-[#B45309]"
      >
        ข้อกำหนดการใช้งาน
      </Link>{" "}
      และ{" "}
      <Link
        href="/privacy"
        className="underline decoration-[#DDE5F0] underline-offset-2 hover:text-[#B45309]"
      >
        นโยบายความเป็นส่วนตัว
      </Link>
    </p>
  );
}
