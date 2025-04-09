/**
 * Application Controller
 * 
 * Handles CRUD operations for job applications.
 * There are relationships between Application and other entities:
 * - Each application belongs to exactly one user (UserId is required)
 * - Each application is for exactly one job (JobId is required)
 * - Applications can have multiple documents attached to them
 * - Application status can be tracked and updated
 */

// Re-export all application controllers from the application directory
export * from '../application';