import { prisma } from '../setup';
import { JobType, Role } from '@prisma/client';

describe('Job Model', () => {
  const testUser = {
    name: 'Test Recruiter',
    email: 'recruiter@example.com',
    password: 'hashedPassword123',
    role: Role.RECRUITER,
  };

  const testCompany = {
    name: 'Test Company',
    website: 'https://testcompany.com',
    industry: 'Technology',
  };

  const testCategory = {
    name: 'Software Development',
  };

  const testJob = {
    title: 'Senior Developer',
    description: 'Looking for a senior developer',
    location: 'Remote',
    type: JobType.FULL_TIME,
    salaryMin: 80000,
    salaryMax: 120000,
    currency: 'USD',
    remote: true,
  };

  let userId: string;
  let companyId: string;
  let categoryId: string;

  beforeEach(async () => {
    // Create test data in the correct order
    const company = await prisma.company.create({ data: testCompany });
    const user = await prisma.user.create({ 
      data: {
        ...testUser,
        companyId: company.id // Associate user with company
      }
    });
    const category = await prisma.jobCategory.create({ data: testCategory });
    
    userId = user.id;
    companyId = company.id;
    categoryId = category.id;
  });

  it('should create a new job', async () => {
    const job = await prisma.job.create({
      data: {
        ...testJob,
        userId,
        companyId,
        categoryId,
      },
    });

    expect(job).toHaveProperty('id');
    expect(job.title).toBe(testJob.title);
    expect(job.companyId).toBe(companyId);
  });

  it('should read a job with relationships', async () => {
    const createdJob = await prisma.job.create({
      data: {
        ...testJob,
        userId,
        companyId,
        categoryId,
      },
    });

    const job = await prisma.job.findUnique({
      where: { id: createdJob.id },
      include: {
        company: true,
        user: true,
        category: true,
      },
    });

    expect(job).not.toBeNull();
    expect(job?.company.name).toBe(testCompany.name);
    expect(job?.user.name).toBe(testUser.name);
    expect(job?.category.name).toBe(testCategory.name);
  });

  it('should update a job', async () => {
    const createdJob = await prisma.job.create({
      data: {
        ...testJob,
        userId,
        companyId,
        categoryId,
      },
    });

    const updatedJob = await prisma.job.update({
      where: { id: createdJob.id },
      data: { 
        title: 'Updated Title',
        salaryMin: 90000,
        salaryMax: 130000,
      },
    });

    expect(updatedJob.title).toBe('Updated Title');
    expect(updatedJob.salaryMin).toBe(90000);
    expect(updatedJob.salaryMax).toBe(130000);
  });

  it('should delete a job', async () => {
    const createdJob = await prisma.job.create({
      data: {
        ...testJob,
        userId,
        companyId,
        categoryId,
      },
    });

    await prisma.job.delete({
      where: { id: createdJob.id },
    });

    const deletedJob = await prisma.job.findUnique({
      where: { id: createdJob.id },
    });

    expect(deletedJob).toBeNull();
  });

  it('should create a job with skills', async () => {
    const skill = await prisma.skill.create({
      data: { name: 'JavaScript' },
    });

    const job = await prisma.job.create({
      data: {
        ...testJob,
        userId,
        companyId,
        categoryId,
        skills: {
          create: {
            skillId: skill.id,
            level: 'EXPERT',
          },
        },
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    expect(job.skills).toHaveLength(1);
    expect(job.skills[0].skill.name).toBe('JavaScript');
    expect(job.skills[0].level).toBe('EXPERT');
  });
}); 