/**
 * Utility functions for functional composition
 * Type definitions for aidd/utils
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
export function asyncPipe<T>(...fns: Array<(x: T) => T | Promise<T>>): (x: T) => Promise<T>;
export function asyncPipe<T, U>(...fns: Array<(x: T | U) => U | Promise<U>>): (x: T) => Promise<U>;
export function asyncPipe(...fns: Array<(x: any) => any>): (x: any) => Promise<any>;
