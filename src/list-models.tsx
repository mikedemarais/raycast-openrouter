import { List, ActionPanel, Action, Detail, openExtensionPreferences, showToast, Toast, Color } from "@raycast/api";
import { useMemo, useState, useEffect } from "react";
import { useModels, useCredits } from "./api";
import { ModelInfo } from "./types";
import { Icon } from "@raycast/api";

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

const groupByFuzzyDate = (models: ModelInfo[]) => {
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

const roundToPenny = (value: number): number => {
  // Handle very small numbers (less than $0.01)
  if (value < 0.01) {
    return Math.ceil(value * 100) / 100; // Round up to ensure we show at least $0.01
  }
  return Math.round(value * 100) / 100;
};

const formatContextLength = (tokens: number): string => {
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

function ModelListItem({ model }: { model: ModelInfo }) {
  const pricingText = `$${roundToPenny(model.pricing.prompt)}/M input, $${roundToPenny(model.pricing.completion)}/M output`;
  
  // subtitle={pricingText}
  return (
    <List.Item
      title={model.name}
      subtitle={model.id}
      accessories={[
        {
          // tag: {
          //   value: `Input: ${roundToPenny(model.pricing.prompt)}/M`,
          //   // color: Color.SecondaryText,
          // },
          icon: Icon.ArrowUp,
          // text: `Input: $${roundToPenny(model.pricing.prompt)}/M`,
          text: `$${roundToPenny(model.pricing.prompt)}/M`,
        },
        {
          // tag: {
          //   value: `Output: ${roundToPenny(model.pricing.completion)}/M`,
          //   // color: Color.SecondaryText,
          // },
          icon: Icon.ArrowDown,
          // text: `Output: $${roundToPenny(model.pricing.completion)}/M`,
          text: `$${roundToPenny(model.pricing.completion)}/M`,
        },
        {
          tag: {
            // value: `${formatContextLength(model.context_length)} context`,
            value: `${formatContextLength(model.context_length)}`,
            color: Color.SecondaryText,
          },
          icon: Icon.Coins,
          // text: `${formatContextLength(model.context_length)} context`,
        },
      ]}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Model ID"
            content={model.id}
          />
          <Action.Push
            title="View Details"
            target={<ModelDetailView model={model} />}
          />
          <Action.OpenInBrowser
            title="Open Documentation"
            url={`https://openrouter.ai/docs#${model.id}`}
          />
        </ActionPanel>
      }
    />
  );
}

function ModelDetailView({ model }: { model: ModelInfo }) {
  const markdown = `
# ${model.name}

${model.description}

## Technical Details

- **Context Length:** ${model.context_length} tokens
${model.architecture?.tokenizer ? `- **Tokenizer:** ${model.architecture.tokenizer}` : ''}
${model.architecture?.instruct_template ? `- **Instruct Template:** ${model.architecture.instruct_template}` : ''}

## Pricing

- **Prompt:** $${model.pricing.prompt} per 1M tokens
- **Completion:** $${model.pricing.completion} per 1M tokens

${model.per_request_limits ? `## Request Limits

${model.per_request_limits.prompt_tokens ? `- **Max Prompt Tokens:** ${model.per_request_limits.prompt_tokens}` : ''}
${model.per_request_limits.completion_tokens ? `- **Max Completion Tokens:** ${model.per_request_limits.completion_tokens}` : ''}` : ''}
  `.trim();

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Model ID"
            text={model.id}
          />
          <Detail.Metadata.Label
            title="Provider"
            text={model.id.split("/")[0]}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Context Length"
            text={`${model.context_length} tokens`}
          />
          <Detail.Metadata.Label
            title="Prompt Cost"
            text={`$${model.pricing.prompt}/1M tokens`}
          />
          <Detail.Metadata.Label
            title="Completion Cost"
            text={`$${model.pricing.completion}/1M tokens`}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Model ID"
            content={model.id}
          />
          <Action.OpenInBrowser
            title="Open Documentation"
            url={`https://openrouter.ai/docs#${model.id}`}
          />
        </ActionPanel>
      }
    />
  );
}

type SortMode = "newest" | "context" | "price";

const sortModelsByMode = (models: ModelInfo[], mode: SortMode): ModelInfo[] => {
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

export default function Command() {
  const { data, isLoading, error } = useModels();
  const { data: creditsData } = useCredits();
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    if (creditsData?.data) {
      const { total_credits, total_usage } = creditsData.data;
      const remainingCredits = total_credits - total_usage;
      showToast({
        style: Toast.Style.Success,
        title: "OpenRouter Credits",
        message: `Balance: $${remainingCredits.toFixed(2)}`,
      });
    }
  }, [creditsData]);

  const groupedModels = useMemo(() => {
    if (!data?.data) {
      return {};
    }

    const sortedModels = sortModelsByMode(data.data, sortMode);
    
    // Only group by date for "newest" sort mode
    if (sortMode === "newest") {
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

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search models..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Sort Models"
          value={sortMode}
          onChange={(newValue) => setSortMode(newValue as SortMode)}
        >
          <List.Dropdown.Item 
            key="newest" 
            title="Sort by Newest" 
            value="newest"
            icon={Icon.Calendar}
          />
          <List.Dropdown.Item 
            key="context" 
            title="Sort by Context Length" 
            value="context"
            icon={Icon.TextInput}
          />
          <List.Dropdown.Item 
            key="price" 
            title="Sort by Price" 
            value="price"
            icon={Icon.BankNote}
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