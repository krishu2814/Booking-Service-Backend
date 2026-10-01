import { CustomError } from "./custom-error";

export class NotAuthorizedError extends CustomError {
    statusCode = 401;

    constructor() {
        super("Not logged in");
        Object.setPrototypeOf(this, NotAuthorizedError.prototype);
    }

    serializeErrors() {
        return [{ message: "Not logged in" }];
    }
}
