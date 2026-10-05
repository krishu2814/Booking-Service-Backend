import { Router } from "express";
import { authUser } from "@ksticketinservice/common";
import { param } from "express-validator";
import { cancelOrderController } from "../controllers/cancel-order.controller";

const router = Router();

const validators = [
    param("id").isMongoId().withMessage("Order ID must be a valid Mongo ID")
];

router.patch("/:id", validators, authUser, cancelOrderController);
router.patch("/cancel/:id", validators, authUser, cancelOrderController);
router.delete("/:id", validators, authUser, cancelOrderController);

export { router as cancelOrderRouter };
