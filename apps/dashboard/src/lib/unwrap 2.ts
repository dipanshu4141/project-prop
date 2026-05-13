/**
 * Unwrap params/searchParams safely for App Router pages.
 * Works whether Next gives them as Promise or plain object.
 */
export async function unwrap<T>(value: T | Promise<T>): Promise<T> {
  return value instanceof Promise ? await value : value;
}
