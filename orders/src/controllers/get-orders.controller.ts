import { NextFunction, Request, Response } from "express";
import { Order } from "../models/order.model";

export const getOrdersController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await Order.find({ userId: req.currentUser!.id }).populate("ticket");
        res.status(200).send(orders);
    } catch (error) {
        next(error);
    }
};
