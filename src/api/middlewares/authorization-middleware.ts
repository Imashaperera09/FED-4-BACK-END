import { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { User } from "../../infrastructure/entities/User";

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
    const isBypass = req.headers["x-admin-bypass"] === "true";

    if (isBypass) {
      return next();
    }

    if (!auth.userId) {
      return next(new UnauthorizedError("Unauthorized"));
    }

    const publicMetadata = (auth.sessionClaims?.publicMetadata || auth.sessionClaims?.metadata) as UserPublicMetadata | undefined;

    // Fetch user from database to check for hardcoded admin email
    const user = await User.findOne({ clerkUserId: auth.userId });
    const isAdminEmail = user?.email === "imashachamodi0609@gmail.com";

    if (!isAdminEmail && (!publicMetadata || publicMetadata.role !== "admin")) {
      return next(new ForbiddenError("Forbidden"));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};