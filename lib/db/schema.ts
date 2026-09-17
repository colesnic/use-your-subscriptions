import type { InferSelectModel } from "drizzle-orm";
import {
  foreignKey,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const uuid = () => crypto.randomUUID();

export const user = sqliteTable("User", {
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" })
    .notNull()
    .default(false),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
  image: text("image"),
  isAnonymous: integer("isAnonymous", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text("name"),
  password: text("password"),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = InferSelectModel<typeof user>;

export const chat = sqliteTable("Chat", {
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
  title: text("title").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  visibility: text("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = sqliteTable("Message_v2", {
  attachments: text("attachments", { mode: "json" }).notNull(),
  chatId: text("chatId")
    .notNull()
    .references(() => chat.id),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
  parts: text("parts", { mode: "json" }).notNull(),
  role: text("role").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = sqliteTable(
  "Vote_v2",
  {
    chatId: text("chatId")
      .notNull()
      .references(() => chat.id),
    isUpvoted: integer("isUpvoted", { mode: "boolean" }).notNull(),
    messageId: text("messageId")
      .notNull()
      .references(() => message.id),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.messageId] })]
);

export type Vote = InferSelectModel<typeof vote>;

export const document = sqliteTable(
  "Document",
  {
    content: text("content"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    id: text("id").notNull().$defaultFn(uuid),
    kind: text("kind", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    title: text("title").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => [primaryKey({ columns: [table.id, table.createdAt] })]
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = sqliteTable(
  "Suggestion",
  {
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    description: text("description"),
    documentCreatedAt: integer("documentCreatedAt", {
      mode: "timestamp",
    }).notNull(),
    documentId: text("documentId").notNull(),
    id: text("id").primaryKey().notNull().$defaultFn(uuid),
    isResolved: integer("isResolved", { mode: "boolean" })
      .notNull()
      .default(false),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => [
    foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  ]
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = sqliteTable("Stream", {
  chatId: text("chatId")
    .notNull()
    .references(() => chat.id),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
});

export type Stream = InferSelectModel<typeof stream>;

/**
 * Subscription providers (credit cards, memberships, loyalty programs).
 */
export const provider = sqliteTable("Provider", {
  annualFee: integer("annualFee"),
  category: text("category", {
    enum: ["credit_card", "membership", "loyalty", "insurance"],
  })
    .notNull()
    .default("credit_card"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  description: text("description"),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
  issuer: text("issuer"),
  lastCheckedAt: integer("lastCheckedAt", { mode: "timestamp" }),
  lastVerifiedAt: integer("lastVerifiedAt", { mode: "timestamp" }),
  logo: text("logo"),
  name: text("name").notNull(),
  section: text("section", {
    enum: [
      "grocery",
      "credit_card",
      "travel",
      "work",
      "security",
      "streaming",
      "phone",
      "everyday",
    ],
  })
    .notNull()
    .default("credit_card"),
  slug: text("slug").notNull().unique(),
  sourceType: text("sourceType", {
    enum: ["official", "guide", "licensed", "community", "seed"],
  })
    .notNull()
    .default("seed"),
  status: text("status", {
    enum: ["draft", "verified", "stale", "deprecated"],
  })
    .notNull()
    .default("verified"),
  website: text("website"),
});

export type Provider = InferSelectModel<typeof provider>;

/**
 * Individual benefits/perks attached to a provider, with the context the
 * assistant needs to answer situational questions ("I'm renting a car").
 */
export const benefit = sqliteTable("Benefit", {
  category: text("category").notNull(),
  details: text("details").notNull(),
  effectiveFrom: integer("effectiveFrom", { mode: "timestamp" }),
  effectiveTo: integer("effectiveTo", { mode: "timestamp" }),
  howToUse: text("howToUse"),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
  lastVerifiedAt: integer("lastVerifiedAt", { mode: "timestamp" }),
  providerId: text("providerId")
    .notNull()
    .references(() => provider.id),
  sourceSnippet: text("sourceSnippet"),
  sourceType: text("sourceType", {
    enum: ["official", "guide", "licensed", "community", "seed"],
  })
    .notNull()
    .default("seed"),
  sourceUrl: text("sourceUrl"),
  status: text("status", {
    enum: ["draft", "verified", "stale", "deprecated"],
  })
    .notNull()
    .default("verified"),
  summary: text("summary").notNull(),
  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
  title: text("title").notNull(),
  value: text("value"),
  verifiedBy: text("verifiedBy"),
});

export type Benefit = InferSelectModel<typeof benefit>;

/**
 * Immutable history of a benefit so every change is auditable and reversible.
 */
export const benefitRevision = sqliteTable("BenefitRevision", {
  benefitId: text("benefitId")
    .notNull()
    .references(() => benefit.id),
  changedBy: text("changedBy"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
  snapshot: text("snapshot", { mode: "json" }).notNull(),
  sourceSnippet: text("sourceSnippet"),
  sourceType: text("sourceType"),
  sourceUrl: text("sourceUrl"),
  status: text("status"),
});

export type BenefitRevision = InferSelectModel<typeof benefitRevision>;

/**
 * Join table: which providers a user has told us they hold.
 */
export const userSubscription = sqliteTable(
  "UserSubscription",
  {
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    providerId: text("providerId")
      .notNull()
      .references(() => provider.id),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.providerId] })]
);

export type UserSubscription = InferSelectModel<typeof userSubscription>;

/**
 * Parent/child links: a parent program (e.g. Amex Platinum) that grants or
 * includes another program (e.g. Hilton Honors Gold, DashPass, Priority Pass).
 */
export const providerRelation = sqliteTable(
  "ProviderRelation",
  {
    childId: text("childId")
      .notNull()
      .references(() => provider.id),
    note: text("note"),
    parentId: text("parentId")
      .notNull()
      .references(() => provider.id),
  },
  (table) => [primaryKey({ columns: [table.parentId, table.childId] })]
);

export type ProviderRelation = InferSelectModel<typeof providerRelation>;

/**
 * Reviewable benefit updates proposed by the weekly sync Worker. Nothing is
 * applied automatically; a human reviews and applies them.
 */
export const benefitProposal = sqliteTable("BenefitProposal", {
  added: integer("added").notNull().default(0),
  changed: integer("changed").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  fetchedAt: integer("fetchedAt", { mode: "timestamp" }).notNull(),
  id: text("id").primaryKey().notNull().$defaultFn(uuid),
  missing: integer("missing").notNull().default(0),
  payload: text("payload", { mode: "json" }).notNull(),
  providerId: text("providerId")
    .notNull()
    .references(() => provider.id),
  providerName: text("providerName").notNull(),
  providerSlug: text("providerSlug").notNull(),
  sourceUrl: text("sourceUrl"),
  status: text("status", { enum: ["needs-review", "applied", "rejected"] })
    .notNull()
    .default("needs-review"),
});

export type BenefitProposal = InferSelectModel<typeof benefitProposal>;
