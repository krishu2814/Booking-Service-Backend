import express, { json } from "express";
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError, currentUserMiddleware } from "@ksticketinservice/common";
import { createPaymentRouter } from "./routes/create-payment.routes";

const app = express();

app.set("trust proxy", true);
app.use(json());
app.use(cookieSession({
    signed: false,
    secure: false
}));
app.use(currentUserMiddleware);

app.use("/api/payments", createPaymentRouter);
app.use("/api/payment", createPaymentRouter);

app.all("*", () => {
    throw new NotFoundError();
});
app.use(errorHandler);

export { app };
