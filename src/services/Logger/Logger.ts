export default interface Logger {
  info(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}
