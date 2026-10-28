import { Schema, model, type Document, type Types } from 'mongoose';
import type {
  SupportedApp,
  TriggerEventType,
  ActionEventType,
  TriggerConfig,
  ActionConfig,
  ZapDefinition,
} from '@shared';

export interface IZapTrigger {
  app: SupportedApp;
  event: TriggerEventType;
  config: TriggerConfig;
}

export interface IZapAction {
  app: SupportedApp;
  event: ActionEventType;
  config: ActionConfig;
}

export interface IZap extends Omit<ZapDefinition, '_id' | 'userId' | 'trigger' | 'action' | 'createdAt' | 'updatedAt'> {
  userId: Types.ObjectId;
  name: string;
  isActive: boolean;
  trigger: IZapTrigger;
  action: IZapAction;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ZapDocument = Document<Types.ObjectId, {}, IZap> & IZap;

const triggerSchema = new Schema<IZapTrigger>(
  {
    app: {
      type: String,
      required: true,
      enum: ['github', 'slack', 'linear', 'jira', 'discord'],
      default: 'github',
    },
    event: {
      type: String,
      required: true,
      default: 'github:pull_request_opened',
    },
    config: {
      repoOwner: { type: String, required: true, trim: true },
      repoName: { type: String, required: true, trim: true },
      repoFullName: { type: String, required: true, trim: true },
    },
  },
  { _id: false }
);

const actionSchema = new Schema<IZapAction>(
  {
    app: {
      type: String,
      required: true,
      enum: ['github', 'slack', 'linear', 'jira', 'discord'],
      default: 'github',
    },
    event: {
      type: String,
      required: true,
      default: 'github:comment_pull_request',
    },
    config: {
      commentTemplate: { type: String, required: true },
    },
  },
  { _id: false }
);

const zapSchema = new Schema<IZap>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    trigger: {
      type: triggerSchema,
      required: true,
    },
    action: {
      type: actionSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast webhook trigger resolution
zapSchema.index({ 'trigger.config.repoFullName': 1, isActive: 1 });

export const Zap = model<IZap>('Zap', zapSchema);
