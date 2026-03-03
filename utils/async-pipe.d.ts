export function asyncPipe<T>(
  ...fns: Array<(x: T) => T | Promise<T>>
): (x: T) => Promise<T>;
export function asyncPipe<T, U>(
  ...fns: Array<(x: T | U) => U | Promise<U>>
): (x: T) => Promise<U>;
export function asyncPipe(
  ...fns: Array<(x: any) => any>
): (x: any) => Promise<any>;
