import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface currentUser {
    email: string;
    id: string;
}

declare global {
    namespace Express {
        interface Request {
            currentUser?: currentUser;
        }
    }
}

export async function currentUserMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.session?.token) {
        return next();
    }
    try {
        const token = req.session.token;
        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY!) as currentUser;
        req.currentUser = payload;
    } catch (err) {
        // Token is invalid or expired; req.currentUser remains undefined
    }
    next();
}
