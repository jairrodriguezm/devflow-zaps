import { Schema, model, type Document, type Types } from 'mongoose';
import type { ExecutionLogItem } from '@shared';

export interface IExecutionLogDetails {
  prNumber?: number;
  prUrl?: string;
  renderedComment?: string;
  error?: string;
}

export interface IExecutionLog extends Omit<ExecutionLogItem, '_id' | 'zapId' | 'executedAt' | 'details'> {
  zapId: Types.ObjectId;
  deliveryId: string;
  status: 'success' | 'failed' | 'simulated';
  event: string;
  details: IExecutionLogDetails;
  executedAt: Date;
}

export type ExecutionLogDocument = Document<Types.ObjectId, {}, IExecutionLog> & IExecutionLog;

const executionLogSchema = new Schema<IExecutionLog>(
  {
    zapId: {
      type: Schema.Types.ObjectId,
      ref: 'Zap',
      required: true,
      index: true,
    },
    deliveryId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'simulated'],
      required: true,
      default: 'success',
      index: true,
    },
    event: {
      type: String,
      required: true,
    },
    details: {
      prNumber: { type: Number },
      prUrl: { type: String },
      renderedComment: { type: String },
      error: { type: String },
    },
    executedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index for history queries in reverse chronological order
executionLogSchema.index({ zapId: 1, executedAt: -1 });

export const ExecutionLog = model<IExecutionLog>('ExecutionLog', executionLogSchema);
