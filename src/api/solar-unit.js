import express from "express";
import { getAllSolarUnits } from "../application/solar-unit.js";

const solarUnitRouter = express.Router();

solarUnitRouter.route("/").get(getAllSolarUnits);
// solarUnitRouter.route("/:id").get().put().delete();


export default solarUnitRouter;
