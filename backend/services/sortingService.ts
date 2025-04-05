import { PrismaClient, Job, Application, Prisma } from '@prisma/client';
import { calculateSkillMatch } from '../utils/skillMatchUtil';

const prisma = new PrismaClient();

export type SortOption = 'date_posted' | 'salary' | 'skill_match';
export type SortOrder = 'asc' | 'desc';

interface SortParams {
  sortBy?: SortOption;
  order?: SortOrder;
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class SortingService {
  // Job sorting for developers
  async sortJobs(params: SortParams & { userId?: string }, filters: any = {}): Promise<PaginatedResponse<Job>> {
    const { 
      sortBy = 'date_posted', 
      order = 'desc', 
      userId,
      page = 1,
      limit = 10
    } = params;
    
    let orderBy: Prisma.JobOrderByWithRelationInput = {};
    let include: Prisma.JobInclude = {
      skills: {
        include: {
          skill: true
        }
      },
      company: true
    };

    // Calculate skip and take for pagination
    const skip = (page - 1) * limit;
    const take = limit;

    switch (sortBy) {
      case 'date_posted':
        orderBy.createdAt = order;
        break;
      case 'salary':
        orderBy.salaryMax = order;
        break;
      case 'skill_match':
        if (userId) {
          // Get user skills first
          const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true }
          });
          
          // Get all jobs for skill matching
          const jobs = await prisma.job.findMany({
            where: filters,
            include
          });

          // Calculate skill match for each job
          const jobsWithScore = await Promise.all(
            jobs.map(async (job) => {
              const score = await calculateSkillMatch(job, userSkills);
              return { ...job, skillMatchScore: score };
            })
          );

          // Sort by skill match score
          const sortedJobs = jobsWithScore.sort((a, b) => 
            order === 'desc' 
              ? b.skillMatchScore - a.skillMatchScore
              : a.skillMatchScore - b.skillMatchScore
          );

          // Calculate pagination
          const total = sortedJobs.length;
          const totalPages = Math.ceil(total / limit);
          const paginatedJobs = sortedJobs.slice(skip, skip + take);

          return {
            data: paginatedJobs,
            pagination: {
              total,
              page,
              limit,
              totalPages
            }
          };
        }
        // Fallback to date sorting if no userId provided
        orderBy.createdAt = 'desc';
        break;
    }

    // If not skill_match sorting, use regular prisma sorting with pagination
    if (sortBy !== 'skill_match' || !userId) {
      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where: filters,
          orderBy,
          include,
          skip,
          take
        }),
        prisma.job.count({ where: filters })
      ]);

      return {
        data: jobs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }
  }

  // Application sorting for recruiters
  async sortApplications(params: SortParams & { jobId?: string }): Promise<PaginatedResponse<Application>> {
    const { 
      sortBy = 'date_posted', 
      order = 'desc', 
      jobId,
      page = 1,
      limit = 10
    } = params;
    
    let orderBy: Prisma.ApplicationOrderByWithRelationInput = {};
    let where: Prisma.ApplicationWhereInput = {};
    
    if (jobId) {
      where.jobId = jobId;
    }

    // Calculate skip and take for pagination
    const skip = (page - 1) * limit;
    const take = limit;

    switch (sortBy) {
      case 'date_posted':
        orderBy.createdAt = order;
        break;
      case 'skill_match':
        orderBy.skillMatchScore = order;
        break;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy,
        include: {
          user: {
            include: {
              skills: {
                include: {
                  skill: true
                }
              }
            }
          }
        },
        skip,
        take
      }),
      prisma.application.count({ where })
    ]);

    return {
      data: applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get recommended jobs for a developer
  async getRecommendedJobs(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Job>> {
    // Get user's skills and preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        applications: {
          include: {
            job: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get all active jobs
    const jobs = await prisma.job.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        },
        deletedAt: null
      },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        company: true
      }
    });

    // Calculate scores for each job
    const scoredJobs = await Promise.all(
      jobs.map(async (job) => {
        // Calculate skill match score (70%)
        const skillScore = await calculateSkillMatch(job, user.skills);

        // Calculate location match (20%)
        const locationScore = user.location && job.location
          ? user.location.toLowerCase() === job.location.toLowerCase() ? 1 : 0
          : 0;

        // Calculate salary match (10%)
        const salaryScore = user.preferredJobType === job.type ? 1 : 0;

        // Calculate final weighted score
        const finalScore = (skillScore * 0.7) + (locationScore * 0.2) + (salaryScore * 0.1);

        return {
          ...job,
          matchScore: finalScore
        };
      })
    );

    // Sort by score
    const sortedJobs = scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = sortedJobs.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedJobs = sortedJobs.slice(skip, skip + limit);

    return {
      data: paginatedJobs,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  // Get recommended candidates for a job
  async getRecommendedCandidates(jobId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Get all developers
    const developers = await prisma.user.findMany({
      where: {
        role: 'DEVELOPER'
      },
      include: {
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    // Calculate match scores for each developer
    const scoredCandidates = await Promise.all(
      developers.map(async (developer) => {
        const skillScore = await calculateSkillMatch(job, developer.skills);
        return {
          ...developer,
          matchScore: skillScore
        };
      })
    );

    // Sort by score
    const sortedCandidates = scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = sortedCandidates.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedCandidates = sortedCandidates.slice(skip, skip + limit);

    return {
      data: paginatedCandidates,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }
} 