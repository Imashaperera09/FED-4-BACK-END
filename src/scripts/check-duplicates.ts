
import mongoose from "mongoose";
import { Invoice } from "../infrastructure/entities/Invoice";
import "dotenv/config";

async function checkDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        const invoices = await Invoice.find().sort({ periodStart: -1 });
        console.log(`Total invoices: ${invoices.length}`);

        const seen = new Set();
        const duplicates = [];

        for (const invoice of invoices) {
            const key = `${invoice.userId}-${invoice.periodStart.toISOString()}`;
            if (seen.has(key)) {
                duplicates.push(invoice._id);
            } else {
                seen.add(key);
            }
        }

        console.log(`Found ${duplicates.length} duplicates.`);
        if (duplicates.length > 0) {
            console.log("Deleting duplicate IDs:", duplicates);
            const result = await Invoice.deleteMany({ _id: { $in: duplicates } });
            console.log(`Deleted ${result.deletedCount} duplicate invoices.`);
        } else {
            console.log("No duplicates found.");
        }

    } catch (error) {
        console.error("Error checking duplicates:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDuplicates();
