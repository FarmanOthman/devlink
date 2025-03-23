/**
 * User Skill Controller
 * 
 * Handles operations for user skills.
 * There is a many-to-many relationship between users and skills through the UserSkill junction table:
 * - One user can have multiple skills
 * - One skill can be associated with multiple users
 * This allows for tracking and management of user skill profiles.
 */

// Re-export all userSkill controllers from the userSkill directory
export * from '../userSkill';
