/**
 * Production Logger
 *
 * 生產環境使用 Sentry/LogRocket，開發環境使用 console
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isTest =
    import.meta.env.MODE === 'test' ||
    (typeof process !== 'undefined' && process.env?.VITEST === 'true');

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.isDev && !this.isTest) {
      console.error(this.formatMessage('error', message, context));
    }
  }
}

export const logger = new Logger();
