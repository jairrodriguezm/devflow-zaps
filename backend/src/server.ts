import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { authRouter } from './routes/auth.routes.js';
import { zapsRouter } from './routes/zaps.routes.js';
import { webhooksRouter } from './routes/webhooks.routes.js';

dotenv.config();

export const app = express();
const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';

// Global Middlewares
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Healthcheck Route
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/zaps', zapsRouter);
app.use('/api/webhooks', webhooksRouter);

// Express 5 Native Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Global Error]', err);
  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(port, () => {
      console.log(`[DevFlow Zaps] Backend server running on http://localhost:${port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
}

// Start the server if executed directly
if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}
