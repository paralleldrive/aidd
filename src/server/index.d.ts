/**
 * Server utilities for API route composition
 * Type definitions for aidd/server
 */

// Config object with get() method
export interface ConfigObject {
  /**
   * Get configuration value by key
   * @throws {ErrorWithCause} When key is not found in configuration
   */
  get(key: string): any;
}

// Request/Response types compatible with Node.js HTTP and Express
export interface Request {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[]>;
  body?: any;
  query?: Record<string, any>;
  params?: Record<string, string>;
  [key: string]: any;
}

export interface Response {
  status(code: number): Response;
  json(data: any): void;
  send(data: any): void;
  setHeader(name: string, value: string | number | string[]): void;
  getHeader(name: string): string | number | string[] | undefined;
  locals?: {
    requestId?: string;
    config?: ConfigObject;
    serverError?: (options?: ErrorOptions) => ErrorResponse;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ServerContext {
  request: Request;
  response: Response;
}

export interface ErrorOptions {
  message?: string;
  status?: number;
  requestId?: string;
}

export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    requestId?: string;
  };
}

// Middleware function type
export type Middleware = (context: ServerContext) => Promise<ServerContext>;

// Route handler type
export type RouteHandler = (request: Request, response: Response) => Promise<void>;

/**
 * Creates a route handler that composes middleware using asyncPipe
 * Catches all errors and returns standardized 500 response
 *
 * @example
 * const myRoute = createRoute(
 *   withRequestId,
 *   withCors,
 *   async ({ request, response }) => {
 *     response.status(200).json({ message: 'Success' });
 *   }
 * );
 */
export function createRoute(...middleware: Middleware[]): RouteHandler;

/**
 * Converts traditional Express middleware to functional middleware
 *
 * @example
 * const functionalMiddleware = convertMiddleware(expressMiddleware);
 */
export function convertMiddleware(
  middleware: (req: Request, res: Response, next: () => void) => void | Promise<void>
): Middleware;

/**
 * Creates mock server object for testing middleware
 *
 * @example
 * const server = createServer({
 *   request: { method: 'GET', url: '/api/users' },
 *   response: {}
 * });
 */
export function createServer(options?: {
  request?: Partial<Request>;
  response?: Partial<Response>;
}): ServerContext;

// CORS middleware
export interface CorsOptions {
  allowedOrigins: string | string[];  // Required for security
  allowedHeaders?: string[];
  allowedMethods?: string[];
}

/**
 * Creates CORS middleware with configurable origins
 *
 * Security: allowedOrigins is REQUIRED to prevent accidental exposure.
 * For same-origin only apps, omit CORS middleware entirely.
 *
 * @example
 * // Recommended: Explicit origin whitelist
 * const withCors = createWithCors({
 *   allowedOrigins: ['https://example.com', 'https://app.example.com']
 * });
 *
 * @example
 * // Public API only: Explicit wildcard
 * const withCors = createWithCors({
 *   allowedOrigins: '*'
 * });
 */
export function createWithCors(options: CorsOptions): Middleware;

/**
 * Request ID middleware - generates unique CUID2 for request tracking
 */
export const withRequestId: Middleware;

// Config middleware
export type ConfigLoader = () => Promise<Record<string, any>>;

/**
 * Creates a config object with get() method that throws on missing keys
 *
 * @example
 * const config = createConfigObject({ API_KEY: 'abc123' });
 * config.get('API_KEY'); // => 'abc123'
 * config.get('MISSING'); // => throws ErrorWithCause
 */
export function createConfigObject(configData: Record<string, any>): ConfigObject;

/**
 * Loads configuration from environment variables
 *
 * @example
 * const config = await loadConfigFromEnv(['DATABASE_URL', 'API_KEY', 'PORT']);
 * // => { DATABASE_URL: 'postgres://...', API_KEY: 'abc123', PORT: '3000' }
 */
export function loadConfigFromEnv(keys?: string[]): Promise<Record<string, string | undefined>>;

/**
 * Creates config injection middleware with custom loader
 * Config is wrapped in ConfigObject and attached to response.locals.config
 *
 * @example
 * // Using loadConfigFromEnv helper
 * import { createWithConfig, loadConfigFromEnv } from 'aidd/server';
 * const withConfig = createWithConfig(() =>
 *   loadConfigFromEnv(['DATABASE_URL', 'API_KEY'])
 * );
 *
 * // In your handler
 * const apiKey = response.locals.config.get('API_KEY'); // throws if missing
 *
 * @example
 * // Using custom loader
 * const withConfig = createWithConfig(async () => {
 *   const config = await fetchFromConfigService();
 *   return config;
 * });
 */
export function createWithConfig(configLoader: ConfigLoader): Middleware;

/**
 * Server error middleware - provides standardized error response helper
 */
export const withServerError: Middleware;
