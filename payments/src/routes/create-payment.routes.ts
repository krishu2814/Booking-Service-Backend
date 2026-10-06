import { Router } from "express";
import { authUser } from "@ksticketinservice/common";
import { body } from "express-validator";
import { createPaymentController } from "../controllers/create-payment.controller";

const router = Router();

const validators = [
    body("token")
        .notEmpty()
        .withMessage("Token is required"),
    body("orderId")
        .notEmpty()
        .withMessage("Order ID is required")
        .isMongoId()
        .withMessage("Order ID must be a valid Mongo ID")
];

router.post("/", validators, authUser, createPaymentController);
router.post("/create", validators, authUser, createPaymentController);

export { router as createPaymentRouter };
