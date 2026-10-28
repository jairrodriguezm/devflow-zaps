import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

/**
 * GET /api/auth/github
 * Initiates GitHub OAuth flow with scopes read:user, repo, admin:repo_hook.
 * Immediately redirects the browser to GitHub's authorization page.
 */
authRouter.get('/github', (_req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';

  if (!clientId || clientId === 'your_github_client_id') {
    const errorMsg = '[Auth Error] GITHUB_CLIENT_ID is missing or not configured in backend environment variables.';
    console.error(errorMsg);
    res.status(500).send(`Authentication configuration error: ${errorMsg}`);
    return;
  }

  const scope = 'read:user repo admin:repo_hook';
  const githubAuthUrl = `${GITHUB_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scope)}`;

  console.log(`[Auth] Redirecting browser to GitHub OAuth: ${githubAuthUrl}`);
  res.redirect(githubAuthUrl);
});

/**
 * GET /api/auth/github/callback
 * Exchanges temporary code for access_token, syncs User in DB, issues JWT, and redirects to dashboard.
 */
authRouter.get('/github/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
  const jwtSecret = process.env.JWT_SECRET || 'devflow_jwt_secret_production_ready_key_12345';

  if (!code) {
    console.error('[Auth Callback Error] Missing "code" query parameter in request from GitHub');
    res.status(400).send('Authentication failed: Missing GitHub authorization code.');
    return;
  }

  try {
    // 1. Exchange temporary authorization code for access_token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      console.error('[Auth Callback Error] Failed to obtain access token from GitHub:', tokenData);
      res.status(401).send(`GitHub OAuth Error: ${tokenData.error_description || tokenData.error || 'Failed to exchange code'}`);
      return;
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated user profile from GitHub API
    const userResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'DevFlow-Zaps',
      },
    });

    if (!userResponse.ok) {
      console.error(`[Auth Callback Error] Failed to fetch GitHub profile: status ${userResponse.status}`);
      res.status(userResponse.status).send('Failed to fetch user profile from GitHub API.');
      return;
    }

    const profile = (await userResponse.json()) as {
      id: number;
      login: string;
      avatar_url?: string;
    };

    const githubId = profile.id.toString();
    const username = profile.login;
    const avatarUrl = profile.avatar_url || '';

    // 3. Upsert user profile & secure access token in MongoDB
    let user = await User.findOne({ githubId });
    if (!user) {
      user = await User.create({
        githubId,
        username,
        avatarUrl,
        accessToken,
      });
      console.log(`[Auth Callback] Created new user @${username} (GitHub ID: ${githubId})`);
    } else {
      user.username = username;
      user.avatarUrl = avatarUrl;
      user.accessToken = accessToken;
      await user.save();
      console.log(`[Auth Callback] Updated existing user @${username} (GitHub ID: ${githubId})`);
    }

    // 4. Issue signed JWT session token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        githubId: user.githubId,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 5. Set secure HTTP-only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 6. Redirect back to frontend dashboard (including token query param for cross-origin reliability)
    const targetRedirectUrl = `${clientUrl}/?token=${encodeURIComponent(token)}`;
    console.log(`[Auth Callback] Redirecting authenticated user to ${targetRedirectUrl}`);
    res.redirect(targetRedirectUrl);
  } catch (error) {
    console.error('[Auth Callback Error] Unexpected exception during OAuth processing:', error);
    res.status(500).send(`Internal authentication error: ${(error as Error).message}`);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile.
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user._id,
    githubId: user.githubId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  });
});

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  res.json({ message: 'Logged out successfully' });
});
