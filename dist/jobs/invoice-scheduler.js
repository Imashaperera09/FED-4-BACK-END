import cron from "node-cron";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { Invoice } from "../infrastructure/entities/Invoice";
import { User } from "../infrastructure/entities/User";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
/**
 * Generate invoices for all eligible solar units
 * @returns Object with success count, error count, and details
 */
export const generateInvoicesForAllUnits = async () => {
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
    const results = {
        totalUnits: unitsToInvoice.length,
        successCount: 0,
        errorCount: 0,
        invoicesGenerated: 0,
        errors: [],
    };
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
            // Fetch user to get Clerk ID
            const user = await User.findById(unit.userId);
            if (!user) {
                console.error(`User not found for unit ${unit._id}, skipping invoice.`);
                results.errorCount++;
                results.errors.push({ unitId: unit._id.toString(), error: "User not found" });
                continue;
            }
            // Create invoice
            await Invoice.create({
                userId: user.clerkUserId,
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
            results.successCount++;
            results.invoicesGenerated++;
            console.log(`Generated invoice for unit ${unit._id}`);
        }
        catch (error) {
            results.errorCount++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            results.errors.push({ unitId: unit._id.toString(), error: errorMessage });
            console.error(`Error generating invoice for unit ${unit._id}:`, error);
        }
    }
    return results;
};
export const initInvoiceScheduler = () => {
    // Schedule to run every day at midnight
    cron.schedule("0 0 * * *", async () => {
        console.log("Running automated invoice generation job...");
        try {
            const results = await generateInvoicesForAllUnits();
            console.log(`Invoice generation job completed. Generated ${results.invoicesGenerated} invoices. ` +
                `Success: ${results.successCount}, Errors: ${results.errorCount}`);
        }
        catch (error) {
            console.error("Error in automated invoice generation job:", error);
        }
    });
    console.log("Invoice scheduler initialized - will run daily at midnight");
};
