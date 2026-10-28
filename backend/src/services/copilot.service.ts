import OpenAI from 'openai';
import type { CopilotDraftResponse } from '@shared';

const COPILOT_SYSTEM_PROMPT = `You are the DevFlow Zaps AI Copilot.
Your role is to transform natural language developer automation requests into a structured Zap draft.

Rules:
1. Output format must strictly match the JSON Schema.
2. Trigger must be:
   - app: "github"
   - event: "github:pull_request_opened"
   - config:
     - If the user prompt mentions a specific repository in owner/repo format, extract repoOwner, repoName, and repoFullName.
     - If no repository is mentioned, set repoOwner: "", repoName: "", repoFullName: "".
3. Action must be:
   - app: "github"
   - event: "github:comment_pull_request"
   - config.commentTemplate: A friendly, developer-centric markdown comment that uses available tokens:
     * {{pr.author}} - GitHub username of the PR author
     * {{pr.title}} - Title of the pull request
     * {{pr.number}} - Pull request number
     * {{pr.url}} - HTML URL to the pull request
     * {{repo.name}} - Name of the repository
4. Name must be concise, professional and descriptive (e.g., "Welcome Contributor & PR Checklist").
5. Explanation must be a concise, one-sentence description of the workflow.`;

export class CopilotService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && !apiKey.startsWith('sk-...')) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generates a pre-filled Zap draft from a natural language prompt.
   * Tries OpenAI Structured Outputs first, falls back to Gemini API, and lastly to heuristic generation.
   */
  async generateDraft(prompt: string): Promise<CopilotDraftResponse> {
    console.log(`[CopilotService] Processing draft prompt: "${prompt}"`);

    // 1. Try OpenAI Structured Outputs
    if (this.openai) {
      try {
        const response = await this.callOpenAI(prompt);
        if (response) {
          console.log('[CopilotService] Successfully generated draft using OpenAI');
          return response;
        }
      } catch (err) {
        console.warn('[CopilotService] OpenAI call failed, falling back to Gemini:', (err as Error).message);
      }
    }

    // 2. Try Gemini API Fallback
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key') {
      try {
        const response = await this.callGemini(prompt, geminiApiKey);
        if (response) {
          console.log('[CopilotService] Successfully generated draft using Gemini');
          return response;
        }
      } catch (err) {
        console.warn('[CopilotService] Gemini call failed, falling back to heuristic:', (err as Error).message);
      }
    }

    // 3. Resilient Heuristic Fallback for local/demo/offline testing
    console.log('[CopilotService] Generating draft using smart heuristic engine');
    return this.generateDeterministicFallback(prompt);
  }

  /**
   * Executes OpenAI API call using Structured Outputs (JSON Schema mode).
   */
  private async callOpenAI(prompt: string): Promise<CopilotDraftResponse | null> {
    if (!this.openai) return null;

    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: COPILOT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'copilot_draft_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'A concise and professional workflow name',
              },
              trigger: {
                type: 'object',
                properties: {
                  app: { type: 'string', enum: ['github'] },
                  event: { type: 'string', enum: ['github:pull_request_opened'] },
                  config: {
                    type: 'object',
                    properties: {
                      repoOwner: { type: 'string' },
                      repoName: { type: 'string' },
                      repoFullName: { type: 'string' },
                    },
                    required: ['repoOwner', 'repoName', 'repoFullName'],
                    additionalProperties: false,
                  },
                },
                required: ['app', 'event', 'config'],
                additionalProperties: false,
              },
              action: {
                type: 'object',
                properties: {
                  app: { type: 'string', enum: ['github'] },
                  event: { type: 'string', enum: ['github:comment_pull_request'] },
                  config: {
                    type: 'object',
                    properties: {
                      commentTemplate: {
                        type: 'string',
                        description: 'Markdown comment template utilizing tokens',
                      },
                    },
                    required: ['commentTemplate'],
                    additionalProperties: false,
                  },
                },
                required: ['app', 'event', 'config'],
                additionalProperties: false,
              },
              explanation: {
                type: 'string',
                description: 'A concise one-sentence description of what this Zap does',
              },
            },
            required: ['name', 'trigger', 'action', 'explanation'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as CopilotDraftResponse;
  }

  /**
   * Executes Google Gemini API call with JSON mode as fallback.
   */
  private async callGemini(prompt: string, apiKey: string): Promise<CopilotDraftResponse | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${COPILOT_SYSTEM_PROMPT}\n\nUser request: "${prompt}"\n\nReturn strictly valid JSON matching the schema.` },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text) as CopilotDraftResponse;
  }

  /**
   * Deterministic NLP generator for local environments without active AI keys.
   */
  private generateDeterministicFallback(prompt: string): CopilotDraftResponse {
    const lower = prompt.toLowerCase();

    // Check if a repository is mentioned in "owner/repo" format
    const repoMatch = prompt.match(/\b([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)\b/);
    const repoOwner = repoMatch ? repoMatch[1] ?? '' : '';
    const repoName = repoMatch ? repoMatch[2] ?? '' : '';
    const repoFullName = repoMatch ? `${repoOwner}/${repoName}` : '';

    let name = 'PR Automation Workflow';
    let commentTemplate = 'Thank you @{{pr.author}} for opening pull request #{{pr.number}}: "{{pr.title}}"! Our team has been notified and will review your changes shortly.';
    let explanation = 'Automatically greets contributors and confirms PR receipt when a pull request is opened.';

    if (lower.includes('checklist') || lower.includes('testing') || lower.includes('review')) {
      name = 'PR Review & Testing Checklist Bot';
      commentTemplate = `Hi @{{pr.author}}! 👋 Thank you for submitting PR #{{pr.number}} ("{{pr.title}}").

Before we can merge, please ensure:
- [ ] Unit & integration tests pass
- [ ] Code follows project styling guidelines
- [ ] Documentation updated if relevant

Track PR: {{pr.url}}`;
      explanation = 'Posts a comprehensive testing and review checklist on newly opened Pull Requests.';
    } else if (lower.includes('welcome') || lower.includes('first') || lower.includes('first-time')) {
      name = 'First-Time Contributor Welcome Bot';
      commentTemplate = `Welcome @{{pr.author}} to {{repo.name}}! 🎉

Thank you for opening pull request #{{pr.number}}: "{{pr.title}}". We appreciate your contribution to our open source project! A maintainer will review your pull request soon.`;
      explanation = 'Welcomes contributors with an encouraging message when a pull request is opened.';
    } else if (lower.includes('thank') || lower.includes('thanks') || lower.includes('acknowledge')) {
      name = 'PR Acknowledgement & Thank You Bot';
      commentTemplate = 'Thank you @{{pr.author}} for opening PR #{{pr.number}} ("{{pr.title}}") on {{repo.name}}! We appreciate your contribution. 🚀';
      explanation = 'Expresses appreciation to contributors immediately when their pull request is opened.';
    }

    return {
      name,
      trigger: {
        app: 'github',
        event: 'github:pull_request_opened',
        config: {
          repoOwner,
          repoName,
          repoFullName,
        },
      },
      action: {
        app: 'github',
        event: 'github:comment_pull_request',
        config: {
          commentTemplate,
        },
      },
      explanation,
    };
  }
}

export const copilotService = new CopilotService();
