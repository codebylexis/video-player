CREATE TABLE `annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`time` varchar(16) NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`snapshotUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instrument_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`name` text NOT NULL,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instrument_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surgical_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` varchar(64) NOT NULL,
	`surgeon` text NOT NULL,
	`procedure` text NOT NULL,
	`date` timestamp NOT NULL,
	`notes` text,
	`videoUrls` text NOT NULL,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surgical_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `surgical_cases_caseId_unique` UNIQUE(`caseId`)
);
--> statement-breakpoint
CREATE TABLE `surgical_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`label` text NOT NULL,
	`type` enum('milestone','action','complication','phase','instrument') NOT NULL,
	`category` enum('pre-op','intra-op','post-op') NOT NULL,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surgical_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surgical_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`name` text NOT NULL,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`color` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surgical_phases_id` PRIMARY KEY(`id`)
);
