export async function cleanupResources(rethrowErrors: boolean = false): Promise<void> {
  try {
    console.log('Cleaning up resources...');

    await closeDatabaseConnections();

    console.log('Cleanup complete.');
  } catch (err) {
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
  console.log('Attempting to clean up before exiting...');
  try {
    await cleanupResources(true);
  } catch (err) {
    console.error('Cleanup failed during server failure:', err);
  } finally {
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}
