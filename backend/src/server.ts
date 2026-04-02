import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    const port = env.PORT;
    
    app.listen(port, () => {
      logger.info(`Server started on port ${port}`, {
        environment: env.NODE_ENV,
        port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
