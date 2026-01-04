import express, { Request, Response, NextFunction } from "express";

const weatherRouter = express.Router();

weatherRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat = 52.52, lon = 13.41 } = req.query; // Default to Berlin if not provided

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,shortwave_radiation`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data from Open-Meteo");
    }

    const data = await response.json();
    res.status(200).json(data.current);
  } catch (error) {
    next(error);
  }
});

export default weatherRouter;
