
import { Invoice } from "./src/infrastructure/entities/Invoice";
import mongoose from "mongoose";
import "dotenv/config";

async function updateInvoice() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        const newUserId = "user_3771vgF9VF9vYlOcKxTvYlBFSul";

        // Find the most recent invoice
        const invoice = await Invoice.findOne().sort({ createdAt: -1 });

        if (!invoice) {
            console.log("No invoice found to update.");
            return;
        }

        console.log(`Found invoice: ${invoice._id}, current userId: ${invoice.userId}`);

        invoice.userId = newUserId;
        await invoice.save();

        console.log(`Updated invoice ${invoice._id} to userId: ${newUserId}`);
    } catch (error) {
        console.error("Error updating invoice:", error);
    } finally {
        await mongoose.disconnect();
    }
}

updateInvoice();
