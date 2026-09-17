CREATE TABLE `ProviderRelation` (
	`childId` text NOT NULL,
	`note` text,
	`parentId` text NOT NULL,
	PRIMARY KEY(`parentId`, `childId`),
	FOREIGN KEY (`childId`) REFERENCES `Provider`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parentId`) REFERENCES `Provider`(`id`) ON UPDATE no action ON DELETE no action
);
