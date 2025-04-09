import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
  code?: string;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // Default error
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 400;
    message = 'A record with this value already exists';
  } else if (err.code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    message = 'Record not found';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.stack,
    }),
  });
};

export default errorHandler; 