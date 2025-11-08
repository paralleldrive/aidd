/**
 * Composes functions from left to right, passing the result of each function
 * to the next. Similar to asyncPipe but for synchronous functions.
 *
 * @param {...Function} fns - Functions to compose
 * @returns {Function} A function that takes an initial value and applies all functions in sequence
 *
 * @example
 * const add1 = (x) => x + 1;
 * const multiply2 = (x) => x * 2;
 * const pipeline = pipe(add1, multiply2);
 * pipeline(5); // => 12
 */
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((y, f) => f(y), x);

export { pipe };
