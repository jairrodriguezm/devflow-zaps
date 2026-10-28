# DevFlow: Developer Workflow Automation (Zapier-inspired)

[![MEAN Stack](https://img.shields.io/badge/Stack-MEAN%20(Mongo%20%7C%20Express%205%20%7C%20Angular%2021%2B%20%7C%20Node%2024)-6366f1.svg)](#architecture--design-decisions)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20Strict-3178c6.svg)](#architecture--design-decisions)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](#architecture--design-decisions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**DevFlow Zaps** is a lightweight, event-driven developer workflow automation platform inspired by Zapier. Built entirely in **TypeScript** on the **MEAN stack** (MongoDB 8, Express 5, Angular 21+, Node.js v24+ LTS), DevFlow allows engineering teams to connect GitHub repositories, intercept Pull Request webhook events, and automatically execute programmable actions—such as greeting contributors, posting review checklists, or acknowledging pull requests—using a sleek visual pipeline builder and an integrated **Natural-Language AI Copilot**.

---

## Architecture & Design Decisions

```
                           +---------------------------------------+
                           |           Angular 21+ Client          |
                           |   (Signals, Standalone, Tailwind CSS) |
                           +-------------------+-------------------+
                                               |
                                     HTTP REST / Cookies
                                               |
                                               v
+-----------------------+          +---------------------------------------+
|  GitHub Webhook Event | -------->|               Express 5               |
|  (pull_request.opened)|          |        (Native Async Pipeline)        |
+-----------------------+          +---+-------------------------------+---+
                                       |                               |
                       +---------------+---------------+               |
                       |                               |               |
                       v                               v               v
            +--------------------+           +-------------------+  +-------------------+
            |  Octokit Service   |           | Zap Engine Service|  |  Copilot Service  |
            | (OAuth & Comments) |           |  (Event Matching) |  | (OpenAI / Gemini) |
            +--------------------+           +---------+---------+  +-------------------+
                                                       |
                                                       v
                                            +---------------------+
                                            |     MongoDB 8.0     |
                                            | (Zaps, Users, Logs) |
                                            +---------------------+
```

### 1. Technology Stack
- **Runtime & Backend Framework:** **Node.js (v24+ LTS)** with **Express 5**. Express 5 provides native asynchronous rejection handling, eliminating boilerplate try/catch wrappers and routing unhandled promise errors to a centralized global error handler.
- **Database & ODM:** **MongoDB 8.0** with **Mongoose**. Enforces strict schemas and compound indexing (e.g. `{'trigger.config.repoFullName': 1, isActive: 1}`) for low-latency webhook event resolution.
- **Frontend Architecture:** **Angular 21+** configured with **Standalone Components**, modern template control flow (`@if`, `@for`), and **Angular Signals** (`signal`, `computed`) for reactive, granular state management without complex RxJS state overhead.
- **Styling & UI Components:** **Tailwind CSS** and **lucide-angular** icons, delivering a polished dark-mode developer experience inspired by Linear and Zapier.
- **End-to-End Type Safety:** A shared contracts module (`shared/zap.types.ts`) ensures strict type parity between database models, backend controllers, and frontend signals.

### 2. Event-Driven Execution Engine & Webhooks
- **Idempotency Guarantee:** Incoming GitHub webhooks are tracked by their unique `x-github-delivery` header. The execution engine verifies if a delivery ID has already been recorded in `ExecutionLog`, preventing duplicate comment submissions during GitHub retries.
- **Dynamic Variable Interpolation:** An in-memory, pure interpolation engine replaces tokens (`{{pr.author}}`, `{{pr.title}}`, `{{pr.number}}`, `{{pr.url}}`, `{{repo.name}}`) into customized markdown comment templates.
- **Scoped OAuth:** Users sign in through GitHub OAuth requesting minimal required privileges: `read:user`, `repo`, and `admin:repo_hook` (for automated repository webhook registration).

### 3. Extensible App Strategy Pattern
- **GitHub:** Fully functional trigger (`github:pull_request_opened`) and action (`github:comment_pull_request`).
- **Developer Tool Integrations:** UI-ready adapters for **Slack**, **Linear**, **Jira**, and **Discord** marked with a `"Simulated"` badge. These execute against simulated logs in `ExecutionLog` to showcase how additional services can be plugged into the engine.

### 4. Natural-Language AI Copilot (Bonus)
- Integrated via `POST /api/zaps/copilot`.
- Converts natural English prompts (e.g. *"When a pull request is opened, thank the author and ask for a checklist"*) into pre-filled Zap drafts using **OpenAI Structured Outputs (JSON Schema mode)**.
- Features a resilient multi-tier fallback: falls back to **Google Gemini API** (`gemini-1.5-flash`), and includes an offline heuristic parser to support disconnected testing without breaking the UI.

---

## Prerequisites & Environment Setup

Ensure you have the following installed locally:
- [Node.js](https://nodejs.org/) (v22.x or v24.x LTS recommended) & `npm` (v10+)
- [Docker & Docker Compose](https://www.docker.com/) (for MongoDB 8.0 & Mongo Express)
- [ngrok](https://ngrok.com/) or [Smee.io](https://smee.io/) (to tunnel GitHub webhooks to your local machine)

### Environment Configuration

The backend reads configuration from `backend/.env`. Copy the template to start:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | Application environment mode | `development` |
| `CLIENT_URL` | URL of the frontend Angular client | `http://localhost:4200` |
| `MONGODB_URI` | MongoDB connection connection string | `mongodb://localhost:27017/devflow` |
| `GITHUB_CLIENT_ID` | Client ID from your GitHub OAuth App | `your_github_client_id` |
| `GITHUB_CLIENT_SECRET`| Client Secret from your GitHub OAuth App | `your_github_client_secret` |
| `GITHUB_CALLBACK_URL` | OAuth redirect callback URL | `http://localhost:3000/api/auth/github/callback` |
| `WEBHOOK_BASE_URL` | Public endpoint where GitHub sends webhook deliveries | `https://your-domain.ngrok-free.app/api/webhooks/github` |
| `GITHUB_WEBHOOK_SECRET`| Secret used to sign & verify webhook payloads | `super_secret_webhook_signature` |
| `JWT_SECRET` | Secret key used to sign HTTP session JWTs | `devflow_jwt_secret_key_12345` |
| `OPENAI_API_KEY` | *(Optional)* OpenAI API key for AI Copilot | `sk-...` |
| `OPENAI_MODEL` | *(Optional)* OpenAI Model for Copilot | `gpt-4o-mini` |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key as fallback | `your_gemini_api_key` |

### Setting Up the GitHub OAuth Application

1. Go to your GitHub account **Settings** > **Developer settings** > **OAuth Apps** > **New OAuth App**.
2. Fill in the application details:
   - **Application name:** `DevFlow Zaps`
   - **Homepage URL:** `http://localhost:4200`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/github/callback`
3. Click **Register application**.
4. Generate a new **Client Secret**.
5. Copy the **Client ID** and **Client Secret** into your `backend/.env` file.

---

## Quickstart Guide (Running Locally)

### 1. Launch MongoDB Infrastructure

Start the isolated MongoDB 8 container and Mongo Express management UI:

```bash
docker compose up -d
# or using root npm script:
npm run docker:up
```

- **MongoDB Database:** `mongodb://localhost:27017/devflow`
- **Mongo Express Web UI:** [http://localhost:8081](http://localhost:8081)

### 2. Install Dependencies

Install root, backend, and frontend packages:

```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Run Development Servers

Run both the Express backend and the Angular client concurrently with live reload:

```bash
npm run dev
```

The services will be available at:
- **Angular Frontend:** [http://localhost:4200](http://localhost:4200)
- **Express Backend API:** [http://localhost:3000](http://localhost:3000)
- **API Healthcheck:** [http://localhost:3000/health](http://localhost:3000/health)

### 4. Forwarding GitHub Webhooks Locally

GitHub requires a public internet URL to deliver webhooks. You can use either **Smee.io** or **ngrok**:

#### Option A: Using Smee.io (Recommended for development)
1. Go to [https://smee.io](https://smee.io) and click **"Start a new channel"**.
2. Copy your channel URL (e.g. `https://smee.io/abc123xyz`).
3. Set `WEBHOOK_BASE_URL=https://smee.io/abc123xyz` in `backend/.env`.
4. Run the Smee client in a separate terminal:
   ```bash
   npx smee-client -u https://smee.io/abc123xyz -t http://localhost:3000/api/webhooks/github
   ```

#### Option B: Using ngrok
1. Expose your backend server:
   ```bash
   ngrok http 3000
   ```
2. Copy your forwarding HTTPS address (e.g. `https://xyz.ngrok-free.app`).
3. Update `WEBHOOK_BASE_URL` in `backend/.env`:
   ```env
   WEBHOOK_BASE_URL=https://xyz.ngrok-free.app/api/webhooks/github
   ```
4. Restart the backend server.

---

## Testing the End-to-End Workflow (Demo Walkthrough)

Follow these steps to demonstrate the full automation flow:

```
[ Sign In ] ➔ [ Create Zap / Copilot ] ➔ [ Open PR on GitHub ] ➔ [ Bot Comments on PR ] ➔ [ Inspect Logs ]
```

1. **Sign In:**
   - Navigate to [http://localhost:4200/login](http://localhost:4200/login).
   - Click **"Sign in with GitHub"** and authorize the DevFlow OAuth application.
2. **Draft a Zap via AI Copilot or Visual Builder:**
   - In the dashboard, click **"+ Create Zap"** to open the builder.
   - Use the **AI Copilot** command bar by entering a prompt such as:
     > *"When a pull request is opened, thank the author and post a review checklist"*
   - Click **"Generate Zap Draft"**. Notice that the workflow name, triggers, and comment template are immediately populated for review.
3. **Select Repository & Custom Tokens:**
   - Choose a target GitHub repository from the populated repository dropdown (e.g. `your-username/your-repo`).
   - Customize the message template using interactive pill buttons (`{{pr.author}}`, `{{pr.number}}`, `{{pr.title}}`, `{{repo.name}}`).
   - Click **"Save & Activate"**. DevFlow will register a webhook on your GitHub repository.
4. **Trigger the Automation:**
   - Go to your selected repository on GitHub.
   - Create a branch, commit a change, and open a new Pull Request.
5. **Verify Automation & Inspect Logs:**
   - Within seconds, inspect the Pull Request on GitHub to verify that **DevFlow Bot** (via your user token) posted the rendered comment.
   - Return to the DevFlow dashboard, locate your Zap card, and click the **"Execution Logs"** (Clock) icon to view the slide-out history drawer containing the execution timestamp, delivery ID, and direct PR link.

---

## Honor System Time Tracking & AI Utilization

### Time Tracking (Under 4 Hours)
- **Start Time:** 08:00 AM (EST)
- **End Time:** 11:45 AM (EST)
- **Total Elapsed Time:** 3 hours, 45 minutes

### AI Utilization Summary
In accordance with the transparency guidelines of the technical challenge:
- **AI Copilot Feature (Bonus):** Implemented an AI agent endpoint leveraging **OpenAI Structured Outputs** (`gpt-4o-mini`) and **Google Gemini API** (`gemini-1.5-flash`) via structured JSON Schema definitions to parse natural-language developer instructions into validated Zap definitions.
- **Development Tooling:** Accelerated development using **Antigravity IDE** for rapid architecture design, TypeScript type checking verification, Docker orchestration scaffolding, and boilerplate generation.
- **Verification:** All core business logic—including webhook signature validation, idempotency guards, Octokit API integration, Mongoose schemas, and Angular Signals state—was reviewed, tested, and validated with strict type safety.

---

## Repository Scripts Reference

```bash
# Development
npm run dev              # Run backend and frontend concurrently
npm run docker:up        # Start MongoDB 8 and Mongo Express containers
npm run docker:down      # Stop Docker containers

# Production Compilation
npm run build            # Compile backend (tsc) and frontend (ng build)
npm --prefix backend run build
npm --prefix frontend run build

# Quality & Type Safety
npx tsc --noEmit --prefix backend # Verify backend TypeScript types
```
