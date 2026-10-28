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
 */
authRouter.get('/github', (_req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';

  if (!clientId) {
    res.status(500).json({ error: 'GitHub OAuth Client ID is not configured in backend environment' });
    return;
  }

  const scope = encodeURIComponent('read:user repo admin:repo_hook');
  const redirectUri = encodeURIComponent(callbackUrl);
  const authUrl = `${GITHUB_AUTH_URL}?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`;

  res.redirect(authUrl);
});

/**
 * GET /api/auth/github/callback
 * Exchanges temporary code for access_token, syncs User in DB, and issues JWT.
 */
authRouter.get('/github/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
  const jwtSecret = process.env.JWT_SECRET || 'devflow_jwt_secret_production_ready_key_12345';

  if (!code) {
    res.status(400).json({ error: 'Missing GitHub authorization code in query parameter' });
    return;
  }

  // 1. Exchange code for access_token
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
    res.status(401).json({
      error: 'Failed to obtain access token from GitHub',
      details: tokenData.error_description || tokenData.error,
    });
    return;
  }

  const accessToken = tokenData.access_token;

  // 2. Fetch authenticated GitHub user profile
  const userResponse = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'DevFlow-Zaps',
    },
  });

  if (!userResponse.ok) {
    res.status(userResponse.status).json({ error: 'Failed to fetch GitHub user profile' });
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

  // 3. Upsert user in MongoDB
  let user = await User.findOne({ githubId });
  if (!user) {
    user = await User.create({
      githubId,
      username,
      avatarUrl,
      accessToken,
    });
  } else {
    user.username = username;
    user.avatarUrl = avatarUrl;
    user.accessToken = accessToken;
    await user.save();
  }

  // 4. Issue JWT
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      githubId: user.githubId,
      username: user.username,
    },
    jwtSecret,
    { expiresIn: '7d' }
  );

  // 5. Set HTTP-only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const wantsJson = req.query.format === 'json' || (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html'));

  if (wantsJson) {
    res.json({
      token,
      user: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
    return;
  }

  // Standard browser redirect to Angular Dashboard with token param
  res.redirect(`${clientUrl}/dashboard?token=${encodeURIComponent(token)}`);
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
