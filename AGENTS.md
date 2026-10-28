# AGENTS.md - Architecture & Development Guidelines

## Project Overview
We are building **DevFlow Zaps**, a lightweight developer workflow automation app inspired by Zapier's Zaps (Trigger -> Action) on the **MEAN Stack (MongoDB, Express 5, Angular 21+, Node.js)** using **TypeScript** throughout.

## Core Functional Requirements
1. **GitHub Authentication (OAuth):**
   - Users sign in via GitHub OAuth requesting `read:user`, `repo`, and `admin:repo_hook` scopes.
   - Store user profile and encrypted/secured `githubAccessToken` in MongoDB (`User` model).
   - Issue an HTTP-only JWT cookie or Bearer token for session management.
2. **Zap Management (CRUD & Ownership):**
   - Zaps belong exclusively to the signed-in user.
   - A Zap contains: `name`, `isActive` (boolean), `trigger` (`appId`, `event`, `config` like `repoFullName`), and `action` (`appId`, `event`, `config` like `commentTemplate`).
   - App Picker UI must showcase multiple developer tools: **GitHub** (Fully Functional), **Slack**, **Linear**, **Jira**, and **Discord** (UI mocked with a badge "Coming Soon / Simulated" to demonstrate extensibility).
3. **Field Mapping (Dynamic Variables):**
   - The Action configuration supports dynamic template tokens mapped from the GitHub PR payload: `{{pr.title}}`, `{{pr.author}}`, `{{pr.number}}`, `{{pr.url}}`, `{{repo.name}}`.
4. **End-to-End Execution (GitHub PR Opened -> Comment on PR):**
   - When a Zap is created/activated for a specific GitHub repository, automatically register a GitHub Webhook (`pull_request` event) on that repo via Octokit if one doesn't exist, or support a global webhook endpoint `/api/webhooks/github`.
   - When `/api/webhooks/github` receives `action === 'opened'` on a `pull_request` event:
     1. Find all active Zaps matching `trigger.config.repoFullName === payload.repository.full_name`.
     2. Interpolate the `commentTemplate` variables (`{{pr.author}}`, etc.) with real values from the webhook payload.
     3. Use the Zap owner's `githubAccessToken` via Octokit (`octokit.rest.issues.createComment`) to post the comment on the Pull Request.
     4. Record an `ExecutionLog` in MongoDB for observability in the UI.
5. **AI Copilot (Bonus Feature):**
   - Endpoint `POST /api/zaps/copilot` accepts a natural language prompt (e.g., *"When a pull request is opened in owner/repo, comment thanks @author for the PR!"*).
   - Uses OpenAI SDK (Structured Outputs / JSON mode) with Gemini as fallback to return a pre-filled Zap draft (`name`, `trigger`, `action` with mapped tokens) that populates the Angular Zap Builder for user review before turning it on.

## Tech Stack & Coding Standards
- **Backend (Express 5 + TypeScript):**
  - Leverage Express 5 native async error handling (no redundant `try/catch` wrappers in controllers; use a clean global error middleware).
  - Validate request bodies with `zod`.
  - Keep controllers thin; place business logic in `services/` (`github.service.ts`, `zap-engine.service.ts`, `copilot.service.ts`).
- **Frontend (Angular 21+):**
  - Use **Standalone Components** exclusively (`standalone: true`).
  - Use **Angular Signals** (`signal`, `computed`) for state management instead of complex RxJS chains.
  - Use modern Angular template control flow (`@if`, `@for`, `@switch`).
  - Design a modern, clean dark/light SaaS UI inspired by Linear and Zapier using Tailwind CSS:
    - Visual vertical pipeline for the Zap Builder: `[ 1. Trigger Card ] ---> [ 2. Action Card ]`.
    - Interactive token pills (clicking `{{pr.author}}` inserts it into the comment textarea).
    - Top AI Copilot bar with a sparkle icon to draft a Zap from natural language in one click.

## Git & Workflow Rules for the Agent
- Keep functions small, self-explanatory, and easy to walk through during a live code review.
- Avoid over-engineering (no Redis queues, no microservices, no complex state libraries).
- We work in feature branches and commit logically per milestone (`feat(auth): ...`, `feat(engine): ...`, `feat(ui): ...`, `feat(copilot): ...`).