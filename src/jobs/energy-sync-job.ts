import cron from "node-cron";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { Anomaly } from "../infrastructure/entities/Anomaly";

const DATA_API_URL = process.env.DATA_API_URL || "http://localhost:8001/api";

const processRecords = async (unit: any, records: any[]) => {
    if (records.length === 0) return;

    const recordsToInsert = [];
    const anomaliesToInsert = [];

    for (const r of records) {
        recordsToInsert.push({
            solarUnitId: unit._id,
            energyGenerated: r.energyGenerated,
            timestamp: new Date(r.timestamp),
            intervalHours: r.intervalHours || 2
        });

        if (r.isAnomaly) {
            let type = 'LOW_EFFICIENCY';
            let severity = 'WARNING';

            if (r.anomalyReason?.includes('Spike')) {
                type = 'OVER_CAPACITY_SPIKE';
                severity = 'INFO';
            } else if (r.anomalyReason?.includes('Outage') || r.energyGenerated === 0) {
                type = 'ZERO_GENERATION';
                severity = 'CRITICAL';
            }

            anomaliesToInsert.push({
                solarUnitId: unit._id,
                type,
                severity,
                timestamp: new Date(r.timestamp),
                description: r.anomalyReason || "Anomaly detected in energy generation",
                status: 'OPEN'
            });
        }
    }

    await EnergyGenerationRecord.insertMany(recordsToInsert);
    if (anomaliesToInsert.length > 0) {
        await Anomaly.insertMany(anomaliesToInsert);
    }

    return recordsToInsert.length;
};

export const initEnergySyncJob = () => {
    // Run every 2 hours (same as Data-api generation)
    cron.schedule("5 */2 * * *", async () => {
        console.log("Running energy sync job...");
        try {
            const activeUnits = await SolarUnit.find({ status: "ACTIVE" });

            for (const unit of activeUnits) {
                try {
                    const latestRecord = await EnergyGenerationRecord.findOne({ solarUnitId: unit._id })
                        .sort({ timestamp: -1 });

                    let url = `${DATA_API_URL}/energy-generation-records/solar-unit/${unit.serialNumber}`;
                    if (latestRecord) {
                        url += `?sinceTimestamp=${latestRecord.timestamp.toISOString()}`;
                    }

                    const response = await fetch(url);
                    if (!response.ok) continue;

                    const records = await response.json();
                    const count = await processRecords(unit, records);
                    if (count) console.log(`Synced ${count} records for unit ${unit.serialNumber}`);
                } catch (error) {
                    console.error(`Error syncing data for unit ${unit.serialNumber}:`, error);
                }
            }
        } catch (error) {
            console.error("Error in energy sync job:", error);
        }
    });
};

export const triggerSync = async () => {
    console.log("Manually triggering energy sync...");
    const activeUnits = await SolarUnit.find({ status: "ACTIVE" });
    console.log(`Found ${activeUnits.length} active units`);

    for (const unit of activeUnits) {
        const latestRecord = await EnergyGenerationRecord.findOne({ solarUnitId: unit._id })
            .sort({ timestamp: -1 });

        let url = `${DATA_API_URL}/energy-generation-records/solar-unit/${unit.serialNumber}`;
        if (latestRecord) {
            url += `?sinceTimestamp=${latestRecord.timestamp.toISOString()}`;
        }

        console.log(`Fetching from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) continue;

        const records = await response.json();
        const count = await processRecords(unit, records);
        if (count) console.log(`Inserted ${count} records for unit ${unit.serialNumber}`);
    }
};
