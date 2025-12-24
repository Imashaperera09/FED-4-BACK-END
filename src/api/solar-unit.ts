import express from "express";
import {
  getAllSolarUnits,
  createSolarUnit,
  getSolarUnitById,
  updateSolarUnit,
  deleteSolarUnit,
  createSolarUnitValidator,
  getSolarUnitForUser,
  updateSolarUnitValidator,
} from "../application/solar-unit";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
import { authorizationMiddleware } from "./middlewares/authorization-middleware";

const solarUnitRouter = express.Router();

solarUnitRouter.route("/").get(getAllSolarUnits).post(createSolarUnitValidator, createSolarUnit);
solarUnitRouter.route("/me").get(getSolarUnitForUser);
solarUnitRouter
  .route("/:id")
  .get(getSolarUnitById)
  .put(updateSolarUnitValidator, updateSolarUnit)
  .delete(deleteSolarUnit);

export default solarUnitRouter;
