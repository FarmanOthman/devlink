import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../config/auth';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.jobCategory.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create Skills
  const skill1 = await prisma.skill.create({
    data: { name: 'JavaScript' },
  });
  const skill2 = await prisma.skill.create({
    data: { name: 'Python' },
  });
  const skill3 = await prisma.skill.create({
    data: { name: 'Project Management' },
  });

  // Hash passwords for users
  const password1 = await hashPassword('password123');
  const password2 = await hashPassword('password456');
  const password3 = await hashPassword('adminpass789');

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: password1,
      role: 'DEVELOPER',
      tokenVersion: 0,
      lastActive: new Date(),
      skills: {
        create: [
          { skillId: skill1.id, level: 'INTERMEDIATE' },
          { skillId: skill2.id, level: 'BEGINNER' },
        ],
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: password2,
      role: 'RECRUITER',
      tokenVersion: 0,
      lastActive: new Date(),
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: password3,
      role: 'ADMIN',
      tokenVersion: 0,
      lastActive: new Date(),
    },
  });

  // Create Companies
  const company1 = await prisma.company.create({
    data: {
      name: 'Tech Corp',
      website: 'https://techcorp.com',
      users: { connect: { id: user2.id } },
    },
  });

  // Create a Job Category first
  const jobCategory = await prisma.jobCategory.create({
    data: {
      name: 'Software Development'
    },
  });

  // Create Jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior JavaScript Developer',
      description: 'We are looking for a skilled JavaScript developer.',
      location: 'Remote',
      type: 'REMOTE',
      companyId: company1.id,
      userId: user2.id,
      categoryId: jobCategory.id,
      skills: {
        create: [
          { skillId: skill1.id, level: 'EXPERT' },
          { skillId: skill3.id, level: 'INTERMEDIATE' },
        ],
      },
    },
  });

  // Create Applications
  await prisma.application.create({
    data: {
      userId: user1.id,
      jobId: job1.id,
      resumeUrl: 'https://example.com/resume/johndoe.pdf',
      status: 'PENDING',
    },
  });

  // Create Documents
  await prisma.document.create({
    data: {
      userId: user1.id,
      fileUrl: 'https://example.com/resume/johndoe.pdf',
      documentType: 'RESUME',
    },
  });

  // Create Notifications
  await prisma.notification.create({
    data: {
      userId: user1.id,
      message: 'Your application for Senior JavaScript Developer has been received.',
      isRead: false,
    },
  });

  // Create Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: user1.id,
      action: 'APPLICATION_SUBMITTED',
      oldValue: null,
      newValue: JSON.stringify({ jobId: job1.id, status: 'PENDING' }),
    },
  });

  console.log('Database seeded successfully!');
  console.log('\nTest Accounts:');
  console.log('Developer - Email: john.doe@example.com, Password: password123');
  console.log('Recruiter - Email: jane.smith@example.com, Password: password456');
  console.log('Admin - Email: admin@example.com, Password: adminpass789');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });