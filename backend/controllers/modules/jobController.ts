/**
 * Job Controller
 * 
 * Handles CRUD operations for jobs.
 * There are relationships between Job and other entities:
 * - Each job belongs to exactly one company (CompanyId is required)
 * - Each job is posted by one user (UserId is required)
 * - Jobs can have multiple skills associated with them
 */

// Re-export all job controllers from the job directory
export * from '../job';