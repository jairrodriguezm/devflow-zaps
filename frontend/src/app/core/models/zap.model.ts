import type {
  SupportedApp,
  TriggerEventType,
  ActionEventType,
  TriggerConfig,
  ActionConfig,
  ZapDefinition,
  ExecutionLogItem,
  CopilotPromptRequest,
  CopilotDraftResponse,
} from '@shared';

export type {
  SupportedApp,
  TriggerEventType,
  ActionEventType,
  TriggerConfig,
  ActionConfig,
  ZapDefinition,
  ExecutionLogItem,
  CopilotPromptRequest,
  CopilotDraftResponse,
};

export interface RepositoryItem {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string | null;
  htmlUrl: string;
}
