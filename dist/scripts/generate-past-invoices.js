import mongoose from "mongoose";
import { Invoice } from "../infrastructure/entities/Invoice";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import "dotenv/config";
async function generatePastInvoices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
        const userId = "user_3771vgF9VF9vYlOcKxTvYlBFSul";
        // Find the active solar unit
        const solarUnit = await SolarUnit.findOne({ status: "ACTIVE" });
        if (!solarUnit) {
            console.log("No active solar unit found.");
            return;
        }
        console.log(`Generating invoices for unit: ${solarUnit.serialNumber}`);
        const invoices = [];
        const today = new Date();
        for (let i = 1; i <= 6; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
            // Random energy between 200 and 500 kWh
            const energyGenerated = Math.floor(Math.random() * (500 - 200 + 1)) + 200;
            // Rate approx $0.15 per kWh
            const amount = parseFloat((energyGenerated * 0.15).toFixed(2));
            // Paid 5 days after period end
            const paidAt = new Date(periodEnd);
            paidAt.setDate(paidAt.getDate() + 5);
            invoices.push({
                userId,
                solarUnitId: solarUnit._id,
                amount,
                energyGenerated,
                periodStart,
                periodEnd,
                status: "PAID",
                paidAt,
                createdAt: periodEnd
            });
        }
        await Invoice.insertMany(invoices);
        console.log(`Successfully generated ${invoices.length} past paid invoices.`);
    }
    catch (error) {
        console.error("Error generating invoices:", error);
    }
    finally {
        await mongoose.disconnect();
    }
}
generatePastInvoices();
