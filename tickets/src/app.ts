import express, { json } from "express";
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError, currentUserMiddleware } from "@ksticketinservice/common";

import { createTicketRouter } from "./routes/create-ticket.routes";
import { getTicketsRouter } from "./routes/get-tickets.routes";
import { getTicketIdRouter } from "./routes/get-ticket-id.routes";
import { ticketUpdateRouter } from "./routes/ticket-update.routes";

const app = express();

app.set("trust proxy", true);
app.use(json());
app.use(cookieSession({
    signed: false,
    secure: false
}));
app.use(currentUserMiddleware);

app.use("/api/tickets", createTicketRouter);
app.use("/api/tickets", getTicketsRouter);
app.use("/api/tickets", getTicketIdRouter);
app.use("/api/tickets", ticketUpdateRouter);

app.all("*", () => {
    throw new NotFoundError();
});
app.use(errorHandler);

export { app };
