export function pipe<T>(...fns: Array<(x: T) => T>): (x: T) => T;
export function pipe<T, U>(...fns: Array<(x: T | U) => U>): (x: T) => U;
export function pipe(...fns: Array<(x: any) => any>): (x: any) => any;
