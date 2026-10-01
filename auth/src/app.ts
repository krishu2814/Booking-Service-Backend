import express, { json } from "express";
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError } from "@ksticketinservice/common";

const app = express();

app.set("trust proxy", true);
app.use(json());
app.use(cookieSession({
    signed: false,
    secure: false
}));

import { getUserRouter } from "./routes/get-user.routes";
import { signinRouter } from "./routes/signin.routes";
import { signoutRouter } from "./routes/signout.routes";
import { signupRouter } from "./routes/signup.routes";

app.use("/api/users", getUserRouter);
app.use("/api/users", signinRouter);
app.use("/api/users", signupRouter);
app.use("/api/users", signoutRouter);

app.all("*", () => {
    throw new NotFoundError();
});

app.use(errorHandler);

export { app };
