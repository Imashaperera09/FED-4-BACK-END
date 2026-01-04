import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { NextFunction, Request, Response } from "express";
import { NotFoundError, ValidationError } from "../domain/errors/errors";
import mongoose from "mongoose";

export const getAllEnergyGenerationRecordsBySolarUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { groupBy } = req.query;

    if (!groupBy) {
      const energyGenerationRecords = await EnergyGenerationRecord.find({
        solarUnitId: id,
      }).sort({ timestamp: -1 });
      res.status(200).json(energyGenerationRecords);
      return;
    }

    if (groupBy === "date") {
      const energyGenerationRecords = await EnergyGenerationRecord.aggregate([
        {
          $match: {
            solarUnitId: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
            },
            totalEnergyGenerated: { $sum: "$energyGenerated" },
          },
        },
        {
          $sort: { "_id.date": -1 },
        },
      ]);
      res
        .status(200)
        .json(
          energyGenerationRecords.slice(
            0,
            parseInt(req.query.limit as string) || energyGenerationRecords.length
          )
        );
      return;
    }
  } catch (error) {
    next(error);
  }
};

export const getCapacityFactorBySolarUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }

    const capacity = solarUnit.capacity; // in kW

    const records = await EnergyGenerationRecord.aggregate([
      {
        $match: {
          solarUnitId: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
          },
          totalEnergyGenerated: { $sum: "$energyGenerated" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    const capacityFactorData = records.map((record) => {
      // Theoretical maximum energy in a day (24 hours)
      // Capacity Factor = (Actual Energy / (Capacity * Time)) * 100
      // For a full day: (totalEnergyGenerated / (capacity * 24)) * 100
      const actualEnergy = record.totalEnergyGenerated;
      const theoreticalMax = capacity * 24;
      const capacityFactor = (actualEnergy / theoreticalMax) * 100;

      return {
        date: record._id.date,
        capacityFactor: parseFloat(capacityFactor.toFixed(2)),
        actualEnergy,
      };
    });

    res.status(200).json(capacityFactorData);
  } catch (error) {
    next(error);
  }
};
