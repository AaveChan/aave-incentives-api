import 'dotenv/config';

import winston from 'winston';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    return log;
  }),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'aave-incentives-api' },
  transports: [
    // only console logs
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // // file logs
    // // error logs
    // new winston.transports.File({
    //   filename: 'logs/error.log',
    //   level: 'error',
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 5,
    // }),
    // // all logs
    // new winston.transports.File({
    //   filename: 'logs/all.log',
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 5,
    // }),
  ],
});

export const createLogger = (context: string) => {
  return logger.child({ context });
};

export default logger;
