import { prisma } from '../setup';
import { Role, JobType, SkillLevel } from '@prisma/client';

describe('JobSkill Model', () => {
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

  const testSkill = {
    name: `JavaScript ${Date.now()}`,
  };

  let jobId: string;
  let skillId: string;

  beforeEach(async () => {
    const company = await prisma.company.create({ data: testCompany });
    const recruiter = await prisma.user.create({
      data: {
        ...testRecruiter,
        companyId: company.id,
      },
    });
    const category = await prisma.jobCategory.create({ data: testCategory });
    const job = await prisma.job.create({
      data: {
        ...testJob,
        userId: recruiter.id,
        companyId: company.id,
        categoryId: category.id,
      },
    });
    const skill = await prisma.skill.create({ data: testSkill });

    jobId = job.id;
    skillId = skill.id;
  });

  describe('Basic CRUD', () => {
    it('should create a job skill', async () => {
      const jobSkill = await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      expect(jobSkill).toHaveProperty('id');
      expect(jobSkill.jobId).toBe(jobId);
      expect(jobSkill.skillId).toBe(skillId);
      expect(jobSkill.level).toBe(SkillLevel.INTERMEDIATE);
    });

    it('should enforce unique job-skill combination', async () => {
      await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.BEGINNER,
        },
      });

      await expect(
        prisma.jobSkill.create({
          data: {
            jobId,
            skillId,
            level: SkillLevel.EXPERT,
          },
        })
      ).rejects.toThrow();
    });

    it('should read a job skill', async () => {
      const jobSkill = await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.EXPERT,
        },
      });

      const foundJobSkill = await prisma.jobSkill.findUnique({
        where: { id: jobSkill.id },
        include: {
          job: true,
          skill: true,
        },
      });

      expect(foundJobSkill).not.toBeNull();
      expect(foundJobSkill?.job.title).toBe(testJob.title);
      expect(foundJobSkill?.skill.name).toBe(testSkill.name);
      expect(foundJobSkill?.level).toBe(SkillLevel.EXPERT);
    });

    it('should update a job skill level', async () => {
      const jobSkill = await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.BEGINNER,
        },
      });

      const updatedJobSkill = await prisma.jobSkill.update({
        where: { id: jobSkill.id },
        data: { level: SkillLevel.EXPERT },
      });

      expect(updatedJobSkill.level).toBe(SkillLevel.EXPERT);
    });

    it('should delete a job skill', async () => {
      const jobSkill = await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      await prisma.jobSkill.delete({
        where: { id: jobSkill.id },
      });

      const deletedJobSkill = await prisma.jobSkill.findUnique({
        where: { id: jobSkill.id },
      });

      expect(deletedJobSkill).toBeNull();
    });
  });

  describe('Relationships', () => {
    it('should be accessible through job relationship', async () => {
      await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      const jobWithSkills = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      expect(jobWithSkills?.skills).toHaveLength(1);
      expect(jobWithSkills?.skills[0].level).toBe(SkillLevel.INTERMEDIATE);
      expect(jobWithSkills?.skills[0].skill.name).toBe(testSkill.name);
    });

    it('should be accessible through skill relationship', async () => {
      await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.EXPERT,
        },
      });

      const skillWithJobs = await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
          jobSkills: {
            include: {
              job: true,
            },
          },
        },
      });

      expect(skillWithJobs?.jobSkills).toHaveLength(1);
      expect(skillWithJobs?.jobSkills[0].level).toBe(SkillLevel.EXPERT);
      expect(skillWithJobs?.jobSkills[0].job.title).toBe(testJob.title);
    });

    it('should be deleted when job is deleted', async () => {
      const jobSkill = await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      await prisma.job.delete({
        where: { id: jobId },
      });

      const deletedJobSkill = await prisma.jobSkill.findUnique({
        where: { id: jobSkill.id },
      });

      expect(deletedJobSkill).toBeNull();
    });

    it('should be deleted when skill is deleted', async () => {
      const jobSkill = await prisma.jobSkill.create({
        data: {
          jobId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      await prisma.skill.delete({
        where: { id: skillId },
      });

      const deletedJobSkill = await prisma.jobSkill.findUnique({
        where: { id: jobSkill.id },
      });

      expect(deletedJobSkill).toBeNull();
    });
  });

  describe('Multiple Skills', () => {
    it('should allow a job to have multiple skills', async () => {
      const skill2 = await prisma.skill.create({
        data: { name: `TypeScript ${Date.now()}` },
      });

      await Promise.all([
        prisma.jobSkill.create({
          data: {
            jobId,
            skillId,
            level: SkillLevel.EXPERT,
          },
        }),
        prisma.jobSkill.create({
          data: {
            jobId,
            skillId: skill2.id,
            level: SkillLevel.INTERMEDIATE,
          },
        }),
      ]);

      const jobWithSkills = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          skills: true,
        },
      });

      expect(jobWithSkills?.skills).toHaveLength(2);
    });

    it('should allow a skill to be associated with multiple jobs', async () => {
      const job2 = await prisma.job.create({
        data: {
          ...testJob,
          title: 'Another Developer Position',
          userId: (await prisma.user.findFirst())!.id,
          companyId: (await prisma.company.findFirst())!.id,
          categoryId: (await prisma.jobCategory.findFirst())!.id,
        },
      });

      await Promise.all([
        prisma.jobSkill.create({
          data: {
            jobId,
            skillId,
            level: SkillLevel.EXPERT,
          },
        }),
        prisma.jobSkill.create({
          data: {
            jobId: job2.id,
            skillId,
            level: SkillLevel.BEGINNER,
          },
        }),
      ]);

      const skillWithJobs = await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
          jobSkills: true,
        },
      });

      expect(skillWithJobs?.jobSkills).toHaveLength(2);
    });
  });

  describe('Skill Levels', () => {
    it('should handle different skill levels', async () => {
      const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.EXPERT];
      const skills = await Promise.all(
        levels.map((level) =>
          prisma.jobSkill.create({
            data: {
              jobId,
              skillId: skillId,
              level,
            },
          }).catch(() => null) // Ignore unique constraint errors
        )
      );

      const validSkill = skills.find((skill) => skill !== null);
      expect(validSkill).not.toBeNull();
      expect(Object.values(SkillLevel)).toContain(validSkill?.level);
    });
  });
}); 