/**
 * Deep freeze utility for seed/mock constants.
 * Prevents runtime mutation across modes.
 */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const target = value as Record<string, unknown>;
  const propertyNames = Object.getOwnPropertyNames(target);

  for (const name of propertyNames) {
    const child = target[name];
    if (child !== null && typeof child === 'object' && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }

  return Object.freeze(value);
}
