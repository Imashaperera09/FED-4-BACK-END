
import mongoose from "mongoose";
import { SolarUnit } from "./src/infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "./src/infrastructure/entities/EnergyGenerationRecord";
import "dotenv/config";

async function generateRecentData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        // Find the active solar unit
        const solarUnit = await SolarUnit.findOne({ status: "ACTIVE" });
        if (!solarUnit) {
            console.log("No active solar unit found.");
            return;
        }

        console.log(`Generating data for unit: ${solarUnit.serialNumber}`);

        // Generate data for the last 30 days up to now
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const records = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const hour = currentDate.getHours();

            // Simple generation logic
            let energy = 0;
            if (hour >= 6 && hour <= 18) {
                // Peak hours 10-14
                const isPeak = hour >= 10 && hour <= 14;
                const base = isPeak ? 400 : 150;
                const random = Math.random() * 100;
                energy = Math.floor(base + random);
            }

            records.push({
                solarUnitId: solarUnit._id,
                timestamp: new Date(currentDate),
                energyGenerated: energy,
            });

            // Increment by 1 hour
            currentDate.setHours(currentDate.getHours() + 1);
        }

        await EnergyGenerationRecord.insertMany(records);
        console.log(`Successfully generated ${records.length} records for the last 30 days.`);

    } catch (error) {
        console.error("Error generating data:", error);
    } finally {
        await mongoose.disconnect();
    }
}

generateRecentData();
