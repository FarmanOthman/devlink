import { prisma } from '../setup';
import { Role, JobType, SkillLevel } from '@prisma/client';

describe('Skill Model', () => {
  const testSkill = {
    name: `JavaScript ${Date.now()}`,
  };

  const testUser = {
    name: 'Test Developer',
    email: `dev_${Date.now()}@example.com`,
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

  describe('Basic CRUD', () => {
    it('should create a skill', async () => {
      const skill = await prisma.skill.create({
        data: testSkill,
      });

      expect(skill).toHaveProperty('id');
      expect(skill.name).toBe(testSkill.name);
    });

    it('should enforce unique skill names', async () => {
      await prisma.skill.create({
        data: testSkill,
      });

      await expect(
        prisma.skill.create({
          data: testSkill,
        })
      ).rejects.toThrow();
    });

    it('should read a skill', async () => {
      const skill = await prisma.skill.create({
        data: {
          name: `Test Skill ${Date.now()}`,
        },
      });

      const foundSkill = await prisma.skill.findUnique({
        where: { id: skill.id },
      });

      expect(foundSkill).not.toBeNull();
      expect(foundSkill?.name).toBe(skill.name);
    });

    it('should update a skill', async () => {
      const skill = await prisma.skill.create({
        data: {
          name: `Test Skill ${Date.now()}`,
        },
      });

      const newName = `Updated Skill ${Date.now()}`;
      const updatedSkill = await prisma.skill.update({
        where: { id: skill.id },
        data: { name: newName },
      });

      expect(updatedSkill.name).toBe(newName);
    });

    it('should delete a skill', async () => {
      const skill = await prisma.skill.create({
        data: {
          name: `Test Skill ${Date.now()}`,
        },
      });

      await prisma.skill.delete({
        where: { id: skill.id },
      });

      const deletedSkill = await prisma.skill.findUnique({
        where: { id: skill.id },
      });

      expect(deletedSkill).toBeNull();
    });
  });

  describe('Relationships', () => {
    it('should be associated with users through UserSkill', async () => {
      const skill = await prisma.skill.create({ data: testSkill });
      const user = await prisma.user.create({ data: testUser });

      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skill.id,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      const skillWithUsers = await prisma.skill.findUnique({
        where: { id: skill.id },
        include: {
          userSkills: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(skillWithUsers?.userSkills).toHaveLength(1);
      expect(skillWithUsers?.userSkills[0].user.name).toBe(testUser.name);
      expect(skillWithUsers?.userSkills[0].level).toBe(SkillLevel.INTERMEDIATE);
    });

    it('should be associated with jobs through JobSkill', async () => {
      const skill = await prisma.skill.create({ data: testSkill });
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

      await prisma.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: skill.id,
          level: SkillLevel.EXPERT,
        },
      });

      const skillWithJobs = await prisma.skill.findUnique({
        where: { id: skill.id },
        include: {
          jobSkills: {
            include: {
              job: true,
            },
          },
        },
      });

      expect(skillWithJobs?.jobSkills).toHaveLength(1);
      expect(skillWithJobs?.jobSkills[0].job.title).toBe(testJob.title);
      expect(skillWithJobs?.jobSkills[0].level).toBe(SkillLevel.EXPERT);
    });

    it('should cascade delete associated UserSkills when skill is deleted', async () => {
      const skill = await prisma.skill.create({ data: testSkill });
      const user = await prisma.user.create({ data: testUser });

      const userSkill = await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skill.id,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      await prisma.skill.delete({
        where: { id: skill.id },
      });

      const deletedUserSkill = await prisma.userSkill.findUnique({
        where: { id: userSkill.id },
      });

      expect(deletedUserSkill).toBeNull();
    });

    it('should cascade delete associated JobSkills when skill is deleted', async () => {
      const skill = await prisma.skill.create({ data: testSkill });
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

      const jobSkill = await prisma.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: skill.id,
          level: SkillLevel.EXPERT,
        },
      });

      await prisma.skill.delete({
        where: { id: skill.id },
      });

      const deletedJobSkill = await prisma.jobSkill.findUnique({
        where: { id: jobSkill.id },
      });

      expect(deletedJobSkill).toBeNull();
    });
  });

  describe('Multiple Associations', () => {
    it('should handle multiple users with different skill levels', async () => {
      const skill = await prisma.skill.create({ data: testSkill });
      const user1 = await prisma.user.create({
        data: {
          ...testUser,
          email: `dev1_${Date.now()}@example.com`,
        },
      });
      const user2 = await prisma.user.create({
        data: {
          ...testUser,
          email: `dev2_${Date.now()}@example.com`,
        },
      });

      await Promise.all([
        prisma.userSkill.create({
          data: {
            userId: user1.id,
            skillId: skill.id,
            level: SkillLevel.EXPERT,
          },
        }),
        prisma.userSkill.create({
          data: {
            userId: user2.id,
            skillId: skill.id,
            level: SkillLevel.BEGINNER,
          },
        }),
      ]);

      const skillWithUsers = await prisma.skill.findUnique({
        where: { id: skill.id },
        include: {
          userSkills: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(skillWithUsers?.userSkills).toHaveLength(2);
      expect(skillWithUsers?.userSkills.map(us => us.level)).toContain(SkillLevel.EXPERT);
      expect(skillWithUsers?.userSkills.map(us => us.level)).toContain(SkillLevel.BEGINNER);
    });

    it('should handle multiple jobs with different required skill levels', async () => {
      const skill = await prisma.skill.create({ data: testSkill });
      const company = await prisma.company.create({ data: testCompany });
      const recruiter = await prisma.user.create({
        data: {
          ...testRecruiter,
          companyId: company.id,
        },
      });
      const category = await prisma.jobCategory.create({ data: testCategory });

      const job1 = await prisma.job.create({
        data: {
          ...testJob,
          title: 'Senior Position',
          userId: recruiter.id,
          companyId: company.id,
          categoryId: category.id,
        },
      });

      const job2 = await prisma.job.create({
        data: {
          ...testJob,
          title: 'Junior Position',
          userId: recruiter.id,
          companyId: company.id,
          categoryId: category.id,
        },
      });

      await Promise.all([
        prisma.jobSkill.create({
          data: {
            jobId: job1.id,
            skillId: skill.id,
            level: SkillLevel.EXPERT,
          },
        }),
        prisma.jobSkill.create({
          data: {
            jobId: job2.id,
            skillId: skill.id,
            level: SkillLevel.BEGINNER,
          },
        }),
      ]);

      const skillWithJobs = await prisma.skill.findUnique({
        where: { id: skill.id },
        include: {
          jobSkills: {
            include: {
              job: true,
            },
          },
        },
      });

      expect(skillWithJobs?.jobSkills).toHaveLength(2);
      expect(skillWithJobs?.jobSkills.map(js => js.level)).toContain(SkillLevel.EXPERT);
      expect(skillWithJobs?.jobSkills.map(js => js.level)).toContain(SkillLevel.BEGINNER);
    });
  });
});