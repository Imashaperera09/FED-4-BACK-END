import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
export const getAllEnergyGenerationRecordsBySolarUnitId = async (req, res) => {
    try {
        const energyGenerationRecords = await EnergyGenerationRecord.find({
            solarUnitId: req.params.solarUnitId,
        });
        res.status(200).json(energyGenerationRecords);
    }
    catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
