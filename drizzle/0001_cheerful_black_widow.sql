CREATE TABLE `church_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`churchId` varchar(64) NOT NULL DEFAULT 'demo-church',
	`authorId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` varchar(280) NOT NULL,
	`description` text NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`location` varchar(180),
	`registrationUrl` varchar(500),
	`status` enum('draft','published','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `church_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `church_news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`churchId` varchar(64) NOT NULL DEFAULT 'demo-church',
	`authorId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` varchar(280) NOT NULL,
	`body` text NOT NULL,
	`category` enum('announcement','ministry','finance','pastoral') NOT NULL DEFAULT 'announcement',
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `church_news_id` PRIMARY KEY(`id`)
);
