CREATE TABLE `BenefitRevision` (
	`benefitId` text NOT NULL,
	`changedBy` text,
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL,
	`sourceSnippet` text,
	`sourceType` text,
	`sourceUrl` text,
	`status` text,
	FOREIGN KEY (`benefitId`) REFERENCES `Benefit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `Benefit` ADD `effectiveFrom` integer;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `effectiveTo` integer;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `lastVerifiedAt` integer;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `sourceSnippet` text;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `sourceType` text DEFAULT 'seed' NOT NULL;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `status` text DEFAULT 'verified' NOT NULL;--> statement-breakpoint
ALTER TABLE `Benefit` ADD `verifiedBy` text;--> statement-breakpoint
ALTER TABLE `Provider` ADD `lastVerifiedAt` integer;--> statement-breakpoint
ALTER TABLE `Provider` ADD `sourceType` text DEFAULT 'seed' NOT NULL;--> statement-breakpoint
ALTER TABLE `Provider` ADD `status` text DEFAULT 'verified' NOT NULL;