import { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

// Inline error classes if not defined elsewhere
class ForbiddenError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
  }
}
class UnauthorizedError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}
// Inline type if not defined elsewhere
interface UserPublicMetadata {
  role?: string;
  [key: string]: any;
}

export const authorizationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return next(new UnauthorizedError("Unauthorized"));
    }
    const publicMetadata = (auth.sessionClaims?.publicMetadata || auth.sessionClaims?.metadata) as UserPublicMetadata | undefined;
    if (!publicMetadata || publicMetadata.role !== "admin") {
      return next(new ForbiddenError("Forbidden"));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};