import { Listener, NotFoundError, OrderStatus } from "@ksticketinservice/common";
import { JsMsg } from "nats";
import { Order } from "../models/order.model";

export class OrderCreatedListener extends Listener {
    name = "orders";
    durableName = "payments-orders-created-durable";

    async onMessage(data: JsMsg): Promise<void> {
        try {
            if (data.subject === "order.created") {
                const { id, version, userId, status, ticket } = JSON.parse(data.data.toString());
                const existingOrder = await Order.findById(id);
                if (!existingOrder) {
                    const order = Order.build({
                        id,
                        version,
                        userId,
                        price: Number(ticket.price),
                        status: status as OrderStatus
                    });
                    await order.save();
                }
            }
        } catch (error) {
            console.error("Error processing order.created in payments service:", error);
            throw error;
        }
    }
}

export class OrderCancelledListener extends Listener {
    name = "orders";
    durableName = "payments-orders-cancelled-durable";

    async onMessage(data: JsMsg): Promise<void> {
        try {
            if (data.subject === "order.cancelled") {
                const { id, version } = JSON.parse(data.data.toString());
                const order = (await Order.findByEvent({ id, version })) || (await Order.findById(id));
                if (!order) {
                    throw new NotFoundError();
                }

                order.set({
                    status: OrderStatus.Cancelled,
                    version
                });
                await order.save();
            }
        } catch (error) {
            console.error("Error processing order.cancelled in payments service:", error);
            throw error;
        }
    }
}
