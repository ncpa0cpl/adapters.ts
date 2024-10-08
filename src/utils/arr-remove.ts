export function arrRemove<T>(arr: T[], item: T): void {
  const index = arr.indexOf(item);
  if (index !== -1) {
    arr.splice(index, 1);
  }
}
