import { Octokit } from '@octokit/rest';

export interface GitHubRepositoryItem {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description: string | null;
  htmlUrl: string;
  permissions?: {
    admin?: boolean;
    push?: boolean;
    pull?: boolean;
  };
}

export class GitHubService {
  /**
   * Instantiates an Octokit client with user credentials.
   */
  private getClient(accessToken: string): Octokit {
    return new Octokit({ auth: accessToken });
  }

  /**
   * Lists repositories where the authenticated user has admin or push access.
   */
  async getUserRepositories(accessToken: string): Promise<GitHubRepositoryItem[]> {
    const octokit = this.getClient(accessToken);

    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      affiliation: 'owner,collaborator,organization_member',
    });

    return repos
      .filter((repo) => repo.permissions?.admin || repo.permissions?.push)
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        description: repo.description,
        htmlUrl: repo.html_url,
        permissions: repo.permissions,
      }));
  }

  /**
   * Ensures a GitHub repository has an active webhook subscription pointing to our backend.
   * If already registered, returns the existing webhook config without duplicates.
   */
  async ensureWebhookSubscription(
    accessToken: string,
    owner: string,
    repo: string,
    webhookUrl: string,
    secret?: string
  ) {
    const octokit = this.getClient(accessToken);

    try {
      // 1. List existing repository webhooks
      const { data: hooks } = await octokit.rest.repos.listWebhooks({
        owner,
        repo,
        per_page: 100,
      });

      const existing = hooks.find((hook) => hook.config.url === webhookUrl);
      if (existing) {
        console.log(`[GitHubService] Webhook already configured for ${owner}/${repo} (ID: ${existing.id})`);
        return existing;
      }

      // 2. Create new webhook for pull_request events
      const { data: newHook } = await octokit.rest.repos.createWebhook({
        owner,
        repo,
        name: 'web',
        active: true,
        events: ['pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: secret || undefined,
          insecure_ssl: '0',
        },
      });

      console.log(`[GitHubService] Webhook created for ${owner}/${repo} (ID: ${newHook.id})`);
      return newHook;
    } catch (error) {
      console.error(`[GitHubService] Error ensuring webhook for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Posts a comment on a GitHub Pull Request (PRs are issues in GitHub API).
   */
  async postPullRequestComment(
    accessToken: string,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string
  ) {
    const octokit = this.getClient(accessToken);

    const { data: comment } = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body,
    });

    console.log(`[GitHubService] Comment posted on ${owner}/${repo}#${pullNumber} (ID: ${comment.id})`);
    return comment;
  }
}

export const githubService = new GitHubService();
