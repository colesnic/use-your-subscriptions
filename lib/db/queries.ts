import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { ChatbotError } from "../errors";
import { db } from "./client";
import {
  type Benefit,
  benefit,
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Provider,
  provider,
  providerRelation,
  type Suggestion,
  stream,
  suggestion,
  type UserSubscription,
  userSubscription,
  vote,
} from "./schema";

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      createdAt: new Date(),
      id,
      title,
      userId,
      visibility,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<unknown>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatbotError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      isUpvoted: type === "up",
      messageId,
    });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        content,
        createdAt: new Date(),
        id,
        kind,
        title,
        userId,
      })
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function updateDocumentContent({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    const docs = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))
      .limit(1);

    const [latest] = docs;
    if (!latest) {
      throw new ChatbotError("not_found:database", "Document not found");
    }

    return await db
      .update(document)
      .set({ content })
      .where(and(eq(document.id, id), eq(document.createdAt, latest.createdAt)))
      .returning();
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    throw new ChatbotError("bad_request:database", {
      cause: error,
    });
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch {
    // Best effort title update.
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const cutoffTime = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, cutoffTime),
          eq(message.role, "user")
        )
      );

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ chatId, createdAt: new Date(), id: streamId });
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt));

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

// --- Subscription / benefits queries -------------------------------------

export async function getAllProviders(): Promise<Provider[]> {
  try {
    return await db.select().from(provider).orderBy(asc(provider.name));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export type ProviderSummary = Provider & { benefitCount: number };

export async function getAllProvidersWithBenefitCounts(): Promise<
  ProviderSummary[]
> {
  try {
    return await db
      .select({
        annualFee: provider.annualFee,
        benefitCount: count(benefit.id),
        category: provider.category,
        createdAt: provider.createdAt,
        description: provider.description,
        id: provider.id,
        issuer: provider.issuer,
        lastCheckedAt: provider.lastCheckedAt,
        lastVerifiedAt: provider.lastVerifiedAt,
        logo: provider.logo,
        name: provider.name,
        section: provider.section,
        slug: provider.slug,
        sourceType: provider.sourceType,
        status: provider.status,
        website: provider.website,
      })
      .from(provider)
      .leftJoin(benefit, eq(benefit.providerId, provider.id))
      .groupBy(provider.id)
      .orderBy(asc(provider.name));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export type ProviderRelationSummary = {
  childId: string;
  childName: string;
  childSlug: string;
  note: string | null;
  parentId: string;
};

export async function getProviderRelations(): Promise<
  ProviderRelationSummary[]
> {
  try {
    return await db
      .select({
        childId: providerRelation.childId,
        childName: provider.name,
        childSlug: provider.slug,
        note: providerRelation.note,
        parentId: providerRelation.parentId,
      })
      .from(providerRelation)
      .innerJoin(provider, eq(providerRelation.childId, provider.id));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProvidersByIds(ids: string[]): Promise<Provider[]> {
  if (ids.length === 0) {
    return [];
  }

  try {
    return await db
      .select()
      .from(provider)
      .where(inArray(provider.id, ids))
      .orderBy(asc(provider.name));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getProviderBySlug(
  slug: string
): Promise<Provider | undefined> {
  try {
    const [row] = await db
      .select()
      .from(provider)
      .where(eq(provider.slug, slug))
      .limit(1);
    return row;
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getBenefitsByProviderId(
  providerId: string
): Promise<Benefit[]> {
  try {
    return await db
      .select()
      .from(benefit)
      .where(eq(benefit.providerId, providerId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getUserSubscriptions(
  userId: string
): Promise<UserSubscription[]> {
  try {
    return await db
      .select()
      .from(userSubscription)
      .where(eq(userSubscription.userId, userId));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function getUserProviders(userId: string): Promise<Provider[]> {
  try {
    return await db
      .select({
        annualFee: provider.annualFee,
        category: provider.category,
        createdAt: provider.createdAt,
        description: provider.description,
        id: provider.id,
        issuer: provider.issuer,
        lastCheckedAt: provider.lastCheckedAt,
        lastVerifiedAt: provider.lastVerifiedAt,
        logo: provider.logo,
        name: provider.name,
        section: provider.section,
        slug: provider.slug,
        sourceType: provider.sourceType,
        status: provider.status,
        website: provider.website,
      })
      .from(userSubscription)
      .innerJoin(provider, eq(userSubscription.providerId, provider.id))
      .where(eq(userSubscription.userId, userId))
      .orderBy(asc(provider.name));
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export async function setUserSubscriptions({
  userId,
  providerIds,
}: {
  userId: string;
  providerIds: string[];
}) {
  try {
    await db
      .delete(userSubscription)
      .where(eq(userSubscription.userId, userId));

    if (providerIds.length > 0) {
      await db.insert(userSubscription).values(
        providerIds.map((providerId) => ({
          createdAt: new Date(),
          providerId,
          userId,
        }))
      );
    }
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}

export type UserBenefit = Benefit & { providerName: string };

export async function getBenefitsForProviderIds({
  providerIds,
  category,
  query,
  limit = 25,
}: {
  providerIds: string[];
  category?: string;
  query?: string;
  limit?: number;
}): Promise<UserBenefit[]> {
  if (providerIds.length === 0) {
    return [];
  }

  try {
    const rows = await db
      .select({
        category: benefit.category,
        details: benefit.details,
        effectiveFrom: benefit.effectiveFrom,
        effectiveTo: benefit.effectiveTo,
        howToUse: benefit.howToUse,
        id: benefit.id,
        lastVerifiedAt: benefit.lastVerifiedAt,
        providerId: benefit.providerId,
        providerName: provider.name,
        sourceSnippet: benefit.sourceSnippet,
        sourceType: benefit.sourceType,
        sourceUrl: benefit.sourceUrl,
        status: benefit.status,
        summary: benefit.summary,
        tags: benefit.tags,
        title: benefit.title,
        value: benefit.value,
        verifiedBy: benefit.verifiedBy,
      })
      .from(benefit)
      .innerJoin(provider, eq(benefit.providerId, provider.id))
      .where(inArray(benefit.providerId, providerIds));

    if (!query) {
      const byCategory = category
        ? rows.filter((row) => row.category === category)
        : rows;
      return (byCategory.length > 0 ? byCategory : rows).slice(0, limit);
    }

    const terms = query
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 2);

    if (terms.length === 0) {
      const byCategory = category
        ? rows.filter((row) => row.category === category)
        : rows;
      return (byCategory.length > 0 ? byCategory : rows).slice(0, limit);
    }

    // Score across ALL of the user's benefits so a narrow category hint can
    // never hide a good keyword match; category is only a tie-breaker boost.
    const scored = rows
      .map((row) => {
        const haystack = [
          row.title,
          row.summary,
          row.details,
          row.category,
          row.providerName,
          (row.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        let score = terms.reduce(
          (total, term) => (haystack.includes(term) ? total + 1 : total),
          0
        );

        if (category && row.category === category) {
          score += 0.5;
        }

        return { row, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      return scored.map((entry) => entry.row).slice(0, limit);
    }

    const byCategory = category
      ? rows.filter((row) => row.category === category)
      : rows;

    return (byCategory.length > 0 ? byCategory : rows).slice(0, limit);
  } catch (error) {
    throw new ChatbotError("bad_request:database", { cause: error });
  }
}
