import { prisma } from '../setup';
import { Role, ApplicationStatus, JobType } from '@prisma/client';

describe('Application Model', () => {
  const testDeveloper = {
    name: 'Test Developer',
    email: `developer_${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role: Role.DEVELOPER,
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

  const testCategory = {
    name: `Software Development ${Date.now()}`,
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

  let developerId: string;
  let recruiterId: string;
  let companyId: string;
  let categoryId: string;
  let jobId: string;

  beforeEach(async () => {
    const company = await prisma.company.create({ data: testCompany });
    const developer = await prisma.user.create({ 
      data: {
        ...testDeveloper,
        email: `developer_${Date.now()}@example.com`,
      }
    });
    const recruiter = await prisma.user.create({ 
      data: {
        ...testRecruiter,
        email: `recruiter_${Date.now()}@example.com`,
        companyId: company.id
      }
    });
    const category = await prisma.jobCategory.create({ data: testCategory });
    
    developerId = developer.id;
    recruiterId = recruiter.id;
    companyId = company.id;
    categoryId = category.id;

    const job = await prisma.job.create({
      data: {
        ...testJob,
        userId: recruiterId,
        companyId,
        categoryId,
      },
    });
    
    jobId = job.id;
  });

  it('should create a new application', async () => {
    const application = await prisma.application.create({
      data: {
        userId: developerId,
        jobId,
        resumeUrl: 'https://example.com/resume.pdf',
        coverLetter: 'I am interested in this position',
      },
    });

    expect(application).toHaveProperty('id');
    expect(application.status).toBe(ApplicationStatus.PENDING);
    expect(application.userId).toBe(developerId);
    expect(application.jobId).toBe(jobId);
  });

  it('should read an application with relationships', async () => {
    const application = await prisma.application.create({
      data: {
        userId: developerId,
        jobId,
        resumeUrl: 'https://example.com/resume.pdf',
      },
    });

    const foundApplication = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        user: true,
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    expect(foundApplication).not.toBeNull();
    expect(foundApplication?.user.name).toBe(testDeveloper.name);
    expect(foundApplication?.job.title).toBe(testJob.title);
    expect(foundApplication?.job.company.name).toBe(testCompany.name);
  });

  it('should update application status', async () => {
    const application = await prisma.application.create({
      data: {
        userId: developerId,
        jobId,
        resumeUrl: 'https://example.com/resume.pdf',
      },
    });

    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.UNDER_REVIEW,
        recruiterId,
      },
    });

    expect(updatedApplication.status).toBe(ApplicationStatus.UNDER_REVIEW);
    expect(updatedApplication.recruiterId).toBe(recruiterId);
  });

  it('should delete an application', async () => {
    const application = await prisma.application.create({
      data: {
        userId: developerId,
        jobId,
        resumeUrl: 'https://example.com/resume.pdf',
      },
    });

    await prisma.application.delete({
      where: { id: application.id },
    });

    const deletedApplication = await prisma.application.findUnique({
      where: { id: application.id },
    });

    expect(deletedApplication).toBeNull();
  });

  it('should handle interview scheduling', async () => {
    const application = await prisma.application.create({
      data: {
        userId: developerId,
        jobId,
        resumeUrl: 'https://example.com/resume.pdf',
        recruiterId,
        status: ApplicationStatus.INTERVIEW_SCHEDULED,
        scheduledFor: new Date('2024-12-31T10:00:00Z'),
        interviewMessage: 'Please prepare for a technical interview',
      },
    });

    expect(application.status).toBe(ApplicationStatus.INTERVIEW_SCHEDULED);
    expect(application.scheduledFor).toEqual(new Date('2024-12-31T10:00:00Z'));
    expect(application.interviewMessage).toBe('Please prepare for a technical interview');
  });
}); 