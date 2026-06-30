import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock user...');
  await prisma.user.upsert({
    where: { id: 'mock-citizen-uuid-for-demo' },
    update: { xp: 0, level: 1 },
    create: {
      id: 'mock-citizen-uuid-for-demo',
      email: 'citizen@example.com',
      passwordHash: 'dummy',
      displayName: 'Local Citizen',
      role: 'CITIZEN',
      xp: 0,
      level: 1
    }
  });
  console.log('Mock user seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
