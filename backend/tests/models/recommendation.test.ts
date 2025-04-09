import { Role, JobType, SkillLevel, Job, User, UserSkill, JobSkill } from '@prisma/client';
import { prisma } from '../setup';
import { SortingService } from '../../services/sortingService';

// Define types for recommendation results
type JobWithScore = Job & { matchScore: number };
type UserWithScore = User & { matchScore: number };
type RecommendationResult<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

describe('Recommendation Engine', () => {
  const sortingService = new SortingService();

  // Test data
  const testSkills = [
    { name: 'JavaScript' },
    { name: 'Python' },
    { name: 'React' },
    { name: 'Node.js' },
  ];

  const testUser = {
    email: `test${Date.now()}@example.com`,
    name: 'Test Developer',
    password: 'password123',
    role: Role.DEVELOPER,
    location: 'New York',
    preferredJobType: JobType.FULL_TIME,
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

  let skills: any[] = [];
  let user: any;
  let recruiter: any;
  let company: any;
  let category: any;
  let jobs: any[] = [];

  beforeEach(async () => {
    try {
      console.log('Starting test setup...');

      // Create skills
      skills = await Promise.all(
        testSkills.map((skill: { name: string }) => prisma.skill.create({ data: skill }))
      );
      console.log('Created skills:', skills.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));

      // Create company
      company = await prisma.company.create({ data: testCompany });
      console.log('Created company:', { id: company.id, name: company.name });

      // Create category
      category = await prisma.jobCategory.create({ data: testCategory });
      console.log('Created category:', { id: category.id, name: category.name });

      // Create recruiter
      recruiter = await prisma.user.create({
        data: {
          ...testRecruiter,
          companyId: company.id,
        },
      });
      console.log('Created recruiter:', { id: recruiter.id, email: recruiter.email });

      // Create user with skills
      user = await prisma.user.create({
        data: {
          ...testUser,
          skills: {
            create: [
              { skillId: skills[0].id, level: SkillLevel.EXPERT }, // JavaScript
              { skillId: skills[1].id, level: SkillLevel.INTERMEDIATE }, // Python
              { skillId: skills[2].id, level: SkillLevel.BEGINNER }, // React
            ],
          },
        },
        include: {
          skills: {
            include: {
              skill: true
            }
          }
        }
      });
      console.log('Created user:', {
        id: user.id,
        email: user.email,
        skills: user.skills.map((s: { skillId: string; skill: { name: string }; level: SkillLevel }) => ({
          id: s.skillId,
          name: s.skill.name,
          level: s.level
        }))
      });

      // Create test jobs with different skill requirements
      const jobsData = [
        {
          // Perfect match job (same skills, location, and type)
          title: 'Perfect Match Job',
          description: 'Job matching all user preferences',
          location: 'New York',
          type: JobType.FULL_TIME,
          salaryMin: 80000.0,
          salaryMax: 120000.0,
          companyId: company.id,
          userId: recruiter.id,
          categoryId: category.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          skills: {
            create: [
              { skillId: skills[0].id, level: SkillLevel.EXPERT }, // JavaScript
              { skillId: skills[1].id, level: SkillLevel.INTERMEDIATE }, // Python
              { skillId: skills[2].id, level: SkillLevel.BEGINNER }, // React
            ],
          },
        },
        {
          // Partial skill match, different location
          title: 'Skill Match Job',
          description: 'Job matching skills but different location',
          location: 'San Francisco',
          type: JobType.FULL_TIME,
          salaryMin: 90000.0,
          salaryMax: 130000.0,
          companyId: company.id,
          userId: recruiter.id,
          categoryId: category.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          skills: {
            create: [
              { skillId: skills[0].id, level: SkillLevel.EXPERT }, // JavaScript
              { skillId: skills[1].id, level: SkillLevel.INTERMEDIATE }, // Python
            ],
          },
        },
        {
          // Different skills, same location
          title: 'Location Match Job',
          description: 'Job matching location but different skills',
          location: 'New York',
          type: JobType.PART_TIME,
          salaryMin: 70000.0,
          salaryMax: 100000.0,
          companyId: company.id,
          userId: recruiter.id,
          categoryId: category.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          skills: {
            create: [
              { skillId: skills[3].id, level: SkillLevel.EXPERT }, // Node.js
            ],
          },
        },
      ];

      jobs = await Promise.all(
        jobsData.map(job => prisma.job.create({
          data: job,
          include: {
            skills: {
              include: {
                skill: true
              }
            }
          }
        }))
      );
      console.log('Created jobs:', jobs.map(j => ({
        id: j.id,
        title: j.title,
        skills: j.skills.map((s: { skillId: string; skill: { name: string }; level: SkillLevel }) => ({
          id: s.skillId,
          name: s.skill.name,
          level: s.level
        }))
      })));

      console.log('Test setup completed successfully.');
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  describe('Job Recommendations', () => {
    it('should recommend jobs based on skill match, location, and job type', async () => {
      const recommendations = await sortingService.getRecommendedJobs(user.id) as RecommendationResult<JobWithScore>;
      const recommendedJobs = recommendations.data;

      console.log('User:', {
        id: user.id,
        skills: user.skills.map((s: UserSkill & { skill: { id: string; name: string } }) => ({
          id: s.skillId,
          name: s.skill.name,
          level: s.level
        })),
        location: user.location,
        preferredJobType: user.preferredJobType
      });

      console.log('Jobs:', jobs.map(j => ({
        id: j.id,
        title: j.title,
        skills: j.skills.map((s: JobSkill & { skill: { id: string; name: string } }) => ({
          id: s.skillId,
          name: s.skill.name,
          level: s.level
        })),
        location: j.location,
        type: j.type
      })));

      console.log('Recommended Jobs:', recommendedJobs.map(j => ({
        id: j.id,
        title: j.title,
        matchScore: j.matchScore
      })));

      // Perfect match job should be first
      expect(recommendedJobs[0].id).toBe(jobs[0].id);
      expect(recommendedJobs[0].matchScore).toBeGreaterThan(0.8); // High match score

      // Skill match job should be second (matches skills but not location)
      expect(recommendedJobs[1].id).toBe(jobs[1].id);
      expect(recommendedJobs[1].matchScore).toBeGreaterThan(0.5); // Medium match score

      // Location match job should be last (only matches location)
      expect(recommendedJobs[2].id).toBe(jobs[2].id);
      expect(recommendedJobs[2].matchScore).toBeLessThan(0.5); // Low match score
    });

    it('should handle pagination of recommended jobs', async () => {
      const page1 = await sortingService.getRecommendedJobs(user.id, 1, 2) as RecommendationResult<JobWithScore>;
      const page2 = await sortingService.getRecommendedJobs(user.id, 2, 2) as RecommendationResult<JobWithScore>;

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(1);
      expect(page1.pagination.total).toBe(3);
      expect(page1.pagination.totalPages).toBe(2);
    });
  });

  describe('Candidate Recommendations', () => {
    let otherUsers: any[] = [];

    beforeEach(async () => {
      // Create additional test users with varying skill levels
      const usersData = [
        {
          // Perfect skill match
          email: `perfect_match_${Date.now()}@example.com`,
          name: 'Perfect Match Dev',
          password: 'password123',
          role: Role.DEVELOPER,
          skills: {
            create: [
              { skillId: skills[0].id, level: SkillLevel.EXPERT }, // JavaScript
              { skillId: skills[1].id, level: SkillLevel.INTERMEDIATE }, // Python
              { skillId: skills[2].id, level: SkillLevel.BEGINNER }, // React
            ],
          },
        },
        {
          // Partial skill match
          email: `partial_match_${Date.now()}@example.com`,
          name: 'Partial Match Dev',
          password: 'password123',
          role: Role.DEVELOPER,
          skills: {
            create: [
              { skillId: skills[0].id, level: SkillLevel.EXPERT }, // JavaScript
              { skillId: skills[1].id, level: SkillLevel.BEGINNER }, // Python
            ],
          },
        },
        {
          // No skill match
          email: `no_match_${Date.now()}@example.com`,
          name: 'No Match Dev',
          password: 'password123',
          role: Role.DEVELOPER,
          skills: {
            create: [
              { skillId: skills[3].id, level: SkillLevel.BEGINNER }, // Node.js
            ],
          },
        },
      ];

      otherUsers = await Promise.all(
        usersData.map(userData => prisma.user.create({ data: userData }))
      );
    });

    it('should recommend candidates based on skill match scores', async () => {
      const recommendations = await sortingService.getRecommendedCandidates(jobs[0].id) as RecommendationResult<UserWithScore>;
      const candidates = recommendations.data;

      console.log('Recommended Candidates:', candidates.map(c => ({
        id: c.id,
        email: c.email,
        matchScore: c.matchScore
      })));

      // Perfect match developer should be first (excluding the test user)
      const perfectMatchDev = candidates.find(c => c.email.includes('perfect_match'));
      expect(perfectMatchDev).toBeDefined();
      if (perfectMatchDev) {
        expect(perfectMatchDev.matchScore).toBeGreaterThan(0.8);
      }

      // Partial match developer should be in the middle
      const partialMatchDev = candidates.find(c => c.email.includes('partial_match'));
      expect(partialMatchDev).toBeDefined();
      if (partialMatchDev) {
        expect(partialMatchDev.matchScore).toBeGreaterThan(0.3);
        expect(partialMatchDev.matchScore).toBeLessThan(0.8);
      }

      // No match developer should have lowest score
      const noMatchDev = candidates.find(c => c.email.includes('no_match'));
      expect(noMatchDev).toBeDefined();
      if (noMatchDev) {
        expect(noMatchDev.matchScore).toBeLessThan(0.3);
      }
    });

    it('should handle pagination of recommended candidates', async () => {
      const page1 = await sortingService.getRecommendedCandidates(jobs[0].id, 1, 2) as RecommendationResult<UserWithScore>;
      const page2 = await sortingService.getRecommendedCandidates(jobs[0].id, 2, 2) as RecommendationResult<UserWithScore>;

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2); // 4 candidates total (3 other users + original test user)
      expect(page1.pagination.total).toBe(4);
      expect(page1.pagination.totalPages).toBe(2);
    });
  });
}); 