export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  created: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture?: {
    tokenizer?: string;
    instruct_template?: string;
  };
  per_request_limits?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export interface ModelsResponse {
  data: ModelInfo[];
  message?: string;
}

export interface CreditsResponse {
  data: {
    total_credits: number;
    total_usage: number;
  };
}

export interface Preferences {
  apiKey: string;
  defaultAction: DefaultAction;
}

export type DefaultAction = "copy" | "page" | "chat";
export type SortMode = "newest" | "context" | "price";

export const SORT_OPTIONS = {
  NEWEST: "newest" as const,
  CONTEXT: "context" as const,
  PRICE: "price" as const,
} as const;

export const TIME_GROUPS = {
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  THIS_WEEK: "This Week",
  LAST_WEEK: "Last Week",
  THIS_MONTH: "This Month",
  LAST_MONTH: "Last Month",
} as const;

export type TimeGroup = typeof TIME_GROUPS[keyof typeof TIME_GROUPS] | string; 