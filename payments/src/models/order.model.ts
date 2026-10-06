import mongoose, { Schema } from "mongoose";
import { OrderStatus } from "@ksticketinservice/common";

export { OrderStatus };

interface OrderAttrs {
    id: string;
    version: number;
    userId: string;
    price: number;
    status: OrderStatus;
}

interface OrderDoc extends mongoose.Document {
    version: number;
    userId: string;
    price: number;
    status: OrderStatus;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc;
    findByEvent(event: { id: string; version: number }): Promise<OrderDoc | null>;
}

const orderSchema = new Schema<OrderDoc, OrderModel>({
    userId: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus)
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

orderSchema.statics.findByEvent = (event: { id: string; version: number }) => {
    return Order.findOne({
        _id: event.id,
        version: event.version - 1
    });
};

orderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order({
        _id: attrs.id,
        version: attrs.version,
        userId: attrs.userId,
        price: attrs.price,
        status: attrs.status
    });
};

const Order = mongoose.model<OrderDoc, OrderModel>("Order", orderSchema);

export { Order, OrderDoc };
