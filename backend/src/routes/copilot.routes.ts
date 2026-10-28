import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware.js';
import { copilotService } from '../services/copilot.service.js';

export const copilotRouter = Router();

// Protect Copilot endpoint with JWT authentication
copilotRouter.use(requireAuth);

const copilotPromptSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters long').trim(),
});

/**
 * POST /api/zaps/copilot
 * Transforms natural language prompt into a structured Zap definition draft.
 */
copilotRouter.post('/', async (req: Request, res: Response) => {
  const validation = copilotPromptSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const { prompt } = validation.data;
  const draft = await copilotService.generateDraft(prompt);

  res.json(draft);
});
