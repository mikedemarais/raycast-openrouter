import { showToast, Toast } from "@raycast/api";
import { useFetch, showFailureToast } from "@raycast/utils";
import { ModelsResponse } from "./types";

const API_BASE_URL = "https://openrouter.ai/api/v1";

// Common headers used in all requests
const COMMON_HEADERS = {
  "HTTP-Referer": "https://raycast.com/openrouter",
  "X-Title": "Raycast OpenRouter Extension",
};
export const useModels = () =>
  useFetch<ModelsResponse>(`${API_BASE_URL}/models`, {
    headers: COMMON_HEADERS,
    keepPreviousData: true,
    async parseResponse(response) {
      if (!response.ok) {
        throw new Error(`Failed to load models: ${response.status}`);
      }
      return response.json();
    },
    onError(error) {
      showFailureToast(error, { title: "Error loading models" });
    },
  });
