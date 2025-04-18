import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const batchSize = 1000;
  const total = 2_000_000;

  for (let i = 0; i < total / batchSize; i++) {
    const users = Array.from({ length: batchSize }, () => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
    }));

    await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    console.log(`Inserted batch ${i + 1} / ${total / batchSize}`);
  }

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed', e);
  })
  .finally(() => prisma.$disconnect());