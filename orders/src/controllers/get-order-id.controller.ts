import { NotAuthorizedError, NotFoundError, RequestValidationError } from "@ksticketinservice/common";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { Order } from "../models/order.model";

export const getOrderByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new RequestValidationError(errors.array());
        }

        const order = await Order.findById(req.params.id).populate("ticket");
        if (!order) {
            throw new NotFoundError();
        }

        if (order.userId !== req.currentUser!.id) {
            throw new NotAuthorizedError();
        }

        res.status(200).send(order);
    } catch (error) {
        next(error);
    }
};
