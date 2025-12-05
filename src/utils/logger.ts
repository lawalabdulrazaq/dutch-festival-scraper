/**
 * Simple colored logger for console output
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVELS: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

class Logger {
  private level: LogLevel;

  constructor(level: string = 'info') {
    this.level = LOG_LEVELS[level.toLowerCase()] || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toLocaleString('nl-NL');
    return `[${timestamp}] [${level}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log('✅', this.formatMessage('SUCCESS', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn('⚠️', this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error('❌', this.formatMessage('ERROR', message));
      if (error) {
        console.error(error);
      }
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL || 'info');