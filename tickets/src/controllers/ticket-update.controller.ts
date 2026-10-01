import { BadRequestErroor, NotFoundError, RequestValidationError } from "@ksticketinservice/common";
import { Ticket } from "../models/ticket.model";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { TicketPublisher } from "../events/publishers";
import { natsWrapper } from "../events/init";

export const ticketUpdateController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new RequestValidationError(errors.array());
        }

        const id = req.params.id;
        const { title, price } = req.body;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            throw new NotFoundError();
        }

        const user = req.currentUser?.id;
        if (ticket.userId !== user) {
            throw new BadRequestErroor("You are not authorized to update this ticket");
        }

        if (ticket.orderId) {
            throw new BadRequestErroor("Ticket is reserved");
        }

        ticket.set({ title, price, version: ticket.version + 1 });
        await ticket.save();

        const publisher = new TicketPublisher(natsWrapper.client);

        await publisher.publish("ticket.updated", {
            id: ticket._id,
            title: ticket.title,
            price: ticket.price,
            userId: ticket.userId,
            version: ticket.version
        });

        res.status(200).send({ ticket });
    } catch (error) {
        next(error);
    }
};
