import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { serializeIds } from './serialize-ids.util';

describe('serializeIds', () => {
  it('turns `_id` into a string `id` and drops `__v`', () => {
    const _id = new Types.ObjectId();

    expect(serializeIds({ _id, __v: 3, name: 'croom' })).toEqual({ id: _id.toString(), name: 'croom' });
  });

  it('converts nested objects and arrays recursively', () => {
    const userId = new Types.ObjectId();
    const photoId = new Types.ObjectId();

    const result = serializeIds({
      members: [{ _id: userId, photo: { _id: photoId, url: 'u' } }],
    });

    expect(result).toEqual({
      members: [{ id: userId.toString(), photo: { id: photoId.toString(), url: 'u' } }],
    });
  });

  it('serializes a top-level array', () => {
    const a = new Types.ObjectId();
    const b = new Types.ObjectId();

    expect(serializeIds([{ _id: a }, { _id: b }])).toEqual([{ id: a.toString() }, { id: b.toString() }]);
  });

  it('leaves ObjectId and Date values that are not `_id` as they are', () => {
    const sender = new Types.ObjectId();
    const dateCreated = new Date();

    const result = serializeIds({ sender, dateCreated }) as { sender: unknown; dateCreated: unknown };

    expect(result.sender).toBe(sender);
    expect(result.dateCreated).toBe(dateCreated);
  });

  it('omits a null or undefined `_id` instead of writing `id`', () => {
    expect(serializeIds({ _id: null, a: 1 })).toEqual({ a: 1 });
    expect(serializeIds({ _id: undefined, a: 1 })).toEqual({ a: 1 });
  });

  it('keeps an `id` that the input already has', () => {
    expect(serializeIds({ id: 'already', a: 1 })).toEqual({ id: 'already', a: 1 });
  });

  it('returns primitives and null untouched', () => {
    expect(serializeIds(null)).toBeNull();
    expect(serializeIds(undefined)).toBeUndefined();
    expect(serializeIds('text')).toBe('text');
    expect(serializeIds(42)).toBe(42);
  });

  it('calls toObject() on a hydrated mongoose document first', () => {
    const _id = new Types.ObjectId();
    const toObject = vi.fn(() => ({ _id, __v: 0, name: 'doc' }));
    const document = { $__: {}, toObject };

    expect(serializeIds(document)).toEqual({ id: _id.toString(), name: 'doc' });
    expect(toObject).toHaveBeenCalledOnce();
  });

  it('leaves other class instances alone', () => {
    class Custom {
      _id = 'kept';
    }
    const instance = new Custom();

    expect(serializeIds({ value: instance })).toEqual({ value: instance });
    expect((serializeIds({ value: instance }) as { value: Custom }).value).toBe(instance);
  });

  it('handles objects with a null prototype', () => {
    const _id = new Types.ObjectId();
    const value = Object.assign(Object.create(null), { _id });

    expect(serializeIds(value)).toEqual({ id: _id.toString() });
  });

  it('does not mutate its input', () => {
    const _id = new Types.ObjectId();
    const input = { _id, __v: 1 };

    serializeIds(input);

    expect(input).toEqual({ _id, __v: 1 });
  });
});
