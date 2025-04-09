/**
 * SavedJob Controller
 * 
 * Handles operations for user-saved jobs.
 * SavedJob represents a many-to-many relationship:
 * - Each user can save multiple jobs
 * - Each job can be saved by multiple users
 * - This functionality helps users bookmark jobs they're interested in
 */

// Re-export all savedJob controllers from the savedJob directory
export * from '../savedJob'; 