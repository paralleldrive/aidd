/**
 * Composes async functions from left to right, passing the result of each function
 * to the next. Each function receives the awaited result of the previous function.
 *
 * @param {...Function} fns - Functions to compose. Each function can be sync or async.
 * @returns {Function} A function that takes an initial value and applies all functions in sequence
 *
 * @example
 * const add1 = async (x) => x + 1;
 * const multiply2 = async (x) => x * 2;
 * const pipeline = asyncPipe(add1, multiply2);
 * await pipeline(5); // => 12
 */
const asyncPipe =
  (...fns) =>
  (x) =>
    fns.reduce(async (y, f) => f(await y), x);

export { asyncPipe };
