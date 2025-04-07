import { Request, Response, NextFunction } from 'express';

/**
 * Custom error interface extending the base Error class
 * Adds an optional status code for HTTP responses
 */
export interface AppError extends Error {
  /** HTTP status code for the error response */
  status?: number;
}

/**
 * Global error handling middleware
 * Handles all errors thrown in the application and sends appropriate responses
 * 
 * @param err - The error object containing message and optional status
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error for debugging
  console.error(err);

  // Send error response with appropriate status code and message
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
};