import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./events/init";
import { OrderPublisher } from "./events/publishers";
import { TicketListener, ExpirationListener, PaymentListener } from "./events/listener";

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

        await new OrderPublisher(natsWrapper.client).createStream();

        const ticketListener = new TicketListener(natsWrapper.client);
        const expirationListener = new ExpirationListener(natsWrapper.client);
        const paymentListener = new PaymentListener(natsWrapper.client);

        setInterval(() => {
            ticketListener.listen();
            expirationListener.listen();
            paymentListener.listen();
        }, 1000);

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        app.listen(3000, () => {
            console.log("Orders service listening on port 3000");
        });
    } catch (err) {
        console.error(err);
    }
};

start();
