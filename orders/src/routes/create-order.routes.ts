import { Router } from "express";
import { authUser } from "@ksticketinservice/common";
import { body } from "express-validator";
import { createOrderController } from "../controllers/create-order.controller";

const router = Router();

const validators = [
    body("ticketId")
        .notEmpty()
        .withMessage("Ticket ID is required")
        .isMongoId()
        .withMessage("Ticket ID must be a valid Mongo ID")
];

router.post("/", validators, authUser, createOrderController);
router.post("/create", validators, authUser, createOrderController);

export { router as createOrderRouter };
