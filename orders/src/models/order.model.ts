import mongoose, { Schema } from "mongoose";
import { OrderStatus } from "@ksticketinservice/common";
import { TicketDoc } from "./ticket.model";

export { OrderStatus };

interface OrderAttrs {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: TicketDoc;
    version?: number;
}

interface OrderDoc extends mongoose.Document {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: TicketDoc;
    version: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new Schema<OrderDoc, OrderModel>({
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created
    },
    expiresAt: {
        type: Schema.Types.Date,
        required: true
    },
    ticket: {
        type: Schema.Types.ObjectId,
        ref: "Ticket",
        required: true
    },
    version: {
        type: Number,
        required: true,
        default: 1
    }
}, {
    toJSON: {
        transform(doc, ret: any) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

orderSchema.index({ ticket: 1, status: 1 });
orderSchema.index({ userId: 1 });

orderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order({
        ...attrs,
        version: attrs.version ?? 1
    });
};

const Order = mongoose.model<OrderDoc, OrderModel>("Order", orderSchema);

export { Order, OrderDoc };
