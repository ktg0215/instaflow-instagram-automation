// ログ出力の標準化

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const levelName = LogLevel[level];
      const contextStr = context ? `[${context}]` : '';
      const timestamp = entry.timestamp.toISOString();
      
      const logMessage = `${timestamp} ${levelName}${contextStr}: ${message}`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(logMessage, data);
          break;
        case LogLevel.INFO:
          console.info(logMessage, data);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, data);
          break;
        case LogLevel.ERROR:
          console.error(logMessage, data);
          break;
      }
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = Logger.getInstance();

// Convenience functions
export const log = {
  debug: (message: string, context?: string, data?: unknown) => 
    logger.debug(message, context, data),
  info: (message: string, context?: string, data?: unknown) => 
    logger.info(message, context, data),
  warn: (message: string, context?: string, data?: unknown) => 
    logger.warn(message, context, data),
  error: (message: string, context?: string, data?: unknown) => 
    logger.error(message, context, data),
};