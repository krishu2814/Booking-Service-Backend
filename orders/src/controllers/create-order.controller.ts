import { BadRequestErroor, NotFoundError, OrderStatus, RequestValidationError } from "@ksticketinservice/common";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { Ticket } from "../models/ticket.model";
import { Order } from "../models/order.model";
import { OrderPublisher } from "../events/publishers";
import { natsWrapper } from "../events/init";

const EXPIRATION_WINDOW_SECONDS = 15 * 60;

export const createOrderController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new RequestValidationError(errors.array());
        }

        const { ticketId } = req.body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            throw new NotFoundError();
        }

        const isReserved = await ticket.isReserved();
        if (isReserved) {
            throw new BadRequestErroor("Ticket is already reserved");
        }

        const expiration = new Date();
        expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

        const order = Order.build({
            userId: req.currentUser!.id,
            status: OrderStatus.Created,
            expiresAt: expiration,
            ticket,
            version: 1
        });
        await order.save();

        const publisher = new OrderPublisher(natsWrapper.client);
        await publisher.publish("order.created", {
            id: order.id,
            version: order.version,
            userId: order.userId,
            status: order.status,
            expiresAt: order.expiresAt.toISOString(),
            ticket: {
                id: ticket.id,
                price: ticket.price
            }
        });

        res.status(201).send(order);
    } catch (error) {
        next(error);
    }
};
