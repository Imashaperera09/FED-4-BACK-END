import express from "express";
import {
  getAllSolarUnits,
  createSolarUnit,
  updateSolarUnit,
  deleteSolarUnit,
  createSolarUnitValidator,
  getSolarUnitByClerkUserId,
} from "../application/solar-unit";

const solarUnitRouter = express.Router();

solarUnitRouter.route("/").get(getAllSolarUnits).post(createSolarUnitValidator, createSolarUnit);
solarUnitRouter
  .route("/:id")
  .put(updateSolarUnit)
  .delete(deleteSolarUnit);

// Route for getting solar unit(s) by Clerk user ID
solarUnitRouter.route("/user/:clerkUserId").get(getSolarUnitByClerkUserId);

export default solarUnitRouter;
