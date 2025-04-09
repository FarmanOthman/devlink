/**
 * Company Controller
 * 
 * Handles CRUD operations for companies.
 * Companies have several important relationships:
 * - Each company can have multiple jobs posted
 * - Each company is associated with one or more users with RECRUITER role
 * - Companies can have profiles with details that help candidates evaluate opportunities
 */

// Re-export all company controllers from the company directory
export * from '../company';