import mongoose from "mongoose";
import { connectDB } from "./src/infrastructure/db";
import { EnergyGenerationRecord } from "./src/infrastructure/entities/EnergyGenerationRecord";
import { Anomaly } from "./src/infrastructure/entities/Anomaly";
import { runAnomalyDetection } from "./src/jobs/anomaly-detection-job";
import "dotenv/config";

async function run() {
    await connectDB();

    const recordCount = await EnergyGenerationRecord.countDocuments();
    console.log(`Total Energy Records: ${recordCount}`);

    const anomalyCountBefore = await Anomaly.countDocuments();
    console.log(`Anomalies before: ${anomalyCountBefore}`);

    console.log("Running anomaly detection for the last 30 days...");
    await runAnomalyDetection(30);

    const anomalyCountAfter = await Anomaly.countDocuments();
    console.log(`Anomalies after: ${anomalyCountAfter}`);

    const latestAnomalies = await Anomaly.find().sort({ timestamp: -1 }).limit(5);
    console.log("Latest 5 anomalies:", JSON.stringify(latestAnomalies, null, 2));

    await mongoose.disconnect();
}

run().catch(console.error);
