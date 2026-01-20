import express from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { User } from "../infrastructure/entities/User";
import Stripe from "stripe";
import { Invoice } from "../infrastructure/entities/Invoice";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  typescript: true,
});

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const evt = await verifyWebhook(req);

      const { id } = evt.data;
      const eventType = evt.type;
      console.log(
        `Received webhook with ID ${id} and event type of ${eventType}`
      );

      if (eventType === "user.created") {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0].email_address;

        // 1. Check if user already exists by clerkUserId
        let user = await User.findOne({ clerkUserId: id });
        if (user) {
          console.log("User already exists by Clerk ID");
          return res.send("User already exists");
        }

        // 2. Check if a placeholder user exists by email (created by admin)
        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          console.log("Linking Clerk ID to existing placeholder user:", email);
          user.clerkUserId = id;
          if (!user.firstName) user.firstName = first_name;
          if (!user.lastName) user.lastName = last_name;
          await user.save();
        } else {
          // 3. Create new user if no placeholder exists
          console.log("Creating new user:", email);
          await User.create({
            firstName: first_name,
            lastName: last_name,
            email: email.toLowerCase(),
            clerkUserId: id,
          });
        }
      }

      if (eventType === "user.updated") {
        const { id } = evt.data;
        await User.findOneAndUpdate({ clerkUserId: id }, {
          role: evt.data.public_metadata.role,
        });
      }

      if (eventType === "user.deleted") {
        const { id } = evt.data;
        await User.findOneAndDelete({ clerkUserId: id });
      }

      return res.send("Webhook received");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).send("Error verifying webhook");
    }
  }
);

webhooksRouter.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;
        if (invoiceId) {
          await Invoice.findByIdAndUpdate(invoiceId, { status: "PAID" });
          console.log(`Invoice ${invoiceId} marked as PAID`);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.send();
  }
);

export default webhooksRouter;
