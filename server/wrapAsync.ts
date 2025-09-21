import { NextFunction, Request, Response } from "express";

// Application error shape
export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: any;
  expose?: boolean; // if true always send message
}

export function createHttpError(
  status: number,
  code: string,
  message: string,
  details?: any,
  expose = true
): AppError {
  const err: AppError = new Error(message);
  err.status = status;
  err.code = code;
  err.details = details;
  err.expose = expose;
  return err;
}

// Generic async wrapper to reduce repetitive try/catch blocks.
export function wrapAsync<
  T extends (req: Request, res: Response, next: NextFunction) => any,
>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Central error handler middleware factory
export function createErrorMiddleware() {
  return function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const status = err.status && err.status >= 400 ? err.status : 500;
    const code = err.code || (status === 500 ? "INTERNAL_ERROR" : "ERROR");
    const body: any = {
      error: {
        code,
        message: err.expose
          ? err.message
          : status === 500
            ? "Internal Server Error"
            : err.message,
      },
    };
    if (err.details) body.error.details = err.details;
    if (status === 500 && process.env.NODE_ENV !== "production") {
      body.error.stack = err.stack;
    }
    res.status(status).json(body);
  };
}
