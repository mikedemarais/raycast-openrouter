import { ModelInfo, TimeGroup, TIME_GROUPS, SortMode } from "./types";

export const getFuzzyDateGroup = (date: Date): TimeGroup => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

  if (diffDays === 0) {
    return TIME_GROUPS.TODAY;
  } else if (diffDays === 1) {
    return TIME_GROUPS.YESTERDAY;
  } else if (diffDays < 7) {
    return TIME_GROUPS.THIS_WEEK;
  } else if (diffDays < 14) {
    return TIME_GROUPS.LAST_WEEK;
  } else if (diffMonths === 0) {
    return TIME_GROUPS.THIS_MONTH;
  } else if (diffMonths === 1) {
    return TIME_GROUPS.LAST_MONTH;
  } else {
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    return `${month} ${year}`;
  }
};

export const groupByFuzzyDate = (models: ModelInfo[]) => {
  const groups: { [key: string]: ModelInfo[] } = {};

  models.forEach(model => {
    const date = new Date(model.created * 1000);
    const groupKey = getFuzzyDateGroup(date);

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(model);
  });

  return groups;
};

export const roundToPenny = (value: number): number => {
  // Convert per-token price to per-million tokens
  const perMillionTokens = value * 1000000;
  
  // Handle very small numbers (less than $0.01)
  if (perMillionTokens < 0.01) {
    return Math.ceil(perMillionTokens * 100) / 100; // Round up to ensure we show at least $0.01
  }
  return Math.round(perMillionTokens * 100) / 100;
};

export const formatContextLength = (tokens: number): string => {
  if (tokens < 1000) {
    return `${tokens}`;
  }
  // If tokens are 1 million or more
  if (tokens >= 1000000) {
    const inMillions = Math.round(tokens / 1000000 * 10) / 10;
    return `${inMillions}M`;
  }
  // For tokens between 1000 and 999999
  const inThousands = Math.round(tokens / 1000);
  return `${inThousands}k`;
};

export const sortModelsByMode = (models: ModelInfo[], mode: SortMode): ModelInfo[] => {
  const sortedModels = [...models];
  
  switch (mode) {
    case "newest":
      return sortedModels.sort((a, b) => (b.created || 0) - (a.created || 0));
    case "context":
      return sortedModels.sort((a, b) => b.context_length - a.context_length);
    case "price":
      return sortedModels.sort((a, b) => a.pricing.prompt - b.pricing.prompt);
    default:
      return sortedModels;
  }
}; 