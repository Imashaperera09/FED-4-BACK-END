import express from "express";
import { getAllEnergyGenerationRecordsBySolarUnitId, getCapacityFactorBySolarUnitId } from "../application/energy-generation-record";
const energyGenerationRecordRouter = express.Router();
energyGenerationRecordRouter
    .route("/solar-unit/:id")
    .get(getAllEnergyGenerationRecordsBySolarUnitId);
energyGenerationRecordRouter
    .route("/capacity-factor/:id")
    .get(getCapacityFactorBySolarUnitId);
export default energyGenerationRecordRouter;
