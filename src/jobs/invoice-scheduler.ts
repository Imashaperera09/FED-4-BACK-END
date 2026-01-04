import cron from "node-cron";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { Invoice } from "../infrastructure/entities/Invoice";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";

export const initInvoiceScheduler = () => {
    // Schedule to run every day at midnight
    cron.schedule("0 0 * * *", async () => {
        console.log("Running automated invoice generation job...");
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Find solar units that haven't been invoiced in the last 30 days
            // or haven't been invoiced at all
            const unitsToInvoice = await SolarUnit.find({
                $or: [
                    { lastInvoiceDate: { $exists: false } },
                    { lastInvoiceDate: { $lt: thirtyDaysAgo } },
                ],
                status: "ACTIVE",
            });

            console.log(`Found ${unitsToInvoice.length} units to invoice.`);

            for (const unit of unitsToInvoice) {
                try {
                    // Calculate billing period
                    const endDate = new Date();
                    const startDate = unit.lastInvoiceDate || unit.installationDate;

                    // Calculate total energy generated in this period
                    const records = await EnergyGenerationRecord.find({
                        solarUnitId: unit._id,
                        timestamp: { $gte: startDate, $lte: endDate },
                    });

                    const totalEnergy = records.reduce((sum, record) => sum + record.energyGenerated, 0);

                    if (totalEnergy <= 0) {
                        console.log(`No energy generated for unit ${unit._id}, skipping invoice.`);
                        continue;
                    }

                    // Calculate amount ($0.15 per kWh)
                    const ratePerKwh = 0.15;
                    const amount = totalEnergy * ratePerKwh;

                    // Create invoice
                    await Invoice.create({
                        userId: unit.userId,
                        solarUnitId: unit._id,
                        amount: parseFloat(amount.toFixed(2)),
                        energyGenerated: parseFloat(totalEnergy.toFixed(2)),
                        periodStart: startDate,
                        periodEnd: endDate,
                        status: "PENDING",
                    });

                    // Update lastInvoiceDate
                    unit.lastInvoiceDate = endDate;
                    await unit.save();

                    console.log(`Generated invoice for unit ${unit._id}`);
                } catch (error) {
                    console.error(`Error generating invoice for unit ${unit._id}:`, error);
                }
            }
        } catch (error) {
            console.error("Error in automated invoice generation job:", error);
        }
    });
};
