CREATE TABLE `Benefit` (
	`category` text NOT NULL,
	`details` text NOT NULL,
	`howToUse` text,
	`id` text PRIMARY KEY NOT NULL,
	`providerId` text NOT NULL,
	`sourceUrl` text,
	`summary` text NOT NULL,
	`tags` text NOT NULL,
	`title` text NOT NULL,
	`value` text,
	FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Chat` (
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`userId` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Document` (
	`content` text,
	`createdAt` integer NOT NULL,
	`id` text NOT NULL,
	`kind` text DEFAULT 'text' NOT NULL,
	`title` text NOT NULL,
	`userId` text NOT NULL,
	PRIMARY KEY(`id`, `createdAt`),
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Message_v2` (
	`attachments` text NOT NULL,
	`chatId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`parts` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Provider` (
	`annualFee` integer,
	`category` text DEFAULT 'credit_card' NOT NULL,
	`createdAt` integer NOT NULL,
	`description` text,
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text,
	`logo` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`website` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Provider_slug_unique` ON `Provider` (`slug`);--> statement-breakpoint
CREATE TABLE `Stream` (
	`chatId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Suggestion` (
	`createdAt` integer NOT NULL,
	`description` text,
	`documentCreatedAt` integer NOT NULL,
	`documentId` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`isResolved` integer DEFAULT false NOT NULL,
	`originalText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`documentId`,`documentCreatedAt`) REFERENCES `Document`(`id`,`createdAt`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `User` (
	`createdAt` integer NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`isAnonymous` integer DEFAULT false NOT NULL,
	`name` text,
	`password` text,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `UserSubscription` (
	`createdAt` integer NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	PRIMARY KEY(`userId`, `providerId`),
	FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Vote_v2` (
	`chatId` text NOT NULL,
	`isUpvoted` integer NOT NULL,
	`messageId` text NOT NULL,
	PRIMARY KEY(`chatId`, `messageId`),
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`messageId`) REFERENCES `Message_v2`(`id`) ON UPDATE no action ON DELETE no action
);
