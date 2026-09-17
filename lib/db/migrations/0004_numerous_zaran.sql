CREATE TABLE `BenefitProposal` (
	`added` integer DEFAULT 0 NOT NULL,
	`changed` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`fetchedAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`missing` integer DEFAULT 0 NOT NULL,
	`payload` text NOT NULL,
	`providerId` text NOT NULL,
	`providerName` text NOT NULL,
	`providerSlug` text NOT NULL,
	`sourceUrl` text,
	`status` text DEFAULT 'needs-review' NOT NULL,
	FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `Provider` ADD `lastCheckedAt` integer;