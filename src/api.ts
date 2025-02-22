import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { ModelsResponse, CreditsResponse, Preferences } from "./types";

const API_BASE_URL = "https://openrouter.ai/api/v1";

const getHeaders = () => {
  const { apiKey } = getPreferenceValues<Preferences>();
  return {
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://raycast.com/openrouter",
    "X-Title": "Raycast OpenRouter Extension"
  };
};

const handleApiError = (error: Error, context: string) => {
  console.error(`Error ${context}:`, error);
  
  const message = error.message;
  const isAuthError = message.toLowerCase().includes("unauthorized") || message.includes("401");
  
  showToast({
    style: Toast.Style.Failure,
    title: isAuthError ? "Invalid API Key" : `Failed to ${context}`,
    message: isAuthError 
      ? "Please check your OpenRouter API key in preferences"
      : message
  });
};

export function useModels() {
  return useFetch<ModelsResponse>(`${API_BASE_URL}/models`, {
    headers: getHeaders(),
    keepPreviousData: true,
    onError: (error: Error) => handleApiError(error, "load models")
  });
}

export function useCredits() {
  return useFetch<CreditsResponse>(`${API_BASE_URL}/credits`, {
    headers: getHeaders(),
    keepPreviousData: true,
    onError: (error: Error) => handleApiError(error, "load credits")
  });
}

export function getModelProviderFromId(modelId: string): string {
  return modelId.includes("/") ? modelId.split("/")[0] : "Other";
} 