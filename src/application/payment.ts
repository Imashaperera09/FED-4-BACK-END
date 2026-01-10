
import Stripe from "stripe";
import { Request, Response } from "express";
import { Invoice } from "../infrastructure/entities/Invoice";
import { NotFoundError, ValidationError } from "../domain/errors/errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const createCheckoutSession = async (req: Request, res: Response) => {
    // 1. Get invoice
    const { invoiceId } = req.body;
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw new NotFoundError("Invoice not found");
    }

    if (invoice.status === "PAID") {
        throw new ValidationError("Invoice already paid");
    }

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID,
                quantity: Math.round(invoice.energyGenerated), // kWh as quantity
            },
        ],
        mode: "payment",
        return_url: `${process.env.FRONTEND_URL}/dashboard/invoices/complete?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
            invoiceId: invoice._id.toString(),
        },
    });

    // 3. Return client secret to frontend
    return res.json({ clientSecret: session.client_secret });
};

export const getSessionStatus = async (req: Request, res: Response) => {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
        throw new ValidationError("Session ID is required");
    }

    const session: any = await stripe.checkout.sessions.retrieve(session_id);

    return res.json({
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
    });
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    // 1. Verify webhook signature
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 2. Handle payment completion
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId && session.payment_status === "paid") {
            await Invoice.findByIdAndUpdate(invoiceId, {
                status: "PAID",
                paidAt: new Date(),
                stripePaymentIntentId: session.payment_intent as string,
            });
            console.log("Invoice marked as PAID:", invoiceId);
        }
    }

    // 3. Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
};
