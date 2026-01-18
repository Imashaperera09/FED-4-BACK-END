import cron from "node-cron";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
const DATA_API_URL = "http://localhost:8001/api";
export const initEnergySyncJob = () => {
    // Run every 2 hours (same as Data-api generation)
    cron.schedule("5 */2 * * *", async () => {
        console.log("Running energy sync job...");
        try {
            const activeUnits = await SolarUnit.find({ status: "ACTIVE" });
            for (const unit of activeUnits) {
                try {
                    // Get the latest record timestamp for this unit to avoid duplicates
                    const latestRecord = await EnergyGenerationRecord.findOne({ solarUnitId: unit._id })
                        .sort({ timestamp: -1 });
                    let url = `${DATA_API_URL}/energy-generation-records/solar-unit/${unit.serialNumber}`;
                    if (latestRecord) {
                        url += `?sinceTimestamp=${latestRecord.timestamp.toISOString()}`;
                    }
                    const response = await fetch(url);
                    if (!response.ok) {
                        console.error(`Failed to fetch data for unit ${unit.serialNumber}: ${response.statusText}`);
                        continue;
                    }
                    const records = await response.json();
                    if (records.length > 0) {
                        const recordsToInsert = records.map((r) => ({
                            solarUnitId: unit._id,
                            energyGenerated: r.energyGenerated,
                            timestamp: new Date(r.timestamp),
                            intervalHours: r.intervalHours || 2
                        }));
                        await EnergyGenerationRecord.insertMany(recordsToInsert);
                        console.log(`Synced ${recordsToInsert.length} records for unit ${unit.serialNumber}`);
                    }
                }
                catch (error) {
                    console.error(`Error syncing data for unit ${unit.serialNumber}:`, error);
                }
            }
        }
        catch (error) {
            console.error("Error in energy sync job:", error);
        }
    });
};
// Manual trigger function for testing
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
        if (!response.ok) {
            console.error(`Fetch failed: ${response.status} ${response.statusText}`);
            continue;
        }
        const records = await response.json();
        console.log(`Fetched ${records.length} records for unit ${unit.serialNumber}`);
        if (records.length > 0) {
            const recordsToInsert = records.map((r) => ({
                solarUnitId: unit._id,
                energyGenerated: r.energyGenerated,
                timestamp: new Date(r.timestamp),
                intervalHours: r.intervalHours || 2
            }));
            await EnergyGenerationRecord.insertMany(recordsToInsert);
            console.log(`Inserted ${recordsToInsert.length} records for unit ${unit.serialNumber}`);
        }
    }
};
