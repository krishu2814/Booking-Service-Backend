import { Router } from "express";
import { authUser } from "@ksticketinservice/common";
import { getOrdersController } from "../controllers/get-orders.controller";

const router = Router();

router.get("/", authUser, getOrdersController);

export { router as getOrdersRouter };
