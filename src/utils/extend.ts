export function extend<T extends object, U extends object = {}>(
  base: T,
  assign?: U,
): T & U {
  const newObj = Object.create(base);
  if (assign) {
    for (const key in assign) {
      newObj[key] = assign[key];
    }
  }
  return newObj;
}
