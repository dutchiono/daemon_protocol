/**
 * @title Node.js Compatibility Polyfill
 * @notice Polyfill for Promise.withResolvers() for Node.js < 22
 */

// Type declaration to avoid TypeScript errors
declare global {
  interface PromiseConstructor {
    withResolvers<T>(): {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: any) => void;
    };
  }
}

// Polyfill Promise.withResolvers() for Node.js versions < 22
if (!(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function<T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
  } {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

