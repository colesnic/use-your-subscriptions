import "server-only";

import { computeBenefitStates } from "@/lib/benefit-state";
import {
  getUserBenefits,
  getUserProviderIds,
  getUserUsage,
} from "@/lib/db/account";

const FALLBACK = [
  "I need to rent a car",
  "I dropped my phone",
  "How can I get cheaper gas",
  "What card do I use for groceries",
];

export async function getRecommendedQuestions(
  userId: string | null
): Promise<string[]> {
  if (!userId) {
    return FALLBACK;
  }

  const [providerIds, benefits, usage] = await Promise.all([
    getUserProviderIds(userId),
    getUserBenefits(userId),
    getUserUsage(userId),
  ]);

  if (providerIds.length === 0) {
    return FALLBACK;
  }

  const states = computeBenefitStates(benefits, usage);
  const questions: string[] = [];

  const hasExpiring = states.some(
    (state) =>
      !(state.used || state.irrelevant) &&
      state.daysLeft !== null &&
      state.daysLeft <= 14
  );
  if (hasExpiring) {
    questions.push("What should I use before the end of the month?");
  }

  const categories = new Set(benefits.map((benefit) => benefit.category));
  if (categories.has("car_rental")) {
    questions.push("I'm renting a car this weekend.");
  }
  if (categories.has("lounge") || categories.has("travel")) {
    questions.push("I'm flying tomorrow.");
  }
  if (categories.has("shopping")) {
    questions.push("I'm buying a new laptop.");
  }
  if (categories.has("dining")) {
    questions.push("Where can I save money on food delivery?");
  }
  questions.push("What benefits am I forgetting?");

  return [...new Set(questions)].slice(0, 5);
}
