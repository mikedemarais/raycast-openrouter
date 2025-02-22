import { List, ActionPanel, Action, openExtensionPreferences, Color, getPreferenceValues } from "@raycast/api";
import { useMemo, useState } from "react";
import { useModels, useCredits } from "./api";
import { ModelInfo, Preferences, SortMode, SORT_OPTIONS } from "./types";
import { Icon } from "@raycast/api";
import { groupByFuzzyDate, roundToPenny, formatContextLength, sortModelsByMode } from "./utils";

const getFuzzyDateGroup = (date: Date): string => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return "This Week";
  } else if (diffDays < 14) {
    return "Last Week";
  } else if (diffMonths === 0) {
    return "This Month";
  } else if (diffMonths === 1) {
    return "Last Month";
  } else {
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    return `${month} ${year}`;
  }
};

function ModelListItem({ model }: { model: ModelInfo }) {
  const preferences = getPreferenceValues<Preferences>();
  
  // Create the actions that we'll reorder based on preference
  const copyAction = (
    <Action.CopyToClipboard
      title={`Copy ${model.id}`}
      content={model.id}
    />
  );
  
  const pageAction = (
    <Action.OpenInBrowser
      icon={Icon.Info}
      title="Open Model Page on OpenRouter"
      url={`https://openrouter.ai/${model.id}`}
    />
  );
  
  const chatAction = (
    <Action.OpenInBrowser
      icon={Icon.Message}
      title="Open Chat on OpenRouter"
      url={`https://openrouter.ai/chat?models=${model.id}`}
    />
  );

  // Determine which action should be first based on preference
  const getOrderedActions = () => {
    const defaultAction = preferences.defaultAction;
    const actions = [];
    
    // Add the preferred action first
    if (defaultAction === "copy") actions.push(copyAction);
    else if (defaultAction === "page") actions.push(pageAction);
    else if (defaultAction === "chat") actions.push(chatAction);
    
    // Add the remaining actions
    if (defaultAction !== "copy") actions.push(copyAction);
    if (defaultAction !== "page") actions.push(pageAction);
    if (defaultAction !== "chat") actions.push(chatAction);
    
    return actions;
  };
  
  const hasPricing = model.pricing.prompt > 0 || model.pricing.completion > 0;
  const accessories = [];
  
  if (hasPricing) {
    accessories.push(
      {
        icon: Icon.ArrowUp,
        text: `$${roundToPenny(model.pricing.prompt)}/M`,
        tooltip: `$${roundToPenny(model.pricing.prompt)}/M input tokens`,
      },
      {
        icon: Icon.ArrowDown,
        text: `$${roundToPenny(model.pricing.completion)}/M`,
        tooltip: `$${roundToPenny(model.pricing.completion)}/M output tokens`,
      }
    );
  } else {
    accessories.push({
      text: "Free",
      icon: Icon.Stars,
    });
  }
  
  accessories.push({
    tag: {
      value: `${formatContextLength(model.context_length)}`,
      color: Color.SecondaryText,
    },
    tooltip: `Context Window Length: ${model.context_length.toLocaleString()} tokens`,
    icon: Icon.Coins,
  });
  
  return (
    <List.Item
      title={{ 
        value: model.name,
        tooltip: model.name,
      }}
      subtitle={{ 
        value: model.id,
        tooltip: `Model ID: ${model.id}`,
      }}
      accessories={accessories}
      actions={
        <ActionPanel>
          {getOrderedActions()}
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const { data, isLoading, error } = useModels();
  const { data: creditsData } = useCredits();
  const [sortMode, setSortMode] = useState<SortMode>(SORT_OPTIONS.NEWEST);

  const groupedModels = useMemo(() => {
    if (!data?.data) {
      return {};
    }

    const sortedModels = sortModelsByMode(data.data, sortMode);
    
    // Only group by date for "newest" sort mode
    if (sortMode === SORT_OPTIONS.NEWEST) {
      return groupByFuzzyDate(sortedModels);
    }
    
    // For other sort modes, use a single group
    return { "Models": sortedModels };
  }, [data, sortMode]);

  if (!data && error) {
    return (
      <List.EmptyView
        title="Error loading models"
        description="Check your API key and connection"
        actions={
          <ActionPanel>
            <Action
              title="Open Preferences"
              onAction={() => openExtensionPreferences()}
            />
          </ActionPanel>
        }
      />
    );
  }

  const balance = creditsData?.data.total_credits.toFixed(2);
  const totalSpent = creditsData?.data.total_usage.toFixed(2);

  const navigationTitle = creditsData 
    ? `Balance: $${balance} ⋅ Total Spent: $${totalSpent}` 
    : "OpenRouter";

  return (
    <List
      isLoading={isLoading}
      navigationTitle={navigationTitle}
      searchBarPlaceholder="Search models..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Sort Models"
          value={sortMode}
          onChange={(newValue) => setSortMode(newValue as SortMode)}
        >
          <List.Dropdown.Item 
            key={SORT_OPTIONS.NEWEST} 
            title="Sort by Newest" 
            value={SORT_OPTIONS.NEWEST}
          />
          <List.Dropdown.Item 
            key={SORT_OPTIONS.CONTEXT} 
            title="Sort by Context Length" 
            value={SORT_OPTIONS.CONTEXT}
          />
          <List.Dropdown.Item 
            key={SORT_OPTIONS.PRICE} 
            title="Sort by Price" 
            value={SORT_OPTIONS.PRICE}
          />
        </List.Dropdown>
      }
      throttle
    >
      {Object.entries(groupedModels).map(([group, models]) => (
        <List.Section key={group} title={group}>
          {(models as ModelInfo[]).map((model: ModelInfo) => (
            <ModelListItem key={model.id} model={model} />
          ))}
        </List.Section>
      ))}
    </List>
  );
} 