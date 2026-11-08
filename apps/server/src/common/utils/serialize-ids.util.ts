import { Types } from 'mongoose';

function isPlainObject(value: object): value is Record<string, unknown> {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Converts Mongo's `_id` into a string `id` everywhere in an outgoing payload,
 * recursively, and drops `__v`. The database keeps `_id`; only the API
 * contract uses `id`.
 *
 * Hydrated mongoose documents are converted with `toObject()` first. Other
 * class instances (`ObjectId`, `Date`, ...) are left as they are.
 */
export function serializeIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map(serializeIds) as T;

  if (typeof value !== 'object' || value === null) return value;

  if (value instanceof Types.ObjectId || value instanceof Date) return value;

  const maybeDocument = value as { toObject?: () => unknown; $__?: unknown };
  if (maybeDocument.$__ && typeof maybeDocument.toObject === 'function')
    return serializeIds(maybeDocument.toObject()) as T;

  if (!isPlainObject(value)) return value;

  const result: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(value)) {
    if (key === '__v') continue;
    if (key === '_id') {
      if (field !== null && field !== undefined) result.id = String(field);
      continue;
    }
    result[key] = serializeIds(field);
  }

  return result as T;
}
