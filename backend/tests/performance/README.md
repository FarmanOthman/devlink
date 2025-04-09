# Performance Testing Suite

This directory contains performance tests for the DevLink application. These tests are designed to ensure the application performs well under load and with large datasets.

## Test Categories

The performance tests are divided into two main categories:

1. **API Performance Tests** (`api.performance.test.ts`)
   - Tests API response times (target: < 200ms)
   - Tests handling of large datasets via API endpoints
   - Tests pagination, filtering, and search performance

2. **Database Performance Tests** (`database.performance.test.ts`)
   - Tests database operations with large datasets
   - Tests complex queries, joins, and aggregations
   - Tests batch operations and transaction performance

## Running the Tests

To run the performance tests, use the following command:

```bash
npm run test:performance
```

This will execute all tests in the `tests/performance` directory.

## Configuring Tests

Performance thresholds and test parameters can be adjusted in the test files:

- `RESPONSE_TIME_THRESHOLD`: Target maximum response time for API endpoints (default: 200ms)
- `BATCH_SIZE`: Number of records to create for large dataset testing (default: 100)

## Interpreting Results

The tests output timing information to the console. Look for:

1. Response times for API endpoints
2. Execution times for database operations
3. Average times for batch operations

A successful test run means all operations completed within their respective time thresholds.

## Best Practices

When implementing new features, consider running these performance tests to ensure your changes don't negatively impact application performance.

Common performance issues to watch for:

1. N+1 query problems
2. Missing database indexes
3. Inefficient joins or queries
4. Memory leaks
5. Slow response times

## Extending the Test Suite

When adding new features to the application, consider adding performance tests for:

1. New API endpoints
2. New database operations
3. Operations that might be slow with large datasets
4. Operations that are expected to be frequently used

Follow the existing patterns in the test files to maintain consistency. 