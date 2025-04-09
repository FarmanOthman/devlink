# DevLink API Testing with Postman

This guide provides step-by-step instructions for testing the DevLink API user routes using Postman.

## Setup

1. Import the following files into Postman:
   - `DevLinkUserRoutes.postman_collection.json` - Contains all the API requests
   - `DevLink.postman_environment.json` - Contains environment variables

2. Ensure your DevLink backend server is running on port 5000 (or update the port in the environment variables if different)

## Key Features

- **Multi-Tab Support**: Token management works across different Postman tabs
- **CSRF Protection Bypass**: All requests include the `x-skip-csrf-check: true` header for development testing
- **Automatic Token Extraction**: The collection automatically extracts and stores the access token from login responses
- **Response Logging**: The test scripts include console logging to help debug token extraction issues
- **Dual Token Storage**: Tokens are stored in both environment and collection variables for better persistence
- **Pre-Request Validation**: Each request validates token availability before sending
- **Error Handling**: Special handling for common errors like user deletion issues

## Testing Flow

Follow these steps to test all user routes:

### 1. Public Routes

#### Register a User
1. Open the "Register User" request
2. The request body contains sample user data - modify if needed
3. Send the request
4. A successful response will return status code 201 and automatically save the new user ID to the environment variables

#### Login
1. Open the "Login User" request
2. Ensure the email and password match what you used in registration
3. Send the request
4. A successful response will return status code 200 and automatically save:
   - The access token to both environment and collection variables
   - The user ID to both environment and collection variables
5. To verify token extraction worked, check the Postman Console (View > Show Postman Console)

### 2. Authenticated Routes

All these routes require the access token obtained from login. You can now open these requests in separate tabs and they will all work properly with the stored token:

#### Get All Users
1. Send the request
2. Should return a list of all users in the system

#### Get User by ID
1. The request uses `{{userId}}` from your environment/collection variables
2. Send the request
3. Should return details for the specific user

#### Update User
1. The request uses `{{userId}}` from your environment/collection variables
2. Modify the request body with the fields you want to update
3. Send the request
4. Should return the updated user object

#### Cleanup User Data (Before Delete)
1. This special request helps resolve the "Failed to delete user" validation error
2. It attempts to delete all related user data (skills, applications, etc.)
3. Use this request before trying to delete a user if you're getting errors

#### Delete User
1. The request uses `{{userId}}` from your environment/collection variables
2. Send the request
3. Should return a success message
4. **If you get a "VALIDATION_ERROR" with message "Failed to delete user"**:
   - This happens because the user has related records in the database
   - Run the "Cleanup User Data (Before Delete)" request first
   - Then try deleting the user again

#### Update User Role
1. The request uses `{{userId}}` from your environment/collection variables
2. The body contains `{"role": "RECRUITER"}` - you can change this to any valid role
3. Send the request
4. Note: This requires ADMIN privileges

#### Logout
1. Send the request
2. Should return a success message
3. After this, your access token will be automatically cleared

## Troubleshooting Common Errors

### "Failed to delete user" Error

If you encounter this error when trying to delete a user:

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Failed to delete user"
    }
}
```

This happens because:
1. The user has related records in other tables (skills, applications, etc.)
2. These related records must be deleted first due to database foreign key constraints

**Solution:**
1. Use the "Cleanup User Data (Before Delete)" request to remove all related data
2. Then try the "Delete User" request again
3. If the cleanup endpoint doesn't exist in your API, you'll need to:
   - Manually delete all user skills, applications, documents, etc.
   - Or implement the cleanup endpoint in your backend

## How Token Management Works

The collection implements a robust token management system:

1. **Dual Storage Strategy**:
   - Tokens are stored in both environment variables (for the current session) and collection variables (persists across sessions)
   - Each request checks both locations and uses whichever token is available

2. **Pre-Request Validation**:
   - Before each authenticated request, a pre-request script checks for token availability
   - If no token is found, a warning is logged to the console

3. **Automatic Token Cleanup**:
   - The Logout request automatically clears tokens from both locations
   - This ensures proper session termination

## Additional Notes

- The collection includes automatic tests to verify response status codes
- If you're testing the "admin-only" features, you'll need to login with an admin account
- For testing user-specific features, the ownership middleware ensures users can only modify their own data

## Response Status Codes

- 200: Success
- 201: Created successfully
- 400: Bad request (invalid data)
- 401: Unauthorized (not logged in)
- 403: Forbidden (insufficient privileges)
- 404: Not found
- 409: Conflict (e.g., email already exists)
- 500: Server error 