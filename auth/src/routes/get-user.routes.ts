import { Router } from "express";
import { getUserController } from "../controllers/get-user.controller";
import { currentUserMiddleware, authUser } from "@ksticketinservice/common";

const router = Router();

router.get("/get-user", currentUserMiddleware, authUser, getUserController);
router.get("/currentuser", currentUserMiddleware, getUserController);

export { router as getUserRouter };
