import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimit';
import { httpLogger } from './utils/logger';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.NODE_ENV === 'production' 
      ? [/\.vercel\.app$/, /localhost/] 
      : '*',
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(httpLogger);
  app.use(rateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Discipline Tracker API is running',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
