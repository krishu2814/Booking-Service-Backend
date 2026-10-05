import { natsWrapper } from "./events/init";
import { ExpirationCompletePublisher } from "./events/publishers";
import { OrderCreatedListener } from "./events/listener";
import { createExpirationWorker, expirationQueue } from "./queues/expiration-queue";

const start = async () => {
    if (!process.env.NATS_URL) {
        throw new Error("NATS_URL must be defined");
    }
    if (!process.env.REDIS_HOST) {
        throw new Error("REDIS_HOST must be defined");
    }

    try {
        await natsWrapper.connect(process.env.NATS_URL);

        const worker = createExpirationWorker();

        const closeAll = async () => {
            console.log("Shutting down expiration service...");
            await worker.close();
            await expirationQueue.close();
            natsWrapper.client.close();
            process.exit(0);
        };

        process.on("SIGINT", () => {
            console.log("SIGINT received, closing connections");
            closeAll();
        });
        process.on("SIGTERM", () => {
            console.log("SIGTERM received, closing connections");
            closeAll();
        });

        await new ExpirationCompletePublisher(natsWrapper.client).createStream();

        const orderCreatedListener = new OrderCreatedListener(natsWrapper.client);

        setInterval(() => {
            orderCreatedListener.listen();
        }, 1000);

        console.log("Expiration service is running and listening for events");
    } catch (err) {
        console.error(err);
    }
};

start();
