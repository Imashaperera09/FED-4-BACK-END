import mongoose from "mongoose";
import { SolarUnit } from "./entities/SolarUnit";
import { EnergyGenerationRecord } from "./entities/EnergyGenerationRecord";
import dotenv from "dotenv";
import { connectDB } from "./db";

dotenv.config();

async function seed() {
    try {
        //connect to DB
        await connectDB();

        // Clear existing data
        await EnergyGenerationRecord.deleteMany({});
        await SolarUnit.deleteMany({});

        console.log("Creating solar units...");

        // Create multiple solar units
        const solarUnits = await SolarUnit.create([
            {
                userId: new mongoose.Types.ObjectId("670266d5be9bb3bb1e6fb5c7"),
                serialNumber: "SU-2024-001",
                installationDate: new Date("2024-01-15"),
                capacity: 5000,
                status: "ACTIVE",
            },
            {
                userId: new mongoose.Types.ObjectId("670266d5be9bb3bb1e6fb5c7"),
                serialNumber: "SU-2024-002",
                installationDate: new Date("2024-02-10"),
                capacity: 4500,
                status: "ACTIVE",
            },
            {
                userId: new mongoose.Types.ObjectId("670266d5be9bb3bb1e6fb5c8"),
                serialNumber: "SU-2024-003",
                installationDate: new Date("2024-03-05"),
                capacity: 6000,
                status: "MAINTENANCE",
            }
        ]);

        console.log(`Created ${solarUnits.length} solar units`);

        // Create energy generation records for each solar unit
        const records = [];
        const baseDate = new Date("2024-10-01T00:00:00Z");
        
        for (const solarUnit of solarUnits) {
            // Create 24 records (one for each hour of a day)
            for (let i = 0; i < 24; i++) {
                records.push({
                    solarUnitId: solarUnit._id,
                    timestamp: new Date(baseDate.getTime() + i * 60 * 60 * 1000), // each hour
                    energyGenerated: Math.floor(Math.random() * 500) + 100, // Random energy between 100-600
                    intervalHours: 1
                });
            }
        }

        await EnergyGenerationRecord.insertMany(records);
        console.log(`Created ${records.length} energy generation records`);

        console.log("Database seeded successfully");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
