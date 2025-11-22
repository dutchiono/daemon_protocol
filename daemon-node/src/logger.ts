/**
 * @title Logger
 * @notice Production logging with Winston
 */

import winston from 'winston';

export function createLogger(
  level: string = process.env.LOG_LEVEL || 'info',
  format: string = process.env.LOG_FORMAT || 'text',
  enableFileLogging: boolean = process.env.ENABLE_FILE_LOGGING === 'true'
): winston.Logger {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: format === 'json'
        ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
        : winston.format.combine(
          winston.format.colorize(),
          winston.format.errors({ stack: true }),
          winston.format.simple()
        ),
    }),
  ];

  if (enableFileLogging) {
    transports.push(
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    );
  }

  return winston.createLogger({
    level,
    defaultMeta: { service: 'daemon-node' },
    transports,
  });
}

// Export default logger instance
export const logger = createLogger();

