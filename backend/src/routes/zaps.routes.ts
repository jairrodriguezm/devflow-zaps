import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { Zap } from '../models/Zap.model.js';
import { User } from '../models/User.model.js';
import { ExecutionLog } from '../models/ExecutionLog.model.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { githubService } from '../services/github.service.js';

export const zapsRouter = Router();

// Protect all Zap routes with JWT authentication
zapsRouter.use(requireAuth);

const zapTriggerSchema = z.object({
  app: z.enum(['github', 'slack', 'linear', 'jira', 'discord']),
  event: z.literal('github:pull_request_opened'),
  config: z.object({
    repoOwner: z.string().min(1, 'Repository owner is required').trim(),
    repoName: z.string().min(1, 'Repository name is required').trim(),
    repoFullName: z.string().min(1, 'Repository full name is required').trim(),
  }),
});

const zapActionSchema = z.object({
  app: z.enum(['github', 'slack', 'linear', 'jira', 'discord']),
  event: z.enum(['github:comment_pull_request', 'slack:send_channel_message']),
  config: z.object({
    commentTemplate: z.string().min(1, 'Comment template is required'),
  }),
});

const createZapSchema = z.object({
  name: z.string().min(1, 'Zap name is required').trim(),
  isActive: z.boolean().default(true),
  trigger: zapTriggerSchema,
  action: zapActionSchema,
});

const updateZapSchema = z.object({
  name: z.string().min(1).trim().optional(),
  isActive: z.boolean().optional(),
  trigger: zapTriggerSchema.optional(),
  action: zapActionSchema.optional(),
});

/**
 * GET /api/zaps/repos
 * Lists repositories for the authenticated user to populate the App Picker/Repo dropdown.
 */
zapsRouter.get('/repos', async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select('+accessToken');
  if (!user || !user.accessToken) {
    res.status(400).json({ error: 'User does not have an active GitHub access token' });
    return;
  }

  const repos = await githubService.getUserRepositories(user.accessToken);
  res.json(repos);
});

/**
 * GET /api/zaps
 * Lists only the Zaps owned by the authenticated user.
 */
zapsRouter.get('/', async (req: Request, res: Response) => {
  const zaps = await Zap.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  res.json(zaps);
});

/**
 * POST /api/zaps
 * Creates a new Zap and automatically registers a webhook if active and pointing to GitHub.
 */
zapsRouter.post('/', async (req: Request, res: Response) => {
  const validation = createZapSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const zapData = validation.data;

  // Create Zap associated exclusively with user
  const zap = await Zap.create({
    ...zapData,
    userId: req.user!.id,
  });

  // If active and GitHub trigger, attempt to register webhook transparently
  if (zap.isActive && zap.trigger.app === 'github') {
    const user = await User.findById(req.user!.id).select('+accessToken');
    if (user && user.accessToken) {
      const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000/api/webhooks/github';
      const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

      try {
        await githubService.ensureWebhookSubscription(
          user.accessToken,
          zap.trigger.config.repoOwner,
          zap.trigger.config.repoName,
          webhookBaseUrl,
          webhookSecret
        );
      } catch (hookError) {
        // Non-blocking: record warning so Zap creation is not halted if user doesn't have hook permissions
        console.warn(
          `[ZapsRouter] Webhook auto-registration skipped or failed for ${zap.trigger.config.repoFullName}:`,
          (hookError as Error).message
        );
      }
    }
  }

  res.status(201).json(zap);
});

/**
 * GET /api/zaps/:id
 * Fetches single Zap details, validating ownership.
 */
zapsRouter.get('/:id', async (req: Request, res: Response) => {
  const zap = await Zap.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!zap) {
    res.status(404).json({ error: 'Zap not found or access denied' });
    return;
  }

  res.json(zap);
});

/**
 * PUT /api/zaps/:id
 * Updates Zap definition or toggles isActive state.
 */
zapsRouter.put('/:id', async (req: Request, res: Response) => {
  const validation = updateZapSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const zap = await Zap.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!zap) {
    res.status(404).json({ error: 'Zap not found or access denied' });
    return;
  }

  const updateData = validation.data;
  if (updateData.name !== undefined) zap.name = updateData.name;
  if (updateData.isActive !== undefined) zap.isActive = updateData.isActive;
  if (updateData.trigger !== undefined) zap.trigger = updateData.trigger;
  if (updateData.action !== undefined) zap.action = updateData.action;

  await zap.save();

  // If toggled to active, ensure webhook is subscribed
  if (zap.isActive && zap.trigger.app === 'github') {
    const user = await User.findById(req.user!.id).select('+accessToken');
    if (user && user.accessToken) {
      const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000/api/webhooks/github';
      const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

      try {
        await githubService.ensureWebhookSubscription(
          user.accessToken,
          zap.trigger.config.repoOwner,
          zap.trigger.config.repoName,
          webhookBaseUrl,
          webhookSecret
        );
      } catch (hookError) {
        console.warn(`[ZapsRouter] Webhook check failed on update for ${zap.trigger.config.repoFullName}:`, (hookError as Error).message);
      }
    }
  }

  res.json(zap);
});

/**
 * DELETE /api/zaps/:id
 * Deletes a Zap and its execution logs, validating ownership.
 */
zapsRouter.delete('/:id', async (req: Request, res: Response) => {
  const zap = await Zap.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!zap) {
    res.status(404).json({ error: 'Zap not found or access denied' });
    return;
  }

  // Cascade delete execution logs for this Zap
  await ExecutionLog.deleteMany({ zapId: zap._id });

  res.json({ message: 'Zap and associated execution logs deleted successfully', id: req.params.id });
});

/**
 * GET /api/zaps/:id/logs
 * Retrieves execution history for this Zap in reverse chronological order.
 */
zapsRouter.get('/:id/logs', async (req: Request, res: Response) => {
  const zap = await Zap.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!zap) {
    res.status(404).json({ error: 'Zap not found or access denied' });
    return;
  }

  const logs = await ExecutionLog.find({ zapId: zap._id }).sort({ executedAt: -1 }).limit(100);
  res.json(logs);
});
