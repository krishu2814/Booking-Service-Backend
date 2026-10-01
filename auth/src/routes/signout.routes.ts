import { Router } from "express";
import { signoutController } from "../controllers/signout.controller";
import { currentUserMiddleware, authUser } from "@ksticketinservice/common";

const router = Router();

router.post("/signout", currentUserMiddleware, authUser, signoutController);

export { router as signoutRouter };
