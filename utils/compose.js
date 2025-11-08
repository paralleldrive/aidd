/**
 * Composes functions from right to left, passing the result of each function
 * to the next. This is the traditional mathematical composition order.
 *
 * @param {...Function} fns - Functions to compose
 * @returns {Function} A function that takes an initial value and applies all functions in reverse sequence
 *
 * @example
 * const add1 = (x) => x + 1;
 * const multiply2 = (x) => x * 2;
 * const composed = compose(multiply2, add1);
 * composed(5); // => 12 (add1 first, then multiply2)
 */
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((y, f) => f(y), x);

export { compose };
