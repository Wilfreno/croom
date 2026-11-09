import type { PipelineStage } from 'mongoose';

/** Swaps `_id` for a string `id` (and drops `__v`) on the current document. */
export const toEntity = [
  { $set: { id: { $toString: '$_id' } } },
  { $unset: ['_id', '__v'] },
] satisfies PipelineStage[];
