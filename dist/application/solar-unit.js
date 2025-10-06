import { SolarUnit } from "../infrastructure/entities/SolarUnit";
export const getAllSolarUnits = async (req, res) => {
    try {
        console.log("GET ALL SOLAR UNITS REQUEST");
        const solarUnits = await SolarUnit.find();
        console.log("FOUND SOLAR UNITS:", solarUnits.length, "documents");
        res.status(200).json(solarUnits);
    }
    catch (error) {
        console.error("GET ALL ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const createSolarUnit = async (req, res) => {
    try {
        console.log("CREATE REQUEST RECEIVED:", req.body);
        const { serialNumber, installationDate, capacity, status } = req.body;
        const newSolarUnit = {
            serialNumber,
            installationDate,
            capacity,
            status,
        };
        console.log("ABOUT TO CREATE:", newSolarUnit);
        const createdSolarUnit = await SolarUnit.create(newSolarUnit);
        console.log("CREATED SUCCESSFULLY:", createdSolarUnit);
        res.status(201).json(createdSolarUnit);
    }
    catch (error) {
        console.error("CREATE ERROR:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
};
export const getSolarUnitById = async (req, res) => {
    try {
        const { id } = req.params;
        const solarUnit = await SolarUnit.findById(id);
        if (!solarUnit) {
            res.status(404).json({ message: "Solar unit not found" });
            return;
        }
        res.status(200).json(solarUnit);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
export const updateSolarUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const { serialNumber, installationDate, capacity, status } = req.body;
        const solarUnit = await SolarUnit.findById(id);
        if (!solarUnit) {
            res.status(404).json({ message: "Solar unit not found" });
            return;
        }
        const updatedSolarUnit = await SolarUnit.findByIdAndUpdate(id, {
            serialNumber,
            installationDate,
            capacity,
            status,
        }, { new: true }); // Return the updated document
        res.status(200).json(updatedSolarUnit);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
export const deleteSolarUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const solarUnit = await SolarUnit.findById(id);
        if (!solarUnit) {
            res.status(404).json({ message: "Solar unit not found" });
            return;
        }
        await SolarUnit.findByIdAndDelete(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
