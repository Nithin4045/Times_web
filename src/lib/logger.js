import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Import chalk for coloring if desired (optional)
// import chalk from 'chalk';

const logFormat = printf(({ level, message, timestamp, stack }) => {
  // Apply red color if the level is 'error'
  const logMessage = `${timestamp} ${level}: ${stack || message}`;
  if (level === 'error') {
    return `\x1b[31m${logMessage}\x1b[0m`; // ANSI code for red
    // Alternatively, if using chalk: return chalk.red(logMessage);
  }
  return logMessage;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
   colorize({ all: true }), // Apply color to everything
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }) // Apply color to everything
      )
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

export default logger;
