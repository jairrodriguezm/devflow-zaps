import mongoose from 'mongoose';

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

  mongoose.connection.on('connected', () => {
    console.log(`[Database] MongoDB connected: ${mongoUri}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected');
  });

  return mongoose.connect(mongoUri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('[Database] MongoDB connection closed');
}
