
import mongoose from "mongoose";
import { Invoice } from "../infrastructure/entities/Invoice";
import "dotenv/config";

async function deleteInvoice() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        // Find invoice ending with 537AFB (case insensitive)
        // Since _id is ObjectId, we can't use regex on it directly easily in all mongo versions if it's stored as ObjectId.
        // But we can fetch all and filter or try to construct the ObjectId if we had the full one.
        // However, the frontend shows the last 6 chars. 
        // Let's fetch all pending invoices and find the match.

        const invoices = await Invoice.find({});
        const targetInvoice = invoices.find(inv => inv._id.toString().toUpperCase().endsWith("537AFB"));

        if (targetInvoice) {
            console.log(`Found invoice: ${targetInvoice._id} with amount $${targetInvoice.amount}`);
            await Invoice.findByIdAndDelete(targetInvoice._id);
            console.log("Invoice deleted successfully.");
        } else {
            console.log("Invoice #537AFB not found.");
        }

    } catch (error) {
        console.error("Error deleting invoice:", error);
    } finally {
        await mongoose.disconnect();
    }
}

deleteInvoice();
