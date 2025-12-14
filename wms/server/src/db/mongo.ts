import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

export const connectMongo = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(env.mongodbUri);
    logger.info('MongoDB connected');
    return connection;
  } catch (error) {
    logger.error('MongoDB connection error', { error });
    throw error;
  }
};

export const disconnectMongo = async (): Promise<void> => {
  await mongoose.disconnect();
};
