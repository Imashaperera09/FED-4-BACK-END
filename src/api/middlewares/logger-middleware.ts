import { Request, Response, NextFunction } from "express";

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log method, url, and timestamp for better debugging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};
