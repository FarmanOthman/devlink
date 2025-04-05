import { Role, JobType } from '@prisma/client';
import { prisma } from '../setup';

describe('SavedJob Model', () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    password: 'password123',
    role: Role.DEVELOPER,
  };

  const testRecruiter = {
    email: `recruiter${Date.now()}@example.com`,
    name: 'Test Recruiter',
    password: 'password123',
    role: Role.RECRUITER,
  };

  const testCompany = {
    name: `Test Company ${Date.now()}`,
    description: 'A test company',
    website: 'https://testcompany.com',
    location: 'Test Location',
    industry: 'Technology',
  };

  const testCategory = {
    name: `Test Category ${Date.now()}`,
  };

  let testJob: any;
  let testUserId: string;
  let testCompanyId: string;
  let testCategoryId: string;
  let testRecruiterId: string;

  beforeEach(async () => {
    try {
      console.log('Starting test setup...');

      console.log('Creating user...');
      const user = await prisma.user.create({ data: testUser });
      testUserId = user.id;
      console.log('User created:', testUserId);

      console.log('Creating company...');
      const company = await prisma.company.create({ data: testCompany });
      testCompanyId = company.id;
      console.log('Company created:', testCompanyId);

      console.log('Creating recruiter...');
      const recruiter = await prisma.user.create({ 
        data: {
          ...testRecruiter,
          companyId: company.id,
        }
      });
      testRecruiterId = recruiter.id;
      console.log('Recruiter created:', testRecruiterId);

      console.log('Creating job category...');
      const category = await prisma.jobCategory.create({ data: testCategory });
      testCategoryId = category.id;
      console.log('Job category created:', testCategoryId);

      console.log('Creating job...');
      testJob = await prisma.job.create({
        data: {
          title: 'Test Job',
          description: 'A test job position',
          location: 'Test Location',
          type: JobType.FULL_TIME,
          salaryMin: 50000.0,
          salaryMax: 100000.0,
          currency: 'USD',
          companyId: testCompanyId,
          userId: testRecruiterId,
          categoryId: testCategoryId,
          remote: false,
        },
      });
      console.log('Job created:', testJob.id);

      // Verify job was created
      const verifyJob = await prisma.job.findUnique({ 
        where: { id: testJob.id },
        include: {
          company: true,
          user: true,
          category: true,
        }
      });
      
      if (!verifyJob) {
        throw new Error('Job was not created successfully');
      }
      
      console.log('Job verified with details:', {
        id: verifyJob.id,
        title: verifyJob.title,
        companyId: verifyJob.companyId,
        userId: verifyJob.userId,
        categoryId: verifyJob.categoryId
      });

      console.log('Test setup completed successfully.');
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      console.log('Starting cleanup...');
      await prisma.savedJob.deleteMany({});
      await prisma.job.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.company.deleteMany({});
      await prisma.jobCategory.deleteMany({});
      console.log('Cleanup completed.');
    } catch (error) {
      console.error('Error in afterAll cleanup:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Verify job still exists before each test
    const job = await prisma.job.findUnique({ 
      where: { id: testJob.id },
      include: {
        company: true,
        user: true,
        category: true,
      }
    });
    
    if (!job) {
      console.error('Job not found with ID:', testJob.id);
      throw new Error('Job not found before test execution');
    }
    
    console.log('Job verified before test:', {
      id: job.id,
      title: job.title,
      companyId: job.companyId,
      userId: job.userId,
      categoryId: job.categoryId
    });
  });

  describe('Basic CRUD', () => {
    it('should save a job for a user', async () => {
      console.log('Creating saved job with:', { userId: testUserId, jobId: testJob?.id });
      const savedJob = await prisma.savedJob.create({
        data: {
          userId: testUserId,
          jobId: testJob.id,
        },
      });

      expect(savedJob).toHaveProperty('id');
      expect(savedJob.userId).toBe(testUserId);
      expect(savedJob.jobId).toBe(testJob.id);
    });

    it('should enforce unique user-job combination', async () => {
      await prisma.savedJob.create({
        data: {
          userId: testUserId,
          jobId: testJob.id,
        },
      });

      await expect(
        prisma.savedJob.create({
          data: {
            userId: testUserId,
            jobId: testJob.id,
          },
        })
      ).rejects.toThrow();
    });

    it('should read a saved job', async () => {
      await prisma.savedJob.create({
        data: {
          userId: testUserId,
          jobId: testJob.id,
        },
      });

      const savedJob = await prisma.savedJob.findFirst({
        where: {
          userId: testUserId,
          jobId: testJob.id,
        },
        include: {
          job: true,
          user: true,
        },
      });

      expect(savedJob).toBeTruthy();
      expect(savedJob?.job.title).toBe('Test Job');
      expect(savedJob?.user.name).toBe(testUser.name);
    });

    it('should delete a saved job', async () => {
      const savedJob = await prisma.savedJob.create({
        data: {
          userId: testUserId,
          jobId: testJob.id,
        },
      });

      await prisma.savedJob.delete({
        where: {
          id: savedJob.id,
        },
      });

      const deletedSavedJob = await prisma.savedJob.findFirst({
        where: {
          userId: testUserId,
          jobId: testJob.id,
        },
      });

      expect(deletedSavedJob).toBeNull();
    });
  });

  describe('Relationships', () => {
    let savedJobId: string;

    beforeEach(async () => {
      console.log('Creating saved job for relationship tests with:', { userId: testUserId, jobId: testJob?.id });
      const savedJob = await prisma.savedJob.create({
        data: {
          userId: testUserId,
          jobId: testJob.id,
        },
      });
      savedJobId = savedJob.id;
      console.log('Saved job created:', savedJobId);
    });

    it('should be accessible through user relationship', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        include: { savedJobs: true },
      });

      expect(user?.savedJobs).toHaveLength(1);
      expect(user?.savedJobs[0].jobId).toBe(testJob.id);
    });

    it('should be accessible through job relationship', async () => {
      const job = await prisma.job.findUnique({
        where: { id: testJob.id },
        include: { savedBy: true },
      });

      expect(job?.savedBy).toHaveLength(1);
      expect(job?.savedBy[0].userId).toBe(testUserId);
    });

    it('should be deleted when user is deleted', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: 'temp@example.com',
          name: 'Temp User',
          password: 'password123',
          role: Role.DEVELOPER,
        },
      });

      await prisma.savedJob.create({
        data: {
          userId: newUser.id,
          jobId: testJob.id,
        },
      });

      await prisma.user.delete({
        where: { id: newUser.id },
      });

      const savedJobs = await prisma.savedJob.findMany({
        where: { userId: newUser.id },
      });

      expect(savedJobs).toHaveLength(0);
    });

    it('should be deleted when job is deleted', async () => {
      const newJob = await prisma.job.create({
        data: {
          title: 'Temp Job',
          description: 'A temporary job position',
          location: 'Test Location',
          type: JobType.FULL_TIME,
          salaryMin: 50000.0,
          salaryMax: 100000.0,
          currency: 'USD',
          companyId: testCompanyId,
          userId: testRecruiterId,
          categoryId: testCategoryId,
          remote: false,
        },
      });

      await prisma.savedJob.create({
        data: {
          userId: testUserId,
          jobId: newJob.id,
        },
      });

      await prisma.job.delete({
        where: { id: newJob.id },
      });

      const savedJobs = await prisma.savedJob.findMany({
        where: { jobId: newJob.id },
      });

      expect(savedJobs).toHaveLength(0);
    });
  });

  describe('Querying', () => {
    beforeEach(async () => {
      console.log('Creating saved job for query tests with:', { userId: testUserId, jobId: testJob?.id });
      await prisma.savedJob.create({
        data: {
          userId: testUserId,
          jobId: testJob.id,
        },
      });
    });

    it('should find all saved jobs for a user', async () => {
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId: testUserId },
        include: { job: true },
      });

      expect(savedJobs).toHaveLength(1);
      expect(savedJobs[0].job.title).toBe('Test Job');
    });

    it('should find all users who saved a job', async () => {
      const jobSaves = await prisma.savedJob.findMany({
        where: { jobId: testJob.id },
        include: { user: true },
      });

      expect(jobSaves).toHaveLength(1);
      expect(jobSaves[0].user.name).toBe(testUser.name);
    });
  });
});