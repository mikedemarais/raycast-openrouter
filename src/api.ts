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

export function useModels() {
  return useFetch<ModelsResponse>(`${API_BASE_URL}/models`, {
    headers: getHeaders(),
    keepPreviousData: true,
    onData: (data) => {
      // Log the first model as an example of the structure
      if (data?.data?.[0]) {
        console.log('Sample model structure:', JSON.stringify(data.data[0], null, 2));
      }
      
      // Log available sorting keys
      if (data?.data?.[0]) {
        console.log('Available model keys for sorting:', Object.keys(data.data[0]));
      }
      
      // Log models sorted by pricing
      console.log('Models by completion price:', 
        data?.data
          ?.slice(0, 3) // Log just first 3 for brevity
          .map(m => `${m.id}: $${m.pricing.completion}`)
      );
    },
    onError: (error: Error) => {
      console.error("Error fetching models:", error);
      
      const message = error.message;
      const isAuthError = message.toLowerCase().includes("unauthorized") || message.includes("401");
      
      showToast({
        style: Toast.Style.Failure,
        title: isAuthError ? "Invalid API Key" : "Failed to load models",
        message: isAuthError 
          ? "Please check your OpenRouter API key in preferences"
          : message
      });
    }
  });
}

export function useCredits() {
  return useFetch<CreditsResponse>(`${API_BASE_URL}/credits`, {
    headers: getHeaders(),
    keepPreviousData: true,
    onError: (error: Error) => {
      console.error("Error fetching credits:", error);
      
      const message = error.message;
      const isAuthError = message.toLowerCase().includes("unauthorized") || message.includes("401");
      
      showToast({
        style: Toast.Style.Failure,
        title: isAuthError ? "Invalid API Key" : "Failed to load credits",
        message: isAuthError 
          ? "Please check your OpenRouter API key in preferences"
          : message
      });
    }
  });
}

export function getModelProviderFromId(modelId: string): string {
  return modelId.includes("/") ? modelId.split("/")[0] : "Other";
} 