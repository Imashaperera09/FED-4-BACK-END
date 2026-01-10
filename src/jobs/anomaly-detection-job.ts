import cron from "node-cron";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { Anomaly } from "../infrastructure/entities/Anomaly";

export const initAnomalyDetectionJob = () => {
    // Run every 2 hours, 15 minutes after the sync job
    cron.schedule("20 */2 * * *", async () => {
        console.log("Running anomaly detection job...");
        await runAnomalyDetection();
    });
};

export const runAnomalyDetection = async (lookbackDays: number = 1) => {
    try {
        const activeUnits = await SolarUnit.find({ status: "ACTIVE" });

        for (const unit of activeUnits) {
            try {
                // Get the records for this unit within the lookback window
                const lookbackDate = new Date();
                lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

                const records = await EnergyGenerationRecord.find({
                    solarUnitId: unit._id,
                    timestamp: { $gte: lookbackDate }
                }).sort({ timestamp: 1 });

                if (records.length === 0) continue;

                for (let i = 0; i < records.length; i++) {
                    const record = records[i];
                    const hour = record.timestamp.getUTCHours();
                    const energy = record.energyGenerated;
                    const capacity = unit.capacity;
                    const interval = record.intervalHours || 2;

                    // 1. Zero Generation (08:00 - 18:00)
                    if (hour >= 8 && hour <= 18 && energy === 0) {
                        await createAnomalyIfNotExists({
                            solarUnitId: unit._id,
                            type: 'ZERO_GENERATION',
                            severity: 'CRITICAL',
                            timestamp: record.timestamp,
                            description: `Zero energy generated during daylight hours (${hour}:00).`,
                            affectedPeriodStart: record.timestamp,
                            affectedPeriodEnd: record.timestamp
                        });
                    }

                    // 2. Low Efficiency (11:00 - 15:00)
                    // Capacity is in Watts, energy is in Wh. 
                    // If interval is 2 hours, max energy is capacity * 2.
                    // Low efficiency threshold: < 10% of capacity * interval
                    if (hour >= 11 && hour <= 15 && energy < (capacity * interval * 0.1)) {
                        await createAnomalyIfNotExists({
                            solarUnitId: unit._id,
                            type: 'LOW_EFFICIENCY',
                            severity: 'WARNING',
                            timestamp: record.timestamp,
                            description: `Low efficiency detected: ${energy}Wh generated (Capacity: ${capacity}W).`,
                            affectedPeriodStart: record.timestamp,
                            affectedPeriodEnd: record.timestamp
                        });
                    }

                    // 3. Over-capacity Spike
                    if (energy > (capacity * interval * 1.1)) { // 10% buffer
                        await createAnomalyIfNotExists({
                            solarUnitId: unit._id,
                            type: 'OVER_CAPACITY_SPIKE',
                            severity: 'WARNING',
                            timestamp: record.timestamp,
                            description: `Energy spike detected: ${energy}Wh exceeds capacity of ${capacity}W.`,
                            affectedPeriodStart: record.timestamp,
                            affectedPeriodEnd: record.timestamp
                        });
                    }

                    // 4. Data Gaps
                    if (i > 0) {
                        const prevRecord = records[i - 1];
                        const gapMs = record.timestamp.getTime() - prevRecord.timestamp.getTime();
                        const expectedGapMs = interval * 60 * 60 * 1000;

                        if (gapMs > expectedGapMs * 1.5) {
                            await createAnomalyIfNotExists({
                                solarUnitId: unit._id,
                                type: 'DATA_GAP',
                                severity: 'INFO',
                                timestamp: record.timestamp,
                                description: `Data gap detected between ${prevRecord.timestamp.toISOString()} and ${record.timestamp.toISOString()}.`,
                                affectedPeriodStart: prevRecord.timestamp,
                                affectedPeriodEnd: record.timestamp
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error detecting anomalies for unit ${unit.serialNumber}:`, error);
            }
        }
    } catch (error) {
        console.error("Error in anomaly detection job:", error);
    }
};

async function createAnomalyIfNotExists(anomalyData: any) {
    // Check if a similar anomaly already exists within the same hour
    const startOfHour = new Date(anomalyData.timestamp);
    startOfHour.setMinutes(0, 0, 0);
    const endOfHour = new Date(anomalyData.timestamp);
    endOfHour.setMinutes(59, 59, 999);

    const existing = await Anomaly.findOne({
        solarUnitId: anomalyData.solarUnitId,
        type: anomalyData.type,
        timestamp: { $gte: startOfHour, $lte: endOfHour }
    });

    if (!existing) {
        await Anomaly.create(anomalyData);
        console.log(`[Anomaly Detected] ${anomalyData.type} for unit ${anomalyData.solarUnitId}`);
    }
}
