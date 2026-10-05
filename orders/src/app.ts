import express, { json } from "express";
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError, currentUserMiddleware } from "@ksticketinservice/common";

import { createOrderRouter } from "./routes/create-order.routes";
import { getOrdersRouter } from "./routes/get-orders.routes";
import { getOrderIdRouter } from "./routes/get-order-id.routes";
import { cancelOrderRouter } from "./routes/cancel-order.routes";

const app = express();

app.set("trust proxy", true);
app.use(json());
app.use(cookieSession({
    signed: false,
    secure: false
}));
app.use(currentUserMiddleware);

app.use("/api/orders", createOrderRouter);
app.use("/api/orders", getOrdersRouter);
app.use("/api/orders", getOrderIdRouter);
app.use("/api/orders", cancelOrderRouter);

app.all("*", () => {
    throw new NotFoundError();
});
app.use(errorHandler);

export { app };
