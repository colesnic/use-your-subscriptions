CREATE TABLE `Account` (
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Account_provider_account_idx` ON `Account` (`provider`,`providerAccountId`);