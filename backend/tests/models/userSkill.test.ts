import { prisma } from '../setup';
import { Role, SkillLevel } from '@prisma/client';

describe('UserSkill Model', () => {
  const testUser = {
    name: 'Test Developer',
    email: `dev_${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role: Role.DEVELOPER,
  };

  const testSkill = {
    name: `JavaScript ${Date.now()}`,
  };

  let userId: string;
  let skillId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({ data: testUser });
    const skill = await prisma.skill.create({ data: testSkill });

    userId = user.id;
    skillId = skill.id;
  });

  describe('Basic CRUD', () => {
    it('should create a user skill', async () => {
      const userSkill = await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      expect(userSkill).toHaveProperty('id');
      expect(userSkill.userId).toBe(userId);
      expect(userSkill.skillId).toBe(skillId);
      expect(userSkill.level).toBe(SkillLevel.INTERMEDIATE);
    });

    it('should enforce unique user-skill combination', async () => {
      await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.BEGINNER,
        },
      });

      await expect(
        prisma.userSkill.create({
          data: {
            userId,
            skillId,
            level: SkillLevel.EXPERT,
          },
        })
      ).rejects.toThrow();
    });

    it('should read a user skill', async () => {
      const userSkill = await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.EXPERT,
        },
      });

      const foundUserSkill = await prisma.userSkill.findUnique({
        where: { id: userSkill.id },
        include: {
          user: true,
          skill: true,
        },
      });

      expect(foundUserSkill).not.toBeNull();
      expect(foundUserSkill?.user.name).toBe(testUser.name);
      expect(foundUserSkill?.skill.name).toBe(testSkill.name);
      expect(foundUserSkill?.level).toBe(SkillLevel.EXPERT);
    });

    it('should update a user skill level', async () => {
      const userSkill = await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.BEGINNER,
        },
      });

      const updatedUserSkill = await prisma.userSkill.update({
        where: { id: userSkill.id },
        data: { level: SkillLevel.EXPERT },
      });

      expect(updatedUserSkill.level).toBe(SkillLevel.EXPERT);
    });

    it('should delete a user skill', async () => {
      const userSkill = await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      await prisma.userSkill.delete({
        where: { id: userSkill.id },
      });

      const deletedUserSkill = await prisma.userSkill.findUnique({
        where: { id: userSkill.id },
      });

      expect(deletedUserSkill).toBeNull();
    });
  });

  describe('Relationships', () => {
    it('should be accessible through user relationship', async () => {
      await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      const userWithSkills = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      expect(userWithSkills?.skills).toHaveLength(1);
      expect(userWithSkills?.skills[0].level).toBe(SkillLevel.INTERMEDIATE);
      expect(userWithSkills?.skills[0].skill.name).toBe(testSkill.name);
    });

    it('should be accessible through skill relationship', async () => {
      await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.EXPERT,
        },
      });

      const skillWithUsers = await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
          userSkills: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(skillWithUsers?.userSkills).toHaveLength(1);
      expect(skillWithUsers?.userSkills[0].level).toBe(SkillLevel.EXPERT);
      expect(skillWithUsers?.userSkills[0].user.name).toBe(testUser.name);
    });

    it('should be deleted when user is deleted', async () => {
      const userSkill = await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      await prisma.user.delete({
        where: { id: userId },
      });

      const deletedUserSkill = await prisma.userSkill.findUnique({
        where: { id: userSkill.id },
      });

      expect(deletedUserSkill).toBeNull();
    });

    it('should be deleted when skill is deleted', async () => {
      const userSkill = await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: SkillLevel.INTERMEDIATE,
        },
      });

      await prisma.skill.delete({
        where: { id: skillId },
      });

      const deletedUserSkill = await prisma.userSkill.findUnique({
        where: { id: userSkill.id },
      });

      expect(deletedUserSkill).toBeNull();
    });
  });

  describe('Multiple Skills', () => {
    it('should allow a user to have multiple skills', async () => {
      const skill2 = await prisma.skill.create({
        data: { name: `TypeScript ${Date.now()}` },
      });

      await Promise.all([
        prisma.userSkill.create({
          data: {
            userId,
            skillId,
            level: SkillLevel.EXPERT,
          },
        }),
        prisma.userSkill.create({
          data: {
            userId,
            skillId: skill2.id,
            level: SkillLevel.INTERMEDIATE,
          },
        }),
      ]);

      const userWithSkills = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          skills: true,
        },
      });

      expect(userWithSkills?.skills).toHaveLength(2);
    });

    it('should allow a skill to be associated with multiple users', async () => {
      const user2 = await prisma.user.create({
        data: {
          ...testUser,
          email: `dev2_${Date.now()}@example.com`,
        },
      });

      await Promise.all([
        prisma.userSkill.create({
          data: {
            userId,
            skillId,
            level: SkillLevel.EXPERT,
          },
        }),
        prisma.userSkill.create({
          data: {
            userId: user2.id,
            skillId,
            level: SkillLevel.BEGINNER,
          },
        }),
      ]);

      const skillWithUsers = await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
          userSkills: true,
        },
      });

      expect(skillWithUsers?.userSkills).toHaveLength(2);
    });
  });

  describe('Skill Levels', () => {
    it('should handle different skill levels', async () => {
      const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.EXPERT];
      const skills = await Promise.all(
        levels.map((level) =>
          prisma.userSkill.create({
            data: {
              userId,
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