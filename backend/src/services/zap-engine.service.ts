import { Zap } from '../models/Zap.model.js';
import { User } from '../models/User.model.js';
import { ExecutionLog } from '../models/ExecutionLog.model.js';
import { githubService } from './github.service.js';
import { interpolateTemplate } from '../utils/template.js';

export interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  pull_request?: {
    number: number;
    title: string;
    html_url: string;
    user?: {
      login: string;
    };
  };
}

export interface WebhookExecutionResult {
  ignored?: boolean;
  reason?: string;
  deliveryId: string;
  matchedZaps?: number;
  executions?: Array<{
    zapId: string;
    zapName: string;
    status: 'success' | 'failed' | 'simulated';
    error?: string;
  }>;
}

export class ZapEngineService {
  /**
   * Processes a GitHub webhook event, matching active Zaps and executing defined actions.
   */
  async processGitHubWebhook(
    payload: GitHubWebhookPayload,
    deliveryId: string
  ): Promise<WebhookExecutionResult> {
    // 1. Idempotency Check
    const existingLog = await ExecutionLog.findOne({ deliveryId });
    if (existingLog) {
      console.log(`[ZapEngine] Duplicate deliveryId detected: ${deliveryId}. Skipping execution.`);
      return {
        ignored: true,
        reason: 'Duplicate deliveryId already processed',
        deliveryId,
      };
    }

    // 2. Event verification: only process PR opened
    if (payload.action !== 'opened' || !payload.pull_request || !payload.repository) {
      return {
        ignored: true,
        reason: `Ignored action "${payload.action}" or incomplete PR payload`,
        deliveryId,
      };
    }

    // 3. Extract PR parameters
    const repoFullName = payload.repository.full_name;
    const repoOwner = payload.repository.owner.login;
    const repoName = payload.repository.name;
    const prNumber = payload.pull_request.number;
    const prTitle = payload.pull_request.title;
    const prUrl = payload.pull_request.html_url;
    const prAuthor = payload.pull_request.user?.login || 'unknown';

    // 4. Find all active Zaps configured for this repository
    const matchingZaps = await Zap.find({
      'trigger.config.repoFullName': repoFullName,
      isActive: true,
    });

    if (matchingZaps.length === 0) {
      console.log(`[ZapEngine] No active Zaps found matching repository: ${repoFullName}`);
      return {
        ignored: true,
        reason: `No active Zaps registered for repository ${repoFullName}`,
        deliveryId,
        matchedZaps: 0,
      };
    }

    console.log(`[ZapEngine] Found ${matchingZaps.length} active Zap(s) for ${repoFullName}`);

    // 5. Build template interpolation context
    const context = {
      'pr.author': prAuthor,
      'pr.number': prNumber,
      'pr.title': prTitle,
      'pr.url': prUrl,
      'repo.name': repoName,
      'repo.owner': repoOwner,
      'repo.fullName': repoFullName,
      pr: {
        author: prAuthor,
        number: prNumber,
        title: prTitle,
        url: prUrl,
      },
      repo: {
        name: repoName,
        owner: repoOwner,
        fullName: repoFullName,
      },
    };

    const executions: WebhookExecutionResult['executions'] = [];

    // 6. Execute each matched Zap
    for (const zap of matchingZaps) {
      try {
        const owner = await User.findById(zap.userId).select('+accessToken');
        const renderedComment = interpolateTemplate(zap.action.config.commentTemplate, context);

        if (zap.action.app === 'github') {
          if (!owner || !owner.accessToken) {
            throw new Error(`Owner of Zap "${zap.name}" lacks a valid GitHub access token`);
          }

          // Execute action via Octokit
          await githubService.postPullRequestComment(
            owner.accessToken,
            repoOwner,
            repoName,
            prNumber,
            renderedComment
          );

          await ExecutionLog.create({
            zapId: zap._id,
            deliveryId,
            status: 'success',
            event: 'github:pull_request_opened',
            details: {
              prNumber,
              prUrl,
              renderedComment,
            },
            executedAt: new Date(),
          });

          executions.push({
            zapId: zap._id.toString(),
            zapName: zap.name,
            status: 'success',
          });
        } else {
          // Simulated App Action (Slack, Linear, Jira, Discord)
          console.log(`[ZapEngine] Simulated execution for 3rd-party app "${zap.action.app}":`, renderedComment);

          await ExecutionLog.create({
            zapId: zap._id,
            deliveryId,
            status: 'simulated',
            event: 'github:pull_request_opened',
            details: {
              prNumber,
              prUrl,
              renderedComment,
            },
            executedAt: new Date(),
          });

          executions.push({
            zapId: zap._id.toString(),
            zapName: zap.name,
            status: 'simulated',
          });
        }
      } catch (err) {
        const errorMessage = (err as Error).message || 'Unknown execution error';
        console.error(`[ZapEngine] Execution failed for Zap "${zap.name}":`, errorMessage);

        await ExecutionLog.create({
          zapId: zap._id,
          deliveryId,
          status: 'failed',
          event: 'github:pull_request_opened',
          details: {
            prNumber,
            prUrl,
            error: errorMessage,
          },
          executedAt: new Date(),
        });

        executions.push({
          zapId: zap._id.toString(),
          zapName: zap.name,
          status: 'failed',
          error: errorMessage,
        });
      }
    }

    return {
      deliveryId,
      matchedZaps: matchingZaps.length,
      executions,
    };
  }
}

export const zapEngineService = new ZapEngineService();
