CREATE TABLE `video_clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`clipId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` enum('key-moment','complication','technique','device-intro','critical-view','teaching-point','innovation','efficiency') NOT NULL,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`thumbnailUrl` text,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_clips_id` PRIMARY KEY(`id`),
	CONSTRAINT `video_clips_clipId_unique` UNIQUE(`clipId`)
);
