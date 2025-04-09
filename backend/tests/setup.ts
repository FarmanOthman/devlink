import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to the test database
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up the database before each test
  // Delete in order to handle foreign key constraints
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.document.deleteMany(),
    prisma.userSkill.deleteMany(),
    prisma.jobSkill.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.savedJob.deleteMany(),
    prisma.application.deleteMany(),
    prisma.job.deleteMany(),
    prisma.jobCategory.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
  ], {
    isolationLevel: 'Serializable' // This ensures consistency
  });
});

afterAll(async () => {
  // Disconnect from the database
  await prisma.$disconnect();
});

export { prisma }; 