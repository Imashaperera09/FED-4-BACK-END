import express from "express";
import { getAllEnergyGenerationRecordsBySolarUnitId } from "../application/energy-generation-record.js";

const energyGenerationRecordRouter = express.Router();

energyGenerationRecordRouter
    .route("/solar-unit/:id")
    .get(getAllEnergyGenerationRecordsBySolarUnitId);

export default energyGenerationRecordRouter;