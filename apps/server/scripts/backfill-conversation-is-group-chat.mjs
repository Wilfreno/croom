import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
const envLine = readFileSync(envPath, 'utf8')
  .split('\n')
  .find((line) => line.startsWith('MONGO_DB_CONNECTION_STRING='));
const connectionString = process.env.MONGO_DB_CONNECTION_STRING ?? envLine?.split('=').slice(1).join('=').replace(/^"|"$/g, '');

if (!connectionString) throw new Error('MONGO_DB_CONNECTION_STRING is not set');

function report(label, value) {
  const line = value === undefined ? label : `${label}: ${JSON.stringify(value)}`;
  process.stdout.write(`${line}\n`);
}

const shouldWrite = process.argv.includes('--write');
const missingField = { isGroupChat: { $exists: false } };
const isGroupBySize = { $gt: [{ $size: '$members' }, 2] };

await mongoose.connect(connectionString);
const conversations = mongoose.connection.db.collection('conversation');

const [summary] = await conversations
  .aggregate([
    { $match: missingField },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        groups: { $sum: { $cond: [isGroupBySize, 1, 0] } },
        oneToOne: { $sum: { $cond: [isGroupBySize, 0, 1] } },
        groupsWithGeneratedName: {
          $sum: { $cond: [{ $and: [isGroupBySize, { $ne: [{ $ifNull: ['$name', ''] }, ''] }] }, 1, 0] },
        },
        namedWithTwoOrFewerMembers: {
          $sum: { $cond: [{ $and: [{ $not: [isGroupBySize] }, { $ne: [{ $ifNull: ['$name', ''] }, ''] }] }, 1, 0] },
        },
      },
    },
  ])
  .toArray();

report('conversations without isGroupChat', summary ?? { total: 0 });

if (shouldWrite) {
  const result = await conversations.updateMany(missingField, [
    {
      $set: {
        isGroupChat: isGroupBySize,
        name: { $cond: [isGroupBySize, '', { $ifNull: ['$name', ''] }] },
      },
    },
  ]);
  report('updated', result.modifiedCount);
} else {
  report('dry run, pass --write to update');
}

await mongoose.disconnect();
