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
} 