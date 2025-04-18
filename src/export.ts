import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { stringify } from 'csv-stringify';
import { Transform } from 'stream';

const prisma = new PrismaClient();

async function exportToCSV() {
  const writeStream = fs.createWriteStream('users.csv');
  const batchSize = 1000;
  let cursorId = 0;

  // Generator de usuários em batches
  async function* generateUsers() {
    while (true) {
      const users = await prisma.user.findMany({
        where: { id: { gt: cursorId } },
        orderBy: { id: 'asc' },
        take: batchSize,
      });

      if (users.length === 0) break;

      for (const user of users) {
        yield user;
        cursorId = user.id;
      }
    }
  }

  const transformUserToRow = new Transform({
    objectMode: true,
    transform(user, _, callback) {
      const row = [user.id, user.name, user.email];
      callback(null, row);
    },
  });

  const csvStringifier = stringify({
    header: true,
    columns: ['id', 'name', 'email'],
  });

  try {
    await pipeline(
      generateUsers(),
      transformUserToRow,
      csvStringifier,
      writeStream
    );
    console.log('✅ CSV export complete');
  } catch (err) {
    console.error('❌ Export error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportToCSV();