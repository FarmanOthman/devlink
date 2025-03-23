/**
 * Job Category Controller
 * 
 * Handles CRUD operations for job categories.
 * There is a one-to-many relationship between JobCategory and Job:
 * - One category can be associated with multiple jobs
 * - Each job belongs to exactly one category
 * - CategoryId is required when creating a job (enforced in jobController)
 */

// Re-export all jobCategory controllers from the jobCategory directory
export * from '../jobCategory';
