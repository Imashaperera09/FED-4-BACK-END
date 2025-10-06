import mongoose from "mongoose";
import { SolarUnit } from "./entities/SolarUnit.js";
import { EnergyGenerationRecord } from "./entities/EnergyGenerationRecord.js";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

dotenv.config();

async function seed() {
    try {
        //connect to DB
    await connectDB();

        // Clear existing data
        await EnergyGenerationRecord.deleteMany({});
        await SolarUnit.deleteMany({});

        //create a new solar unit
        const solarUnit = await SolarUnit.create({
            serialNumber: "SU-0001",
            installationDate: new Date("2025-09-21"),
            capacity: 5000,
            status: "ACTIVE",
        });

        //create 10 sequential energy generation records every 2 hours
        const records = [];
        const baseDate = new Date("2023-01-01T00:00:00Z");
        for (let i = 0; i < 10; i++) {
            records.push({
                solarUnitId: solarUnit._id,
                timestamp: new Date(baseDate.getTime() + i * 2 * 60 * 60 * 1000), // each day
                energyGenerated: 100 + i * 10, // increasing energy
            });
        }

        await EnergyGenerationRecord.insertMany(records);

        console.log("Database seeded successfully");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
