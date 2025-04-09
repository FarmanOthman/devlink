/**
 * Document Controller
 * 
 * Handles CRUD operations for user documents.
 * Documents have these key relationships:
 * - Each document belongs to exactly one user (UserId is required)
 * - Documents can be attached to job applications
 * - Documents have different types (resume, cover letter, certificates, etc.)
 * - Documents can be shared with employers during the application process
 */

// Re-export all document controllers from the document directory
export * from '../document';
