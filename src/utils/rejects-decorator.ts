/** ensure the decorated function always returns errors as rejected promises */
export function Rejects(originalMethod: any, _context: any) {
  return function(this: any, ...args: any[]) {
    try {
      return originalMethod.apply(this, args);
    } catch (error) {
      return Promise.reject(error);
    }
  };
}
