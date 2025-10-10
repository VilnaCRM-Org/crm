export async function cleanupResources(rethrowErrors: boolean = false): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log('Cleaning up resources...');

    await closeDatabaseConnections();

    // eslint-disable-next-line no-console
    console.log('Cleanup complete.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error cleaning up resources:', err);
    if (rethrowErrors) {
      throw err;
    }
  }
}

async function closeDatabaseConnections(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

export class CriticalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CriticalError';
    Object.setPrototypeOf(this, CriticalError.prototype);
  }
}

export function shouldShutdown(error: unknown): boolean {
  if (error instanceof CriticalError) return true;

  if (error instanceof Error) {
    const criticalPatterns = [
      /ECONNREFUSED/,
      /EADDRINUSE/,
      /Cannot connect to database/,
      /Out of memory/,
    ];
    return criticalPatterns.some((pattern) => pattern.test(error.message));
  }

  return false;
}

export async function handleServerFailure(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Attempting to clean up before exiting...');
  try {
    await cleanupResources(true);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Cleanup failed during server failure:', err);
  } finally {
    process.exit(1);
  }
}
