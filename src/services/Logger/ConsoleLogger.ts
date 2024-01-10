import { Logger } from '@/services/Logger';

export default class ConsoleLogger implements Logger {
  public info(message: string): void {
    console.info(this.formatMessage('INFO', message));
  }

  public error(message: string): void {
    console.error(this.formatMessage('ERROR', message));
  }

  public debug(message: string): void {
    console.debug(this.formatMessage('DEBUG', message));
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}]: ${message}`;
  }
}
