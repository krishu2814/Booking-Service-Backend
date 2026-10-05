import { Queue, Worker, Job } from "bullmq";
import { ExpirationCompletePublisher } from "../events/publishers";
import { natsWrapper } from "../events/init";

export interface Payload {
    orderId: string;
}

export const QUEUE_NAME = "order-expiration";

export const getRedisConnection = () => {
    return {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        maxRetriesPerRequest: null
    };
};

export const expirationQueue = new Queue<Payload>(QUEUE_NAME, {
    connection: getRedisConnection()
});

export const processExpirationJob = async (job: Job<Payload>) => {
    const publisher = new ExpirationCompletePublisher(natsWrapper.client);
    await publisher.publish("expiration.complete", {
        orderId: job.data.orderId
    });
};

export const createExpirationWorker = () => {
    const worker = new Worker<Payload>(
        QUEUE_NAME,
        processExpirationJob,
        {
            connection: getRedisConnection()
        }
    );

    worker.on("failed", (job, err) => {
        console.error(`Job ${job?.id} failed with error:`, err);
    });

    return worker;
};
