# Controllers Documentation

This document provides an overview of all controllers in the backend application.

## Table of Contents

1. [User Controller](#user-controller)
2. [Job Controller](#job-controller)
3. [Company Controller](#company-controller)
4. [Application Controller](#application-controller)
5. [Education Controller](#education-controller)
6. [Experience Controller](#experience-controller)
7. [Message Controller](#message-controller)
8. [Saved Job Controller](#saved-job-controller)
9. [User Skill Controller](#user-skill-controller)
10. [Audit Log Controller](#audit-log-controller)
11. [Notification Controller](#notification-controller)
12. [Document Controller](#document-controller)
13. [Job Category Controller](#job-category-controller)
14. [Job Skill Controller](#job-skill-controller)
15. [Skill Controller](#skill-controller)

## User Controller

**File**: `controllers/userController.ts`

Manages user-related operations including authentication and profile management.

### Endpoints:

- **getUsers**: Retrieves all users in the system
- **createUser**: Registers a new user with validation for email and password
- **loginUser**: Authenticates users and generates JWT tokens
- **logout**: Handles user logout by invalidating tokens
- **updateUser**: Updates user profile information
- **deleteUser**: Removes a user from the system
- **getUserById**: Retrieves a specific user by ID
- **updateUserRole**: Changes a user's role (e.g., from DEVELOPER to ADMIN)

## Job Controller

**File**: `controllers/jobController.ts`

Manages job listings and related operations.

### Endpoints:

- **createJob**: Creates a new job listing with validation for required fields
- **getJobs**: Retrieves all job listings
- **getJobById**: Retrieves a specific job by ID
- **updateJob**: Updates job listing information
- **deleteJob**: Removes a job listing

## Company Controller

**File**: `controllers/companyController.ts`

Manages company profiles and information.

### Endpoints:

- Functions for creating, retrieving, updating, and deleting company records

## Application Controller

**File**: `controllers/applicationController.ts`

Handles job applications submitted by users and interview scheduling (merged functionality).

### Endpoints:

- **createApplication**: Creates a new job application
- **getApplications**: Retrieves all job applications
- **getApplicationById**: Retrieves a specific application by ID
- **updateApplication**: Updates application information
- **deleteApplication**: Removes an application (soft delete)
- **getUserApplications**: Retrieves all applications for a specific user
- **scheduleInterview**: Schedules an interview for an application
- **updateInterviewStatus**: Updates the status of an interview (ACCEPTED, DECLINED, etc.)
- **getInterviews**: Retrieves all interviews (applications with scheduled interviews)

## Education Controller

**File**: `controllers/educationController.ts`

Manages user education records.

### Endpoints:

- Functions for creating, retrieving, updating, and deleting education information

## Experience Controller

**File**: `controllers/experienceController.ts`

Manages user work experience records.

### Endpoints:

- Functions for creating, retrieving, updating, and deleting work experience information

## Message Controller

**File**: `controllers/messageController.ts`

Manages communication between users.

### Endpoints:

- Functions for sending, receiving, and managing messages

## Saved Job Controller

**File**: `controllers/savedJobController.ts`

Handles jobs saved by users for later viewing.

### Endpoints:

- **getSavedJobs**: Retrieves saved jobs with authorization rules
  - Developers can only see their own saved jobs
  - Admins can see all saved jobs or filter by user ID
- **getSavedJobById**: Retrieves a specific saved job by ID
  - Developers can only view their own saved jobs
  - Admins can view any saved job
  - Includes ownership verification
- **isJobSaved**: Checks if a specific job is already saved by the current user
  - Only available to developers
- **saveJob**: Saves a job for later viewing
  - Only developers can save jobs
- **unsaveJob**: Removes a saved job from the user's saved list
  - Developers can only remove their own saved jobs
  - Admins can remove any saved job
  - Includes ownership verification

## User Skill Controller

**File**: `controllers/userSkillController.ts`

Manages skills associated with user profiles.

### Endpoints:

- Functions for adding, removing, and managing skills on user profiles

## Audit Log Controller

**File**: `controllers/auditLogController.ts`

Handles system audit logging for tracking changes.

### Endpoints:

- Functions for creating, retrieving, and managing audit logs

## Notification Controller

**File**: `controllers/notificationController.ts`

Manages user notifications.

### Endpoints:

- Functions for creating, retrieving, and managing user notifications

## Document Controller

**File**: `controllers/documentController.ts`

Handles user document management with Firebase storage.

### Endpoints:

- **createOrUpdateDocument**: Creates or updates a document for a user (one-to-one relationship)
- **getDocuments**: Retrieves all documents (admin only)
- **getDocumentById**: Retrieves a document by ID
- **getDocumentByUserId**: Retrieves a document for a specific user
- **deleteDocument**: Removes a document

## Job Category Controller

**File**: `controllers/jobCategoryController.ts`

Manages job categories for classification.

### Endpoints:

- Functions for creating, retrieving, updating, and deleting job categories

## Job Skill Controller

**File**: `controllers/jobSkillController.ts`

Manages skills required for specific jobs.

### Endpoints:

- Functions for adding, removing, and managing skills associated with jobs

## Skill Controller

**File**: `controllers/skillContoller.ts`

Manages the master list of skills in the system.

### Endpoints:

- Functions for creating, retrieving, updating, and deleting skills 