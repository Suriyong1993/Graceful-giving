-- ─── Migration 0002: Finance System ──────────────────────────────────────────
-- Run with: pnpm db:push
-- Or apply manually to your MySQL database

-- 1. Add churchRole column to existing users table
ALTER TABLE `users` ADD COLUMN `churchRole` varchar(20) NULL DEFAULT NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Church profiles
CREATE TABLE `church_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `churchId` varchar(64) NOT NULL,
  `name` varchar(180) NOT NULL DEFAULT 'คริสตจักรบ้านแห่งพระคุณ',
  `address` text,
  `phone` varchar(20),
  `email` varchar(320),
  `website` varchar(500),
  `pastorName` varchar(120),
  `assistantPastorName` varchar(120),
  `treasurerName` varchar(120),
  `bankName` varchar(120),
  `bankAccount` varchar(30),
  `bankAccountName` varchar(120),
  `fiscalYearStartMonth` int NOT NULL DEFAULT 1,
  `logoUrl` varchar(500),
  `setupCompleted` tinyint(1) NOT NULL DEFAULT 0,
  `motto` varchar(280),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `church_profiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `church_profiles_churchId_unique` UNIQUE(`churchId`)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Finance accounts / Funds
CREATE TABLE `finance_accounts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `churchId` varchar(64) NOT NULL,
  `name` varchar(120) NOT NULL,
  `type` enum('general','tithe','mission','building','welfare','special') NOT NULL DEFAULT 'general',
  `balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `description` text,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `finance_accounts_id` PRIMARY KEY(`id`)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Offerings / Donations
CREATE TABLE `offerings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `churchId` varchar(64) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `category` enum('tithe','general','mission','building','welfare','special') NOT NULL DEFAULT 'general',
  `fundId` int,
  `donorName` varchar(120),
  `donorMemberId` int,
  `receiptDate` timestamp NOT NULL DEFAULT (now()),
  `method` enum('cash','transfer','check') NOT NULL DEFAULT 'cash',
  `reference` varchar(120),
  `notes` text,
  `recordedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `offerings_id` PRIMARY KEY(`id`),
  INDEX `offerings_churchId_receiptDate` (`churchId`, `receiptDate`)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Expenses
CREATE TABLE `expenses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `churchId` varchar(64) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `category` enum('utilities','ministry','pastoral','admin','building','worship','welfare','other') NOT NULL DEFAULT 'other',
  `fundId` int,
  `description` varchar(280) NOT NULL,
  `details` text,
  `expenseDate` timestamp NOT NULL DEFAULT (now()),
  `payee` varchar(120),
  `receiptRef` varchar(120),
  `status` enum('draft','approved','paid') NOT NULL DEFAULT 'approved',
  `approvedBy` int,
  `recordedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `expenses_id` PRIMARY KEY(`id`),
  INDEX `expenses_churchId_expenseDate` (`churchId`, `expenseDate`)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Withdrawal requests
CREATE TABLE `withdrawal_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `churchId` varchar(64) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `purpose` varchar(280) NOT NULL,
  `details` text,
  `fundId` int,
  `requestedBy` int NOT NULL,
  `requestDate` timestamp NOT NULL DEFAULT (now()),
  `status` enum('pending','approved','rejected','disbursed') NOT NULL DEFAULT 'pending',
  `approvedBy` int,
  `approvalDate` timestamp,
  `approvalNote` text,
  `rejectionReason` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `withdrawal_requests_id` PRIMARY KEY(`id`),
  INDEX `withdrawal_requests_churchId_status` (`churchId`, `status`)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. Budget plans
CREATE TABLE `budget_plans` (
  `id` int AUTO_INCREMENT NOT NULL,
  `churchId` varchar(64) NOT NULL,
  `year` int NOT NULL,
  `month` int,
  `fundId` int,
  `category` varchar(80),
  `plannedAmount` decimal(15,2) NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `budget_plans_id` PRIMARY KEY(`id`),
  INDEX `budget_plans_churchId_year` (`churchId`, `year`)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. Seed: Default church profile for demo-church
INSERT INTO `church_profiles` (`churchId`, `name`, `address`, `phone`, `pastorName`, `treasurerName`, `bankName`, `bankAccount`, `bankAccountName`, `fiscalYearStartMonth`, `setupCompleted`, `motto`)
VALUES (
  'demo-church',
  'คริสตจักรบ้านแห่งพระคุณ (Grace House Church)',
  '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  '02-123-4567',
  'ศจ.ประยุทธ์ วงศ์ศรี',
  'มัคนายก สมชาย ใจดี',
  'ธนาคารกสิกรไทย',
  '0123456789',
  'คริสตจักรบ้านแห่งพระคุณ',
  1,
  1,
  '2 โครินธ์ 9:7 · ผู้ให้ด้วยใจยินดี พระเจ้าทรงรัก'
);

-- 9. Seed: Default finance accounts
INSERT INTO `finance_accounts` (`churchId`, `name`, `type`, `balance`, `description`, `isActive`, `sortOrder`) VALUES
('demo-church', 'กองทุนทั่วไป', 'general', 5237.00, 'กองทุนหลักสำหรับค่าใช้จ่ายทั่วไปของคริสตจักร', 1, 1),
('demo-church', 'กองทุนสิบลด', 'tithe', 18500.00, 'เงินถวายสิบลดจากสมาชิก', 1, 2),
('demo-church', 'กองทุนพันธกิจ', 'mission', 12000.00, 'สนับสนุนงานประกาศและพันธกิจ', 1, 3),
('demo-church', 'กองทุนอาคาร', 'building', 45000.00, 'ซ่อมแซมและพัฒนาอาคารสถานที่', 1, 4),
('demo-church', 'กองทุนสวัสดิการ', 'welfare', 8200.00, 'ช่วยเหลือสมาชิกและผู้ยากไร้', 1, 5);

-- 10. Seed: Sample offerings (last 3 months)
INSERT INTO `offerings` (`churchId`, `amount`, `category`, `fundId`, `donorName`, `receiptDate`, `method`, `notes`, `recordedBy`) VALUES
('demo-church', 5000.00, 'tithe', 2, 'สมชาย วงศ์สกุล', '2026-09-07 09:00:00', 'transfer', 'ถวายสิบลดประจำเดือน กันยายน', 1),
('demo-church', 1000.00, 'general', 1, NULL, '2026-09-07 10:30:00', 'cash', 'ถวายประจำสัปดาห์', 1),
('demo-church', 3500.00, 'mission', 3, 'สุดา รักพระ', '2026-09-07 10:30:00', 'cash', 'ถวายพันธกิจ', 1),
('demo-church', 2000.00, 'tithe', 2, NULL, '2026-08-31 09:00:00', 'transfer', NULL, 1),
('demo-church', 1500.00, 'general', 1, NULL, '2026-08-24 10:00:00', 'cash', NULL, 1),
('demo-church', 5000.00, 'tithe', 2, 'ประยุทธ์ เจริญ', '2026-08-17 09:00:00', 'transfer', NULL, 1),
('demo-church', 3000.00, 'building', 4, NULL, '2026-08-10 11:00:00', 'cash', 'ถวายพิเศษกองทุนอาคาร', 1);

-- 11. Seed: Sample expenses
INSERT INTO `expenses` (`churchId`, `amount`, `category`, `fundId`, `description`, `expenseDate`, `payee`, `status`, `recordedBy`) VALUES
('demo-church', 3200.00, 'utilities', 1, 'ค่าไฟฟ้าและสาธารณูปโภค เดือน ก.ย.', '2026-09-08 14:00:00', 'MEA', 'paid', 1),
('demo-church', 2450.00, 'worship', 1, 'ค่าอุปกรณ์นมัสการ (ไมค์ไร้สาย)', '2026-09-11 15:20:00', 'ร้านอิเล็กทรอนิกส์ ABC', 'paid', 1),
('demo-church', 1800.00, 'ministry', 3, 'ค่าพิมพ์เอกสารประกาศ', '2026-09-01 10:00:00', 'ร้านพิมพ์ซิตี้', 'paid', 1),
('demo-church', 5500.00, 'pastoral', 1, 'ค่าเดินทางศิษยาภิบาล (ค่ายสามัคคีธรรม)', '2026-08-20 08:00:00', 'ศจ.ประยุทธ์', 'paid', 1),
('demo-church', 2000.00, 'welfare', 5, 'สวัสดิการช่วยเหลือสมาชิกป่วย', '2026-08-15 13:00:00', 'สมาชิก', 'paid', 1);

-- 12. Seed: Sample withdrawal requests
INSERT INTO `withdrawal_requests` (`churchId`, `amount`, `purpose`, `details`, `fundId`, `requestedBy`, `status`) VALUES
('demo-church', 5000.00, 'ค่าจัดค่ายสามัคคีธรรมเยาวชน', 'ต้องการเบิกเงินสำหรับค่าที่พักและอาหาร ค่ายเยาวชน 2-4 ต.ค. 2026 จำนวน 30 คน', 3, 1, 'pending'),
('demo-church', 3200.00, 'ซ่อมแซมหลังคาอาคารนมัสการ', 'หลังคาด้านทิศเหนือรั่วซึม ต้องเปลี่ยนกระเบื้อง', 4, 1, 'approved'),
('demo-church', 1500.00, 'ค่าพิมพ์พระคัมภีร์แจกสมาชิกใหม่', NULL, 1, 1, 'disbursed');

-- 13. Seed: Budget plans for 2026
INSERT INTO `budget_plans` (`churchId`, `year`, `month`, `fundId`, `category`, `plannedAmount`, `notes`) VALUES
('demo-church', 2026, NULL, 3, 'พันธกิจประกาศและการเผยแพร่', 20000.00, 'งบประมาณรายปี'),
('demo-church', 2026, NULL, 5, 'การดูแลสมาชิกและสงเคราะห์', 5000.00, 'งบประมาณรายปี'),
('demo-church', 2026, NULL, 1, 'สาธารณูปโภค', 40000.00, 'ค่าน้ำ ค่าไฟ ค่าโทรศัพท์'),
('demo-church', 2026, NULL, 4, 'อาคารสถานที่', 30000.00, 'ซ่อมแซมและปรับปรุง');
