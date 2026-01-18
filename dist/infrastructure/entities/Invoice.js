import mongoose from "mongoose";
const InvoiceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    solarUnitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SolarUnit",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    energyGenerated: {
        type: Number,
        required: true,
    },
    periodStart: {
        type: Date,
        required: true,
    },
    periodEnd: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
    },
    stripePaymentIntentId: {
        type: String,
    },
    paidAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
export const Invoice = mongoose.model("Invoice", InvoiceSchema);
