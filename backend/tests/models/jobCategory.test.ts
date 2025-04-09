import { prisma } from '../setup';
import { Role, JobType } from '@prisma/client';

describe('JobCategory Model', () => {
  const testCategory = {
    name: `Software Development ${Date.now()}`,
  };

  const testRecruiter = {
    name: 'Test Recruiter',
    email: `recruiter_${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role: Role.RECRUITER,
  };

  const testCompany = {
    name: `Test Company ${Date.now()}`,
    website: 'https://testcompany.com',
    industry: 'Technology',
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

  describe('Basic CRUD', () => {
    it('should create a job category', async () => {
      const category = await prisma.jobCategory.create({
        data: testCategory,
      });

      expect(category).toHaveProperty('id');
      expect(category.name).toBe(testCategory.name);
    });

    it('should enforce unique category names', async () => {
      await prisma.jobCategory.create({
        data: testCategory,
      });

      await expect(
        prisma.jobCategory.create({
          data: testCategory,
        })
      ).rejects.toThrow();
    });

    it('should read a job category', async () => {
      const category = await prisma.jobCategory.create({
        data: {
          name: `Test Category ${Date.now()}`,
        },
      });

      const foundCategory = await prisma.jobCategory.findUnique({
        where: { id: category.id },
      });

      expect(foundCategory).not.toBeNull();
      expect(foundCategory?.name).toBe(category.name);
    });

    it('should update a job category', async () => {
      const category = await prisma.jobCategory.create({
        data: {
          name: `Test Category ${Date.now()}`,
        },
      });

      const newName = `Updated Category ${Date.now()}`;
      const updatedCategory = await prisma.jobCategory.update({
        where: { id: category.id },
        data: { name: newName },
      });

      expect(updatedCategory.name).toBe(newName);
    });

    it('should delete a job category', async () => {
      const category = await prisma.jobCategory.create({
        data: {
          name: `Test Category ${Date.now()}`,
        },
      });

      await prisma.jobCategory.delete({
        where: { id: category.id },
      });

      const deletedCategory = await prisma.jobCategory.findUnique({
        where: { id: category.id },
      });

      expect(deletedCategory).toBeNull();
    });
  });

  describe('Relationships', () => {
    it('should be associated with jobs', async () => {
      const company = await prisma.company.create({ data: testCompany });
      const recruiter = await prisma.user.create({
        data: {
          ...testRecruiter,
          companyId: company.id,
        },
      });
      const category = await prisma.jobCategory.create({
        data: testCategory,
      });

      const job = await prisma.job.create({
        data: {
          ...testJob,
          userId: recruiter.id,
          companyId: company.id,
          categoryId: category.id,
        },
      });

      const categoryWithJobs = await prisma.jobCategory.findUnique({
        where: { id: category.id },
        include: { jobs: true },
      });

      expect(categoryWithJobs?.jobs).toHaveLength(1);
      expect(categoryWithJobs?.jobs[0].id).toBe(job.id);
    });

    it('should handle multiple jobs in the same category', async () => {
      const company = await prisma.company.create({ data: testCompany });
      const recruiter = await prisma.user.create({
        data: {
          ...testRecruiter,
          companyId: company.id,
        },
      });
      const category = await prisma.jobCategory.create({
        data: testCategory,
      });

      await Promise.all([
        prisma.job.create({
          data: {
            ...testJob,
            title: 'Job 1',
            userId: recruiter.id,
            companyId: company.id,
            categoryId: category.id,
          },
        }),
        prisma.job.create({
          data: {
            ...testJob,
            title: 'Job 2',
            userId: recruiter.id,
            companyId: company.id,
            categoryId: category.id,
          },
        }),
      ]);

      const categoryWithJobs = await prisma.jobCategory.findUnique({
        where: { id: category.id },
        include: { jobs: true },
      });

      expect(categoryWithJobs?.jobs).toHaveLength(2);
    });

    it('should cascade delete associated jobs when category is deleted', async () => {
      const company = await prisma.company.create({ data: testCompany });
      const recruiter = await prisma.user.create({
        data: {
          ...testRecruiter,
          companyId: company.id,
        },
      });
      const category = await prisma.jobCategory.create({
        data: testCategory,
      });

      const job = await prisma.job.create({
        data: {
          ...testJob,
          userId: recruiter.id,
          companyId: company.id,
          categoryId: category.id,
        },
      });

      await prisma.jobCategory.delete({
        where: { id: category.id },
      });

      const deletedJob = await prisma.job.findUnique({
        where: { id: job.id },
      });

      expect(deletedJob).toBeNull();
    });
  });

  describe('Querying', () => {
    it('should find categories by name', async () => {
      const uniqueName = `Test Category ${Date.now()}`;
      await prisma.jobCategory.create({
        data: { name: uniqueName },
      });

      const foundCategory = await prisma.jobCategory.findFirst({
        where: {
          name: uniqueName,
        },
      });

      expect(foundCategory).not.toBeNull();
      expect(foundCategory?.name).toBe(uniqueName);
    });

    it('should find categories with job count', async () => {
      const company = await prisma.company.create({ data: testCompany });
      const recruiter = await prisma.user.create({
        data: {
          ...testRecruiter,
          companyId: company.id,
        },
      });
      const category = await prisma.jobCategory.create({
        data: testCategory,
      });

      await Promise.all([
        prisma.job.create({
          data: {
            ...testJob,
            title: 'Job 1',
            userId: recruiter.id,
            companyId: company.id,
            categoryId: category.id,
          },
        }),
        prisma.job.create({
          data: {
            ...testJob,
            title: 'Job 2',
            userId: recruiter.id,
            companyId: company.id,
            categoryId: category.id,
          },
        }),
      ]);

      const categoryWithCount = await prisma.jobCategory.findUnique({
        where: { id: category.id },
        include: {
          _count: {
            select: { jobs: true },
          },
        },
      });

      expect(categoryWithCount?._count.jobs).toBe(2);
    });
  });
}); 