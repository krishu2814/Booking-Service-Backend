import mongoose, { Schema } from "mongoose";

interface TicketAttrs {
    userId: string;
    title: string;
    price: string;
    version?: number;
    orderId?: string;
}

interface TicketDoc extends mongoose.Document {
    userId: string;
    title: string;
    price: string;
    version: number;
    orderId?: string;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
    build(attrs: TicketAttrs): TicketDoc;
}

const ticketSchema: Schema<TicketDoc, TicketModel> = new Schema({
    userId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    version: {
        type: Number,
        required: true,
        default: 1
    },
    orderId: {
        type: String,
        required: false
    }
}, {
    toJSON: {
        transform(doc, ret: any) {
            ret.id = ret._id;
            delete ret.__v;
        }
    }
});

ticketSchema.index({ userId: 1 });

ticketSchema.statics.build = (attrs: TicketAttrs) => {
    return new Ticket({
        ...attrs,
        version: attrs.version ?? 1
    });
};

const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
