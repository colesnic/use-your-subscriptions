import { tool } from "ai";
import { z } from "zod";
import { getBenefitsForProviderIds } from "@/lib/db/queries";

export const benefitCategories = [
  "rewards",
  "car_rental",
  "travel",
  "dining",
  "shopping",
  "lounge",
  "insurance",
  "security",
  "streaming",
  "everyday",
] as const;

export const searchBenefits = ({ providerIds }: { providerIds: string[] }) =>
  tool({
    description:
      "Look up the benefits and perks the user actually has, based on the subscriptions they selected. Call this before answering any question about what a user's cards, memberships, or programs cover — for example rental car insurance, travel credits, lounge access, or purchase protection. Returns benefit details, how to use them, and which provider offers each one.",
    execute: async ({ category, query }) => {
      const benefits = await getBenefitsForProviderIds({
        category,
        providerIds,
        query,
      });

      if (benefits.length === 0) {
        return {
          benefits: [],
          note: "No matching benefits found. The user may not have selected relevant subscriptions, or there is no benefit in our database for this. Do not invent benefits.",
        };
      }

      return {
        benefits: benefits.map((item) => ({
          category: item.category,
          details: item.details,
          howToUse: item.howToUse,
          lastVerifiedAt: item.lastVerifiedAt
            ? item.lastVerifiedAt.toISOString().slice(0, 10)
            : null,
          provider: item.providerName,
          sourceType: item.sourceType,
          sourceUrl: item.sourceUrl,
          status: item.status,
          summary: item.summary,
          title: item.title,
          value: item.value,
        })),
      };
    },
    inputSchema: z.object({
      category: z
        .enum(benefitCategories)
        .optional()
        .describe(
          "Optional category filter. Use 'rewards' for earning rates and points multipliers (e.g. 'which card should I use for groceries'), 'car_rental' for rental car questions, 'lounge' for airport lounges, 'travel' for credits and trip perks, 'insurance' for coverage questions."
        ),
      query: z
        .string()
        .optional()
        .describe(
          "Short keywords to search across benefit titles, summaries, and details, e.g. 'rental car', 'Hertz', 'collision', 'Global Entry', 'airline credit'. Prefer a few keywords over a long sentence."
        ),
    }),
  });
