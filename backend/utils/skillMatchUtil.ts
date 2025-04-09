import { Job, UserSkill, JobSkill } from '@prisma/client';

type SkillWithDetails = {
  skill: {
    id: string;
    name: string;
  };
  level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
};

type JobWithSkills = Job & {
  skills: (JobSkill & {
    skill: {
      id: string;
      name: string;
    };
  })[];
};

type UserSkillWithDetails = UserSkill & {
  skill: {
    id: string;
    name: string;
  };
};

export async function calculateSkillMatch(
  job: JobWithSkills,
  userSkills: UserSkillWithDetails[]
): Promise<number> {
  if (!job.skills.length || !userSkills.length) {
    return 0;
  }

  // Create maps for faster lookup
  const jobSkillMap = new Map(
    job.skills.map(skill => [skill.skill.id, skill.level])
  );

  const userSkillMap = new Map(
    userSkills.map(skill => [skill.skill.id, skill.level])
  );

  let totalScore = 0;
  let maxPossibleScore = job.skills.length * 3; // 3 is max score per skill (EXPERT level)

  // For each required job skill
  for (const jobSkill of job.skills) {
    const skillId = jobSkill.skill.id;
    const requiredLevel = jobSkill.level;
    const userLevel = userSkillMap.get(skillId);

    if (!userLevel) {
      continue; // User doesn't have this skill
    }

    // Calculate score based on skill level match
    const levelScore = calculateLevelScore(userLevel, requiredLevel);
    totalScore += levelScore;
  }

  // Normalize score to be between 0 and 1
  return totalScore / maxPossibleScore;
}

function calculateLevelScore(
  userLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT',
  requiredLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'
): number {
  const levels = {
    'BEGINNER': 1,
    'INTERMEDIATE': 2,
    'EXPERT': 3
  };

  const userScore = levels[userLevel];
  const requiredScore = levels[requiredLevel];

  // If user's level is higher than required, give full points
  if (userScore >= requiredScore) {
    return 3;
  }

  // Otherwise, give partial points based on how close they are
  return userScore;
} 