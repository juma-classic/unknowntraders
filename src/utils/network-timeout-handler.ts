/**
 * Network Timeout Handler
 * Provides timeout functionality for network operations
 */

class NetworkTimeoutHandler {
    /**
     * Wraps a promise with a timeout
     * @param promise - The promise to wrap
     * @param timeoutMs - Timeout in milliseconds
     * @returns Promise that rejects if timeout is reached
     */
    async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
            ),
        ]);
    }
}

export const networkTimeoutHandler = new NetworkTimeoutHandler();
