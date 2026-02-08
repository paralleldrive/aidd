/**
 * Utility functions for functional composition
 */

/**
 * Composes async functions from left to right, passing the result of each function
 * to the next. Each function receives the awaited result of the previous function.
 *
 * @param fns - Functions to compose. Each function can be sync or async.
 * @returns A function that takes an initial value and applies all functions in sequence
 *
 * @example
 * const add1 = async (x) => x + 1;
 * const multiply2 = async (x) => x * 2;
 * const pipeline = asyncPipe(add1, multiply2);
 * await pipeline(5); // => 12
 */
export function asyncPipe<T>(
  ...fns: Array<(x: T) => T | Promise<T>>
): (x: T) => Promise<T>;
export function asyncPipe<T, U>(
  ...fns: Array<(x: T | U) => U | Promise<U>>
): (x: T) => Promise<U>;
export function asyncPipe(
  ...fns: Array<(x: any) => any>
): (x: any) => Promise<any>;

/**
 * Composes functions from left to right, passing the result of each function
 * to the next. Similar to asyncPipe but for synchronous functions.
 *
 * @param fns - Functions to compose
 * @returns A function that takes an initial value and applies all functions in sequence
 *
 * @example
 * const add1 = (x) => x + 1;
 * const multiply2 = (x) => x * 2;
 * const pipeline = pipe(add1, multiply2);
 * pipeline(5); // => 12
 */
export function pipe<T>(...fns: Array<(x: T) => T>): (x: T) => T;
export function pipe<T, U>(...fns: Array<(x: T | U) => U>): (x: T) => U;
export function pipe(...fns: Array<(x: any) => any>): (x: any) => any;

/**
 * Composes functions from right to left, passing the result of each function
 * to the next. This is the traditional mathematical composition order.
 *
 * @param fns - Functions to compose
 * @returns A function that takes an initial value and applies all functions in reverse sequence
 *
 * @example
 * const add1 = (x) => x + 1;
 * const multiply2 = (x) => x * 2;
 * const composed = compose(multiply2, add1);
 * composed(5); // => 12 (add1 first, then multiply2)
 */
export function compose<T>(...fns: Array<(x: T) => T>): (x: T) => T;
export function compose<T, U>(...fns: Array<(x: T | U) => U>): (x: T) => U;
export function compose(...fns: Array<(x: any) => any>): (x: any) => any;
