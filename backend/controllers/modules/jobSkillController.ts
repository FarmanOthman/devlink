/**
 * Job Skill Controller
 * 
 * Handles operations for job skills.
 * There is a many-to-many relationship between jobs and skills through the JobSkill junction table:
 * - One job can have multiple skills
 * - One skill can be associated with multiple jobs
 */

// Re-export all jobSkill controllers from the jobSkill directory
export * from '../jobSkill';
