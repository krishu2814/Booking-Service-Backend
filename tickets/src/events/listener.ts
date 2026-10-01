import { Listener, NotFoundError } from "@ksticketinservice/common";
import { JsMsg } from "nats";
import { Ticket } from "../models/ticket.model";
import { TicketPublisher } from "./publishers";
import { natsWrapper } from "./init";

export class OrderListener extends Listener {
    name: string = "orders";
    durableName: string = "orders-service-durable";

    async onMessage(data: JsMsg): Promise<void> {
        try {
            if (data.subject === "order.created") {
                const { id, version, userId, status, ticket } = JSON.parse(data.data.toString());
                await this.orderCreated(id, ticket);
            }
            if (data.subject === "order.cancelled") {
                const { id, ticket } = JSON.parse(data.data.toString());
                console.log("Order cancelled", id, ticket);
                await this.orderCancelled(id, ticket);
            }
        } catch (error) {
            console.error("Error processing order event in tickets service:", error);
        }
    }

    async orderCreated(id: string, ticket: { id: string, price: string }) {
        const existingTicket = await Ticket.findById(ticket.id);
        if (!existingTicket) {
            throw new NotFoundError();
        }
        existingTicket.set({ orderId: id });
        await existingTicket.save();

        const publisher = new TicketPublisher(natsWrapper.client);
        await publisher.publish("ticket.updated", {
            id: existingTicket._id,
            title: existingTicket.title,
            price: existingTicket.price,
            userId: existingTicket.userId,
            orderId: existingTicket.orderId,
            version: existingTicket.version
        });
    }

    async orderCancelled(id: string, ticket: any) {
        const ticketId = typeof ticket === "object" && ticket !== null ? ticket.id : ticket;
        const existingTicket = await Ticket.findById(ticketId);
        if (!existingTicket) {
            throw new NotFoundError();
        }
        existingTicket.set({ orderId: undefined });
        await existingTicket.save();

        const publisher = new TicketPublisher(natsWrapper.client);
        await publisher.publish("ticket.updated", {
            id: existingTicket._id,
            title: existingTicket.title,
            price: existingTicket.price,
            userId: existingTicket.userId,
            orderId: existingTicket.orderId,
            version: existingTicket.version
        });
    }
}
