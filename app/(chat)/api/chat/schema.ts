import { z } from "zod";
import {
  MAX_CONVERSATION_CHARS,
  MAX_CONVERSATION_MESSAGES,
  MAX_MESSAGE_LENGTH,
  MAX_SUBSCRIPTION_IDS,
} from "@/lib/constants";

const textPartSchema = z.object({
  text: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  type: z.enum(["text"]),
});

const filePartSchema = z.object({
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  type: z.enum(["file"]),
  url: z.url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.uuid(),
  parts: z.array(partSchema),
  role: z.enum(["user"]),
});

const toolApprovalMessageSchema = z.object({
  id: z.string().max(200),
  parts: z.array(z.record(z.string(), z.unknown())).max(200),
  role: z.enum(["user", "assistant"]),
});

export const postRequestBodySchema = z
  .object({
    message: userMessageSchema.optional(),
    messages: z
      .array(toolApprovalMessageSchema)
      .max(MAX_CONVERSATION_MESSAGES)
      .optional(),
    selectedChatModel: z.string().max(200),
    selectedVisibilityType: z.enum(["public", "private"]),
    subscriptionIds: z
      .array(z.string().max(64))
      .max(MAX_SUBSCRIPTION_IDS)
      .optional(),
  })
  .superRefine((body, ctx) => {
    const input = body.messages ?? (body.message ? [body.message] : []);
    let totalChars = 0;

    for (const message of input) {
      for (const part of message.parts) {
        for (const value of Object.values(part)) {
          if (typeof value === "string") {
            totalChars += value.length;
          }
        }
      }
    }

    if (totalChars > MAX_CONVERSATION_CHARS) {
      ctx.addIssue({
        code: "custom",
        message: "Conversation is too long",
        path: ["messages"],
      });
    }
  });

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
