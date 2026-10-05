import { Router } from "express";
import { authUser } from "@ksticketinservice/common";
import { param } from "express-validator";
import { getOrderByIdController } from "../controllers/get-order-id.controller";

const router = Router();

router.get(
    "/:id",
    [
        param("id").isMongoId().withMessage("Order ID must be a valid Mongo ID")
    ],
    authUser,
    getOrderByIdController
);

export { router as getOrderIdRouter };
