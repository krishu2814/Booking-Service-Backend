import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./events/init";
import { PaymentCreatedPublisher } from "./events/publishers";
import { OrderCreatedListener, OrderCancelledListener } from "./events/listener";

const start = async () => {
    if (!process.env.JWT_SECRET_KEY) {
        throw new Error("JWT_SECRET_KEY must be defined");
    }
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be defined");
    }
    if (!process.env.NATS_URL) {
        throw new Error("NATS_URL must be defined");
    }
    if (!process.env.STRIPE_KEY) {
        throw new Error("STRIPE_KEY must be defined");
    }

    try {
        await natsWrapper.connect(process.env.NATS_URL);

        process.on("SIGINT", () => {
            console.log("SIGINT received, closing NATS connection");
            natsWrapper.client.close();
            process.exit(0);
        });
        process.on("SIGTERM", () => {
            console.log("SIGTERM received, closing NATS connection");
            natsWrapper.client.close();
            process.exit(0);
        });

        await new PaymentCreatedPublisher(natsWrapper.client).createStream();

        const orderCreatedListener = new OrderCreatedListener(natsWrapper.client);
        const orderCancelledListener = new OrderCancelledListener(natsWrapper.client);

        setInterval(() => {
            orderCreatedListener.listen();
            orderCancelledListener.listen();
        }, 1000);

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        app.listen(3000, () => {
            console.log("Payments service listening on port 3000");
        });
    } catch (err) {
        console.error(err);
    }
};

start();
