export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;

export const MAX_MESSAGE_LENGTH = 200;
export const MAX_CONVERSATION_MESSAGES = 50;
export const MAX_CONVERSATION_CHARS = 40_000;
export const MAX_SUBSCRIPTION_IDS = 200;

/**
 * The app is anonymous (no auth). Documents/artifacts are attributed to this
 * fixed user id, which is seeded into the DB.
 */
export const ANONYMOUS_USER_ID = "00000000-0000-4000-8000-000000000000";

export const suggestions = [
  "I need to rent a car",
  "I dropped my phone",
  "How can I get cheaper gas",
  "What card do I use for groceries",
];
