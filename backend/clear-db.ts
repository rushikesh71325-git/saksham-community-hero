import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.issueEvent.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleared! Corporations and Wards are preserved.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
