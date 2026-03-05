export function compose<T>(...fns: Array<(x: T) => T>): (x: T) => T;
export function compose<T, U>(...fns: Array<(x: T | U) => U>): (x: T) => U;
export function compose(...fns: Array<(x: any) => any>): (x: any) => any;
