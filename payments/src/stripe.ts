import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_KEY || "dummy_key", {
    apiVersion: "2023-10-16" as any
});
