# Controllers Structure

This directory contains all the controller files for the DevLink API. The controllers are organized in a modular pattern to improve code organization, maintainability, and testability.

## Directory Structure

```
controllers/
├── utils/                  # Shared utility functions for controllers
│   ├── errorHandlers.ts    # Error handling utilities
│   ├── validators.ts       # Input validation utilities
│   └── index.ts            # Re-exports all utilities
├── templates/              # Templates for new controllers
│   └── controllerTemplate.ts  # Standard template for new controller methods
├── modules/                # Directory containing all controller barrel files
│   ├── userController.ts   # User controller barrel file
│   ├── jobController.ts    # Job controller barrel file
│   └── ...                 # Other controller barrel files
├── <resource>/             # Directory for each resource (e.g., users, job)
│   ├── index.ts            # Re-exports all controllers for this resource
│   ├── create<Resource>.ts # Create operation
│   ├── get<Resources>.ts   # List operation
│   ├── get<Resource>ById.ts # Read operation
│   ├── update<Resource>.ts  # Update operation
│   ├── delete<Resource>.ts  # Delete operation
│   └── ...                  # Other specialized operations
└── index.ts                # Main controller index that re-exports from modules
```

## Naming Conventions

- **Directory names**: Use the exact resource name (e.g., `users`, `job`, `notification`)
- **File names**: Use consistent naming with these prefixes:
  - `create<Resource>.ts` for create operations
  - `get<Resources>.ts` for list operations
  - `get<Resource>ById.ts` for get by ID operations
  - `update<Resource>.ts` for update operations
  - `delete<Resource>.ts` for delete operations
- **Controller methods**: Use camelCase with the same prefixes as the filenames
- **Module controller files**: Use camelCase and end with `Controller.ts` (e.g., `userController.ts`)

## Controller Structure

Each controller file should follow this structure:

1. **Imports**: Import necessary dependencies and shared utilities
2. **JSDoc**: Add a clear JSDoc comment explaining the controller's purpose
3. **Controller method**: Define and export an async function with Promise<void> return type
4. **Try/Catch block**: Wrap all logic in a try/catch to handle errors
5. **Input validation**: Validate all input data
6. **Business Logic**: Implement the core functionality
7. **Response**: Return standardized HTTP responses with consistent format
8. **Error Handling**: Use the shared error handling utilities

## Standard Response Format

For successful responses:
```typescript
{
  success: true,
  data: { /* response data */ }
}
```

For error responses:
```typescript
{
  success: false,
  error: {
    code: ErrorCodes.SOME_ERROR_CODE,
    message: 'Human readable error message'
  }
}
```

## Best Practices

1. **Use shared utilities**: Leverage the utilities in the `utils` directory for common tasks
2. **Consistent error handling**: Use the `handleApiError` utility to ensure consistent error responses
3. **Validation**: Use the validation utilities to validate input data
4. **Single responsibility**: Each controller file should handle one specific operation
5. **Type safety**: Use TypeScript types and interfaces for input/output data
6. **Use appropriate HTTP status codes** for all responses

## Creating New Controllers

1. Copy the template from `templates/controllerTemplate.ts`
2. Create a new file in the appropriate resource directory
3. Customize the controller logic following the standardized structure
4. Export the controller from the resource's `index.ts`
5. Re-export from the root controller file 