import express from "express";
import Stripe from "stripe";
import { Invoice } from "../infrastructure/entities/Invoice";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { NotFoundError } from "../domain/errors/errors";
import { User } from "../infrastructure/entities/User";
import { generateInvoicesForAllUnits } from "../jobs/invoice-scheduler";
const router = express.Router();
// Initialize Stripe with a placeholder key or environment variable
// In a real app, use process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    typescript: true,
});
// GET /api/invoices - Get all invoices (optionally filter by user)
router.get("/", async (req, res, next) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const invoices = await Invoice.find(query).sort({ createdAt: -1 });
        res.json(invoices);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/invoices/generate - Manually trigger invoice generation for a solar unit
router.post("/generate", async (req, res, next) => {
    try {
        const { solarUnitId } = req.body;
        const solarUnit = await SolarUnit.findById(solarUnitId);
        if (!solarUnit) {
            throw new NotFoundError("Solar unit not found");
        }
        // Calculate billing period (e.g., last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        // Calculate total energy generated
        const records = await EnergyGenerationRecord.find({
            solarUnitId,
            timestamp: { $gte: startDate, $lte: endDate },
        });
        const totalEnergy = records.reduce((sum, record) => sum + record.energyGenerated, 0);
        // Calculate amount (e.g., $0.15 per kWh)
        const ratePerKwh = 0.15;
        const amount = totalEnergy * ratePerKwh;
        // Fetch user to get Clerk ID
        const user = await User.findById(solarUnit.userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }
        const invoice = await Invoice.create({
            userId: user.clerkUserId,
            solarUnitId,
            amount: parseFloat(amount.toFixed(2)),
            energyGenerated: parseFloat(totalEnergy.toFixed(2)),
            periodStart: startDate,
            periodEnd: endDate,
            status: "PENDING",
        });
        res.status(201).json(invoice);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/invoices/auto-generate - Manually trigger auto-generation for all eligible units
router.post("/auto-generate", async (req, res, next) => {
    try {
        console.log("Manual auto-generation triggered...");
        const results = await generateInvoicesForAllUnits();
        res.status(200).json({
            message: `Auto-generation completed. Generated ${results.invoicesGenerated} invoices.`,
            results: {
                totalUnits: results.totalUnits,
                invoicesGenerated: results.invoicesGenerated,
                successCount: results.successCount,
                errorCount: results.errorCount,
                errors: results.errors,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/invoices/create-payment-intent - Create Stripe Payment Intent
router.post("/create-payment-intent", async (req, res, next) => {
    try {
        const { invoiceId } = req.body;
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new NotFoundError("Invoice not found");
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(invoice.amount * 100), // Amount in cents
            currency: "usd",
            metadata: { invoiceId: invoice._id.toString() },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        invoice.stripePaymentIntentId = paymentIntent.id;
        await invoice.save();
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        next(error);
    }
});
export { router as invoiceRouter };
