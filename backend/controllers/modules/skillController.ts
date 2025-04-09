/**
 * Skill Controller
 * 
 * Handles CRUD operations for skills.
 * Skills can be associated with both jobs and users:
 * - Users can have multiple skills (UserSkill)
 * - Jobs can require multiple skills (JobSkill)
 */

// Re-export all skill controllers from the skill directory
export * from '../skill'; 