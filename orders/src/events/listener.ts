import { Listener, NotFoundError, OrderStatus } from "@ksticketinservice/common";
import { JsMsg } from "nats";
import { Ticket } from "../models/ticket.model";
import { Order } from "../models/order.model";
import { OrderPublisher } from "./publishers";
import { natsWrapper } from "./init";
import { RedisLock } from "../services/redis-lock.service";

export class TicketListener extends Listener {
    name = "tickets";
    durableName = "orders-tickets-durable";

    async onMessage(data: JsMsg): Promise<void> {
        try {
            if (data.subject === "ticket.created") {
                const { id, title, price, version } = JSON.parse(data.data.toString());
                const existingTicket = await Ticket.findById(id);
                if (!existingTicket) {
                    const ticket = Ticket.build({ id, title, price, version });
                    await ticket.save();
                }
            } else if (data.subject === "ticket.updated") {
                const { id, title, price, version } = JSON.parse(data.data.toString());
                const ticket = await Ticket.findByEvent({ id, version }) || await Ticket.findById(id);
                if (!ticket) {
                    throw new NotFoundError();
                }
                ticket.set({ title, price, version });
                await ticket.save();
            }
        } catch (error) {
            console.error("Error processing ticket event in orders service:", error);
            throw error;
        }
    }
}

export class ExpirationListener extends Listener {
    name = "expiration";
    durableName = "orders-expiration-durable";

    async onMessage(data: JsMsg): Promise<void> {
        try {
            if (data.subject === "expiration.complete") {
                const { orderId } = JSON.parse(data.data.toString());
                const order = await Order.findById(orderId).populate("ticket");
                if (!order) {
                    throw new NotFoundError();
                }

                if (order.status === OrderStatus.Completed) {
                    return;
                }

                order.set({ status: OrderStatus.Cancelled, version: order.version + 1 });
                await order.save();

                // Release fast-path redis lock so the ticket can be re-reserved immediately
                if (order.ticket) {
                    await RedisLock.release(order.ticket.id);
                }

                const publisher = new OrderPublisher(natsWrapper.client);
                await publisher.publish("order.cancelled", {
                    id: order.id,
                    version: order.version,
                    ticket: {
                        id: order.ticket.id
                    }
                });
            }
        } catch (error) {
            console.error("Error processing expiration event in orders service:", error);
            throw error;
        }
    }
}

export class PaymentListener extends Listener {
    name = "payments";
    durableName = "orders-payments-durable";

    async onMessage(data: JsMsg): Promise<void> {
        try {
            if (data.subject === "payment.created") {
                const { orderId } = JSON.parse(data.data.toString());
                const order = await Order.findById(orderId);
                if (!order) {
                    throw new NotFoundError();
                }

                order.set({ status: OrderStatus.Completed, version: order.version + 1 });
                await order.save();
            }
        } catch (error) {
            console.error("Error processing payment event in orders service:", error);
            throw error;
        }
    }
}
