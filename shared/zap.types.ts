export type SupportedApp = 'github' | 'slack' | 'linear' | 'jira' | 'discord';

export type TriggerEventType = 'github:pull_request_opened';
export type ActionEventType = 'github:comment_pull_request' | 'slack:send_channel_message';

export interface TriggerConfig {
  repoOwner: string;      
  repoName: string;       
  repoFullName: string; 
}

export interface ActionConfig {
  commentTemplate: string; 
}

export interface ZapDefinition {
  _id?: string;
  userId: string;
  name: string;
  isActive: boolean;
  trigger: {
    app: SupportedApp;
    event: TriggerEventType;
    config: TriggerConfig;
  };
  action: {
    app: SupportedApp;
    event: ActionEventType;
    config: ActionConfig;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ExecutionLogItem {
  _id?: string;
  zapId: string;
  deliveryId: string;
  status: 'success' | 'failed' | 'simulated';
  event: string;
  details: {
    prNumber?: number;
    prUrl?: string;
    renderedComment?: string;
    error?: string;
  };
  executedAt: string;
}

export interface CopilotPromptRequest {
  prompt: string;
}

export interface CopilotDraftResponse {
  name: string;
  trigger: ZapDefinition['trigger'];
  action: ZapDefinition['action'];
  explanation: string;
}