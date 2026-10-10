import {
    BadRequestErroor as BadRequestError,
    NotAuthorizedError,
    NotFoundError,
    OrderStatus,
    RequestValidationError
} from "@ksticketinservice/common";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { Order } from "../models/order.model";
import { Payment } from "../models/payment.model";
import { PaymentCreatedPublisher } from "../events/publishers";
import { natsWrapper } from "../events/init";
import { stripe } from "../stripe";

export const createPaymentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new RequestValidationError(errors.array());
        }

        const { token, orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            throw new NotFoundError();
        }

        if (order.userId !== req.currentUser!.id) {
            throw new NotAuthorizedError();
        }

        if (order.status === OrderStatus.Cancelled) {
            throw new BadRequestError("Cannot pay for a cancelled order");
        }

        if (order.status === OrderStatus.Completed) {
            throw new BadRequestError("Order is already completed");
        }

        const charge = await stripe.charges.create({
            currency: "usd",
            amount: Math.round(order.price * 100),
            source: token
        });

        const payment = Payment.build({
            orderId,
            stripeId: charge.id
        });
        await payment.save();

        const publisher = new PaymentCreatedPublisher(natsWrapper.client);
        await publisher.publish("payment.created", {
            id: payment.id,
            orderId: payment.orderId,
            stripeId: payment.stripeId
        });

        res.status(201).send({ id: payment.id });
    } catch (error) {
        next(error);
    }
};
