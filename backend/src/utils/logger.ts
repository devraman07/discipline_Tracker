import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

// Development format: human-readable
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Production format: structured JSON for log aggregation services
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'discipline-tracker-api',
    environment: env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'development'
        ? combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat)
        : prodFormat,
    }),
  ],
});

// Note: File transports don't work well on serverless platforms (Vercel, Railway)
// Use external log aggregation services instead
if (env.NODE_ENV === 'production' && process.env.LOG_TO_FILE === 'true') {
  // Only enable file logging if explicitly requested (not recommended for serverless)
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: prodFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: prodFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
}

export { logger };

// HTTP request logger middleware
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// Production logging recommendations
export const logDeploymentInfo = () => {
  if (env.NODE_ENV === 'production') {
    logger.info('Server starting', {
      port: env.PORT,
      environment: env.NODE_ENV,
      databaseUrl: env.DATABASE_URL ? 'configured' : 'missing',
    });
    
    // Warn if using default logging (no external service)
    if (!process.env.LOGTAIL_SOURCE_TOKEN && !process.env.DATADOG_API_KEY) {
      logger.warn('Using default console logging. Consider integrating with Logtail, Datadog, or CloudWatch for persistent logs.');
    }
  }
};
