import { Publisher } from "@ksticketinservice/common";

export class PaymentCreatedPublisher extends Publisher {
    name = "payments";
    subject = ["payment.>"];
}
