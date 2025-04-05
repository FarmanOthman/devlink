import { prisma } from '../setup';
import { Role, JobType, ApplicationStatus } from '@prisma/client';

describe('Sorting and Filtering', () => {
  // Test data for company and category
  const testCompany = {
    name: `Test Company ${Date.now()}`,
    website: 'https://testcompany.com',
    industry: 'Technology',
  };

  const testCategory = {
    name: `Software Development ${Date.now()}`,
  };

  // Test data for users
  const testRecruiter = {
    name: 'Test Recruiter',
    email: `recruiter_${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role: Role.RECRUITER,
  };

  const testDevelopers = [
    {
      name: 'Junior Developer',
      email: `junior_${Date.now()}@example.com`,
      password: 'hashedPassword123',
      role: Role.DEVELOPER,
    },
    {
      name: 'Mid Developer',
      email: `mid_${Date.now()}@example.com`,
      password: 'hashedPassword123',
      role: Role.DEVELOPER,
    },
    {
      name: 'Senior Developer',
      email: `senior_${Date.now()}@example.com`,
      password: 'hashedPassword123',
      role: Role.DEVELOPER,
    },
  ];

  // Test data for jobs
  const testJobs = [
    {
      title: 'Junior Developer Position',
      description: 'Entry level position',
      location: 'Remote',
      type: JobType.FULL_TIME,
      salaryMin: 40000,
      salaryMax: 60000,
      currency: 'USD',
      remote: true,
    },
    {
      title: 'Mid-Level Developer',
      description: 'Mid level position',
      location: 'New York',
      type: JobType.FULL_TIME,
      salaryMin: 70000,
      salaryMax: 90000,
      currency: 'USD',
      remote: false,
    },
    {
      title: 'Senior Developer Role',
      description: 'Senior level position',
      location: 'San Francisco',
      type: JobType.FULL_TIME,
      salaryMin: 120000,
      salaryMax: 180000,
      currency: 'USD',
      remote: true,
    },
  ];

  let companyId: string;
  let categoryId: string;
  let recruiterId: string;
  let developerIds: string[];
  let jobIds: string[];

  beforeEach(async () => {
    // Create base data
    const company = await prisma.company.create({ data: testCompany });
    const category = await prisma.jobCategory.create({ data: testCategory });
    
    companyId = company.id;
    categoryId = category.id;

    // Create recruiter
    const recruiter = await prisma.user.create({
      data: {
        ...testRecruiter,
        companyId,
      },
    });
    recruiterId = recruiter.id;

    // Create developers
    const developers = await Promise.all(
      testDevelopers.map(dev => 
        prisma.user.create({
          data: {
            ...dev,
            email: `${dev.email.split('@')[0]}_${Date.now()}@example.com`,
          },
        })
      )
    );
    developerIds = developers.map(dev => dev.id);

    // Create jobs
    const jobs = await Promise.all(
      testJobs.map(job =>
        prisma.job.create({
          data: {
            ...job,
            userId: recruiterId,
            companyId,
            categoryId,
          },
        })
      )
    );
    jobIds = jobs.map(job => job.id);

    // Create applications with different dates and statuses
    await Promise.all([
      prisma.application.create({
        data: {
          userId: developerIds[0],
          jobId: jobIds[0],
          resumeUrl: 'https://example.com/resume1.pdf',
          status: ApplicationStatus.PENDING,
          skillMatchScore: 65,
          createdAt: new Date('2024-01-01'),
        },
      }),
      prisma.application.create({
        data: {
          userId: developerIds[1],
          jobId: jobIds[1],
          resumeUrl: 'https://example.com/resume2.pdf',
          status: ApplicationStatus.UNDER_REVIEW,
          skillMatchScore: 85,
          createdAt: new Date('2024-01-15'),
        },
      }),
      prisma.application.create({
        data: {
          userId: developerIds[2],
          jobId: jobIds[2],
          resumeUrl: 'https://example.com/resume3.pdf',
          status: ApplicationStatus.INTERVIEW_SCHEDULED,
          skillMatchScore: 95,
          createdAt: new Date('2024-02-01'),
        },
      }),
    ]);
  });

  describe('Job Sorting', () => {
    it('should sort jobs by salary in ascending order', async () => {
      const jobs = await prisma.job.findMany({
        orderBy: { salaryMin: 'asc' },
      });

      expect(jobs).toHaveLength(3);
      expect(jobs[0].salaryMin).toBe(40000);
      expect(jobs[1].salaryMin).toBe(70000);
      expect(jobs[2].salaryMin).toBe(120000);
    });

    it('should sort jobs by salary in descending order', async () => {
      const jobs = await prisma.job.findMany({
        orderBy: { salaryMax: 'desc' },
      });

      expect(jobs).toHaveLength(3);
      expect(jobs[0].salaryMax).toBe(180000);
      expect(jobs[1].salaryMax).toBe(90000);
      expect(jobs[2].salaryMax).toBe(60000);
    });

    it('should filter jobs by location', async () => {
      const remoteJobs = await prisma.job.findMany({
        where: { remote: true },
      });

      expect(remoteJobs).toHaveLength(2);
      expect(remoteJobs.every(job => job.remote)).toBe(true);
    });

    it('should filter jobs by salary range', async () => {
      const midRangeJobs = await prisma.job.findMany({
        where: {
          AND: [
            { salaryMin: { gte: 60000 } },
            { salaryMax: { lte: 100000 } },
          ],
        },
      });

      expect(midRangeJobs).toHaveLength(1);
      expect(midRangeJobs[0].title).toBe('Mid-Level Developer');
    });
  });

  describe('Application Sorting', () => {
    it('should sort applications by creation date', async () => {
      const applications = await prisma.application.findMany({
        orderBy: { createdAt: 'asc' },
      });

      expect(applications).toHaveLength(3);
      expect(applications[0].createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(applications[1].createdAt.toISOString()).toBe('2024-01-15T00:00:00.000Z');
      expect(applications[2].createdAt.toISOString()).toBe('2024-02-01T00:00:00.000Z');
    });

    it('should sort applications by skill match score', async () => {
      const applications = await prisma.application.findMany({
        orderBy: { skillMatchScore: 'desc' },
      });

      expect(applications).toHaveLength(3);
      expect(applications[0].skillMatchScore).toBe(95);
      expect(applications[1].skillMatchScore).toBe(85);
      expect(applications[2].skillMatchScore).toBe(65);
    });

    it('should filter applications by status', async () => {
      const pendingApplications = await prisma.application.findMany({
        where: { status: ApplicationStatus.PENDING },
      });

      expect(pendingApplications).toHaveLength(1);
      expect(pendingApplications[0].status).toBe(ApplicationStatus.PENDING);
    });

    it('should combine sorting and filtering', async () => {
      const applications = await prisma.application.findMany({
        where: {
          skillMatchScore: {
            gte: 80,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(applications).toHaveLength(2);
      expect(applications[0].skillMatchScore).toBeGreaterThanOrEqual(80);
      expect(applications[1].skillMatchScore).toBeGreaterThanOrEqual(80);
      expect(applications[0].createdAt.getTime()).toBeGreaterThan(applications[1].createdAt.getTime());
    });
  });

  describe('Complex Queries', () => {
    it('should find jobs with applications sorted by match score', async () => {
      const jobsWithApplications = await prisma.job.findMany({
        include: {
          applications: {
            orderBy: {
              skillMatchScore: 'desc',
            },
          },
        },
      });

      expect(jobsWithApplications).toHaveLength(3);
      jobsWithApplications.forEach(job => {
        if (job.applications.length > 1) {
          for (let i = 0; i < job.applications.length - 1; i++) {
            const currentScore = job.applications[i].skillMatchScore || 0;
            const nextScore = job.applications[i + 1].skillMatchScore || 0;
            expect(currentScore).toBeGreaterThanOrEqual(nextScore);
          }
        }
      });
    });

    it('should paginate and sort jobs', async () => {
      const pageSize = 2;
      const page1 = await prisma.job.findMany({
        take: pageSize,
        orderBy: { salaryMin: 'asc' },
      });

      const page2 = await prisma.job.findMany({
        take: pageSize,
        skip: pageSize,
        orderBy: { salaryMin: 'asc' },
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
      expect(page1[0].salaryMin || 0).toBeLessThan(page1[1].salaryMin || 0);
      expect(page1[1].salaryMin || 0).toBeLessThan(page2[0].salaryMin || 0);
    });
  });
}); 