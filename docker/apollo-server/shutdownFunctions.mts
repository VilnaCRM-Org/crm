export async function cleanupResources() {
  try {
    console.log('Cleaning up resources...');

    await closeDatabaseConnections();

    console.log('Cleanup complete.');
  } catch (err) {
    console.error('Error cleaning up resources:', err);
  }
}
async function closeDatabaseConnections() {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

class CriticalError extends Error {
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

export async function handleServerFailure() {
  console.log('Attempting to clean up before exiting...');
  await cleanupResources();
  process.exit(1);
}
