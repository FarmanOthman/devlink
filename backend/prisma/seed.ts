import { PrismaClient } from '@prisma/client';

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

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'hashedpassword123',
      role: 'DEVELOPER',
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
      password: 'hashedpassword456',
      role: 'RECRUITER',
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

  // Create Jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior JavaScript Developer',
      description: 'We are looking for a skilled JavaScript developer.',
      location: 'Remote',
      type: 'REMOTE',
      companyId: company1.id,
      userId: user2.id,
      skills: {
        create: [
          { skillId: skill1.id, level: 'EXPERT' },
          { skillId: skill3.id, level: 'INTERMEDIATE' },
        ],
      },
      categories: {
        create: [{ name: 'Software Development' }],
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
      fileName: 'resume.pdf',
      fileType: 'application/pdf',
      filePath: '/uploads/resume.pdf',
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });