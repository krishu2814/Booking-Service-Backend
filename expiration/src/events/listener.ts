import { Listener } from "@ksticketinservice/common";
import { JsMsg } from "nats";
import { expirationQueue, QUEUE_NAME } from "../queues/expiration-queue";

export class OrderCreatedListener extends Listener {
    name = "orders";
    durableName = "expiration-orders-durable";

    async onMessage(data: JsMsg): Promise<void> {
        try {
            if (data.subject === "order.created") {
                const { id, expiresAt } = JSON.parse(data.data.toString());
                const delay = new Date(expiresAt).getTime() - new Date().getTime();

                await expirationQueue.add(
                    QUEUE_NAME,
                    {
                        orderId: id
                    },
                    {
                        delay: Math.max(delay, 0)
                    }
                );
            }
        } catch (error) {
            console.error("Error processing order.created event in expiration service:", error);
            throw error;
        }
    }
}
