/**
 * User Controller
 * 
 * Handles CRUD operations for users.
 * User is a central entity with various relationships:
 * - Users can have different roles (Admin, Developer, Recruiter)
 * - Users can create and apply to jobs
 * - Users can have skills associated with them
 * - Users can have documents (resumes, etc.)
 * - Users can save jobs they're interested in
 */

// Re-export all user controllers from the users directory
export * from '../users';

export { getUsers } from '../users/getUsers';
export { getUserById } from '../users/getUserById';
export { updateUser } from '../users/updateUser';
export { deleteUser } from '../users/deleteUser';
export { updateUserRole } from '../users/updateUserRole';
export { logout } from '../users/logout';
export { loginUser } from '../users/loginUser';
export { createUser } from '../users/createUser';
export { forgotPassword } from '../users/forgotPassword';
export { resetPassword } from '../users/resetPassword';
