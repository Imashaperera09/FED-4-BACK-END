import { getAuth } from "@clerk/express";
// Inline error classes if not defined elsewhere
class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = "ForbiddenError";
        this.status = 403;
    }
}
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = "UnauthorizedError";
        this.status = 401;
    }
}
export const authorizationMiddleware = async (req, res, next) => {
    try {
        const auth = getAuth(req);
        if (!auth.userId) {
            return next(new UnauthorizedError("Unauthorized"));
        }
        // Temporarily allow all authenticated users for development
        // TODO: Re-enable role check for production
        // const publicMetadata = (auth.sessionClaims?.publicMetadata || auth.sessionClaims?.metadata) as UserPublicMetadata | undefined;
        // if (!publicMetadata || publicMetadata.role !== "admin") {
        //   return next(new ForbiddenError("Forbidden"));
        // }
        return next();
    }
    catch (error) {
        return next(error);
    }
};
