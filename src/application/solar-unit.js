import { solarUnits } from "../infrastructure/data.js";

export const getAllSolarUnits = (req, res) => {
    res.status(200).json(solarUnits);
};