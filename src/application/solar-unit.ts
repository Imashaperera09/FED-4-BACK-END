import { z } from "zod";
import { CreateSolarUnitDto, UpdateSolarUnitDto } from "../domain/dtos/solar-unit";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { NextFunction, Request, Response } from "express";
import { NotFoundError, ValidationError } from "../domain/errors/errors";
import { User } from "../infrastructure/entities/User";
import { getAuth } from "@clerk/express";

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
    const solarUnit = await SolarUnit.findById(id).populate("userId");

    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    res.status(200).json(solarUnit);
  } catch (error) {
    next(error);
  }
};

export const getSolarUnitForUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;

    const user = await User.findOne({ clerkUserId });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const solarUnits = await SolarUnit.find({ userId: user._id });
    res.status(200).json(solarUnits[0]);
  } catch (error) {
    next(error);
  }
};

export const updateSolarUnitValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = UpdateSolarUnitDto.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  next();
};

export const updateSolarUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { serialNumber, installationDate, capacity, status, userId, userEmail } = req.body;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }

    console.log("Update Solar Unit Request Body:", req.body);
    let finalUserId = userId;

    if (userEmail) {
      console.log("Searching for user with email:", userEmail);
      let user = await User.findOne({ email: userEmail.toLowerCase() });
      if (!user) {
        console.log("Creating placeholder user for email:", userEmail);
        // Create placeholder user
        user = await User.create({
          email: userEmail.toLowerCase(),
          firstName: "New",
          lastName: "User",
        });
      }
      finalUserId = user._id;
    }

    console.log("Final User ID for update:", finalUserId);

    const beforeUpdate = await SolarUnit.findById(id);
    console.log("Solar Unit BEFORE update:", beforeUpdate);

    const updatedSolarUnit = await SolarUnit.findByIdAndUpdate(
      id,
      {
        serialNumber,
        installationDate: new Date(installationDate),
        capacity,
        status,
        userId: finalUserId === "none" ? null : (finalUserId || null),
      },
      { new: true }
    );

    console.log("Updated Solar Unit Result:", updatedSolarUnit);

    const afterUpdate = await SolarUnit.findById(id);
    console.log("Solar Unit AFTER update (fresh fetch):", afterUpdate);

    res.status(200).json(updatedSolarUnit);
  } catch (error) {
    next(error);
  }
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
