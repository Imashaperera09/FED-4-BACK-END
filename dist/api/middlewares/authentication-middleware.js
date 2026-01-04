import { getAuth } from "@clerk/express";
import { UnauthorizedError } from "../../domain/errors/errors";
export const authenticationMiddleware = (req, res, next) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        throw new UnauthorizedError("Unauthorized");
    }
    next();
};
