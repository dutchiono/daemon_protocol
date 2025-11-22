/**
 * @title Node.js Compatibility Polyfill
 * @notice Polyfill for Promise.withResolvers() for Node.js < 22
 */

// Polyfill Promise.withResolvers() for Node.js versions < 22
if (!Promise.withResolvers) {
  Promise.withResolvers = function<T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

