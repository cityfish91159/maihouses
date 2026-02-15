/**
 * Deep freeze utility for seed/mock constants.
 * Prevents runtime mutation across modes.
 */
function isObjectRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

export function deepFreeze<T>(value: T): T {
  if (!isObjectRecord(value)) {
    return value;
  }

  for (const key of Reflect.ownKeys(value)) {
    const child = value[key];
    if (isObjectRecord(child) && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }

  Object.freeze(value);
  return value;
}
