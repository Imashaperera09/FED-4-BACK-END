import "dotenv/config";
import mongoose from "mongoose";
import { Anomaly } from "./src/infrastructure/entities/Anomaly.js";
import { SolarUnit } from "./src/infrastructure/entities/SolarUnit.js";
import { User } from "./src/infrastructure/entities/User.js";
import { connectDB } from "./src/infrastructure/db.js";

async function testQuery() {
    try {
        await connectDB();
        console.log("Connected to DB");

        console.log("Fetching anomalies...");
        const start = Date.now();
        const anomalies = await Anomaly.find({})
            .populate({
                path: 'solarUnitId',
                populate: {
                    path: 'userId',
                    model: 'User'
                }
            })
            .sort({ timestamp: -1 });
        const end = Date.now();

        console.log(`Fetched ${anomalies.length} anomalies in ${end - start}ms`);
        if (anomalies.length > 0) {
            console.log("Sample anomaly:", JSON.stringify(anomalies[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error("Error fetching anomalies:", error);
        process.exit(1);
    }
}

testQuery();
