import { z } from "zod";
import { CreateSolarUnitDto } from "../domain/dtos/solar-unit";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { User } from "../infrastructure/entities/User";
import { NextFunction, Request, Response } from "express";
import { NotFoundError, ValidationError } from "../domain/errors/errors";

export const getAllSolarUnits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const solarUnits = await SolarUnit.find();
    res.status(200).json(solarUnits);
  } catch (error) {
    next(error);
  }
};

export const createSolarUnitValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = CreateSolarUnitDto.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  next();
};

export const createSolarUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: z.infer<typeof CreateSolarUnitDto> = req.body;

    const newSolarUnit = {
      serialNumber: data.serialNumber,
      installationDate: new Date(data.installationDate),
      capacity: data.capacity,
      status: data.status,
      userId: data.userId,
    };

    const createdSolarUnit = await SolarUnit.create(newSolarUnit);
    res.status(201).json(createdSolarUnit);
  } catch (error) {
    next(error);
  }
};

export const getSolarUnitById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    res.status(200).json(solarUnit);
  } catch (error) {
    next(error);
  }
};

export const updateSolarUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { serialNumber, installationDate, capacity, status } = req.body;
  const solarUnit = await SolarUnit.findById(id);

  if (!solarUnit) {
    throw new NotFoundError("Solar unit not found");
  }

  const updatedSolarUnit = await SolarUnit.findByIdAndUpdate(id, {
    serialNumber,
    installationDate,
    capacity,
    status,
  });

  res.status(200).json(updatedSolarUnit);
};

export const deleteSolarUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }

    await SolarUnit.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getSolarUnitByClerkUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clerkUserId } = req.params;
    console.log("Looking up user with clerkUserId:", clerkUserId);
    const user = await User.findOne({ clerkUserId });

    if (!user) {
      console.log("User not found for clerkUserId:", clerkUserId);
      throw new NotFoundError("User not found");
    }
    const solarUnits = await SolarUnit.find({ userId: user._id });
    if (!solarUnits.length) {
      console.log("No solar units found for user:", user._id);
      return res.status(200).json(null); // Return null if no solar units found
    }
    res.status(200).json(solarUnits[0]); // Return only the first solar unit
  } catch (error) {
    next(error);
  }
};
