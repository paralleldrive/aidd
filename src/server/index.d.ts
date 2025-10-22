/**
 * Server utilities for API route composition
 * Type definitions for aidd/server
 */

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
    config?: any;
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
  allowedOrigins?: string | string[];
  allowedHeaders?: string[];
  allowedMethods?: string[];
}

/**
 * Creates CORS middleware with configurable origins
 *
 * @example
 * const withCors = createWithCors({
 *   allowedOrigins: ['https://example.com', 'https://app.example.com']
 * });
 */
export function createWithCors(options?: CorsOptions): Middleware;

/**
 * CORS middleware with wildcard origin (less secure, for development)
 */
export const withCors: Middleware;

/**
 * Request ID middleware - generates unique UUID for request tracking
 */
export const withRequestId: Middleware;

// Config middleware
export type ConfigLoader = () => Promise<any>;

/**
 * Creates config injection middleware with custom loader
 *
 * @example
 * import configure from './config/config.js';
 * const withConfig = createWithConfig(configure);
 */
export function createWithConfig(configLoader: ConfigLoader): Middleware;

/**
 * Config middleware with no-op loader (for testing)
 */
export const withConfig: Middleware;

/**
 * Server error middleware - provides standardized error response helper
 */
export const withServerError: Middleware;

/**
 * Pre-composed standard middleware stack
 * Includes: withRequestId, withCors, withServerError, withConfig
 *
 * @example
 * import { createRoute, defaultMiddleware } from 'aidd/server';
 * export default createRoute(defaultMiddleware, myHandler);
 */
export const defaultMiddleware: Middleware;
