export const DEFAULT_CHAT_MODEL = "deepseek/deepseek-chat";

export const titleModel = {
  description: "Fast model for title generation",
  id: "deepseek/deepseek-chat",
  name: "DeepSeek Chat",
  provider: "deepseek",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  gatewayOrder?: string[];
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

export const chatModels: ChatModel[] = [
  {
    description: "Fast and capable model with tool use",
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "deepseek",
  },
  {
    description: "Reasoning-focused model for harder questions",
    id: "deepseek/deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "deepseek",
  },
];

const capabilitiesByModel: Record<string, ModelCapabilities> = {
  "deepseek/deepseek-chat": { reasoning: false, tools: true, vision: false },
  "deepseek/deepseek-reasoner": { reasoning: true, tools: true, vision: false },
};

export function getCapabilities(): Record<string, ModelCapabilities> {
  return Object.fromEntries(
    chatModels.map((model) => [
      model.id,
      capabilitiesByModel[model.id] ?? {
        reasoning: false,
        tools: true,
        vision: false,
      },
    ])
  );
}

export const isDemo = process.env.IS_DEMO === "1";

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export function getAllGatewayModels(): GatewayModelWithCapabilities[] {
  const capabilities = getCapabilities();
  return chatModels.map((model) => ({
    ...model,
    capabilities: capabilities[model.id] ?? {
      reasoning: false,
      tools: true,
      vision: false,
    },
  }));
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

export type ModelAvailability = "healthy" | "impacted" | "unknown";

export function getModelAvailability(
  _modelId: string
): Promise<ModelAvailability> {
  return Promise.resolve("healthy");
}
