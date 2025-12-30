import type { Server } from 'http';
import type { AddressInfo } from 'net';

import app from '../../src/app.js';
import { createLogger } from '../../src/config/logger.js';

let server: Server | null = null;
let apiUrl: string;

const logger = createLogger('e2e Tests');

/**
 * Start the test server on a random port
 * @returns The API URL (e.g., http://localhost:3000)
 */
export async function startTestServer(): Promise<string> {
  if (server) {
    return apiUrl;
  }

  return new Promise((resolve, reject) => {
    try {
      server = app.listen(0, () => {
        if (!server) {
          reject(new Error('Server failed to start'));
          return;
        }

        const address = server.address() as AddressInfo;
        apiUrl = `http://localhost:${address.port}`;
        logger.info(`✓ Test server started at ${apiUrl}`);
        resolve(apiUrl);
      });

      server.on('error', (error: Error) => {
        logger.error('✗ Failed to start test server:', error);
        reject(error);
      });
    } catch (error) {
      logger.error('✗ Error importing app:', error);
      reject(error);
    }
  });
}

/**
 * Stop the test server
 */
export async function stopTestServer(): Promise<void> {
  if (!server) {
    return;
  }

  return new Promise((resolve) => {
    server!.close(() => {
      logger.info('✓ Test server stopped');
      server = null;
      apiUrl = '';
      resolve();
    });
  });
}

/**
 * Get the current API URL (must call startTestServer first)
 */
export function getApiUrl(): string {
  if (!apiUrl) {
    throw new Error('Test server not started. Call startTestServer() first.');
  }
  return apiUrl;
}

/**
 * Helper to make API requests
 */
export async function request(path: string, options?: RequestInit): Promise<Response> {
  const url = `${getApiUrl()}${path}`;
  const response = await fetch(url, options);
  return response;
}

/**
 * Helper to make API requests and parse JSON
 */
export async function requestJson<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const response = await request(path, options);
  return response.json() as Promise<T>;
}
