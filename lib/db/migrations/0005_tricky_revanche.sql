CREATE TABLE `Session` (
	`createdAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`ip` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `UserBenefitUsage` (
	`benefitId` text NOT NULL,
	`period` text NOT NULL,
	`savedAmount` integer,
	`status` text DEFAULT 'used' NOT NULL,
	`updatedAt` integer NOT NULL,
	`userId` text NOT NULL,
	PRIMARY KEY(`userId`, `benefitId`, `period`),
	FOREIGN KEY (`benefitId`) REFERENCES `Benefit`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `UserCustomProduct` (
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`provider` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `Benefit` ADD `activationInstructions` text;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `activationRequired` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `expiresAt` integer;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `keywords` text;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `monetaryValue` integer;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `officialUrl` text;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `resetFrequency` text;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `restrictions` text;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `valuePeriod` text;--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);