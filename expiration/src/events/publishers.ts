import { Publisher } from "@ksticketinservice/common";

export class ExpirationCompletePublisher extends Publisher {
    name = "expiration";
    subject = ["expiration.>"];
}
