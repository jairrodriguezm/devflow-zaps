import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { zapEngineService } from '../services/zap-engine.service.js';

export const webhooksRouter = Router();

/**
 * Validates GitHub Webhook HMAC SHA-256 signature if secret is configured.
 */
function verifyWebhookSignature(req: Request): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const signature = req.headers['x-hub-signature-256'] as string | undefined;

  // If no secret configured or in local development without header, allow
  if (!secret || !signature) {
    return true;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/github
 * Public endpoint to receive GitHub webhook events.
 */
webhooksRouter.post('/github', async (req: Request, res: Response) => {
  const event = req.headers['x-github-event'] as string | undefined;
  const deliveryId = (req.headers['x-github-delivery'] as string) || `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Validate signature if configured
  if (!verifyWebhookSignature(req)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  // 2. Ignore non-pull_request events
  if (event && event !== 'pull_request') {
    res.status(200).json({
      ignored: true,
      reason: `Ignored event: ${event}. Only "pull_request" events are processed.`,
      deliveryId,
    });
    return;
  }

  // 3. Process with Zap Execution Engine
  const result = await zapEngineService.processGitHubWebhook(req.body, deliveryId);

  res.status(200).json(result);
});
