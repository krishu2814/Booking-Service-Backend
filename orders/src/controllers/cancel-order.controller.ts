import { NotAuthorizedError, NotFoundError, OrderStatus, RequestValidationError } from "@ksticketinservice/common";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { Order } from "../models/order.model";
import { OrderPublisher } from "../events/publishers";
import { natsWrapper } from "../events/init";
import { RedisLock } from "../services/redis-lock.service";

export const cancelOrderController = async (req: Request, res: Response, next: NextFunction) => {
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

        order.set({
            status: OrderStatus.Cancelled,
            version: order.version + 1
        });
        await order.save();

        // Release in-memory fast lock so ticket is immediately reservable again
        await RedisLock.release(order.ticket.id);

        const publisher = new OrderPublisher(natsWrapper.client);
        await publisher.publish("order.cancelled", {
            id: order.id,
            version: order.version,
            ticket: {
                id: order.ticket.id
            }
        });

        res.status(200).send(order);
    } catch (error) {
        next(error);
    }
};
