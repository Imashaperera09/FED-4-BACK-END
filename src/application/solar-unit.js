import { solarUnits } from "../infrastructure/data.js";
import { v4 as uuidv4 } from "uuid";

export const getAllSolarUnits = (req, res) => {
    console.log("GET /api/solar-units endpoint hit!");
    res.status(200).json(solarUnits);
};

export const createSolarUnit = (req, res) => {
    const { userId, serialNumber, installationDate, capacity, status } = req.body;
    
    const newSolarUnit = { 
       _id: uuidv4(), //To generate random id
        userId, 
        serialNumber,
        installationDate,
        capacity,
        status,
    };

    solarUnits.push(newSolarUnit);
    res.status(201).json(newSolarUnit);
};

export const getSolarUnitById = (req, res) => {
    const { id } = req.params;
    const solarUnit = solarUnits.find((solarUnit) => solarUnit._id === id);
   
    if (!solarUnit) {
         return res.status(404).json({ message: "Solar Unit not found" });
    }

    res.status(200).json(solarUnit);
};

export const updateSolarUnit = (req, res) => {
    const { id } = req.params;
    const { userId, serialNumber, installationDate, capacity, status } = req.body;

    const solarUnit = solarUnits.find((solarUnit) => solarUnit._id === id);

    if (!solarUnit) {
        return res.status(404).json({ message: "Solar Unit not found" });
    }

    solarUnit.userId = userId;
    solarUnit.serialNumber = serialNumber;
    solarUnit.installationDate = installationDate;
    solarUnit.capacity = capacity;
    solarUnit.status = status;

    res.status(200).json(solarUnit);
};

export const deleteSolarUnit = (req, res) => {
    const { id } = req.params;
    const idx = solarUnits.findIndex((solarUnit) => solarUnit._id === id);

    if (idx === -1) {
        return res.status(404).json({ message: "Solar Unit not found" });
    }

    solarUnits.splice(idx, 1);
    res.status(204).send();
};
