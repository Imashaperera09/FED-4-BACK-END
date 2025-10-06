import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord.js"; 

export const getAllEnergyGenerationRecordsBySolarUnitId = async (req, res) => {
    try {
        console.log("GET ENERGY RECORDS FOR SOLAR UNIT:", req.params.solarUnitId);
        const energyGenerationRecords = await EnergyGenerationRecord.find({
            solarUnitId: req.params.solarUnitId,
         });
        console.log("FOUND ENERGY RECORDS:", energyGenerationRecords.length);
        res.status(200).json(energyGenerationRecords);
    } catch (error) {
        console.error("ENERGY RECORDS ERROR:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};