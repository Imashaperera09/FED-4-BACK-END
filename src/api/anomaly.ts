import express, { Request, Response, NextFunction } from "express";
import { Anomaly } from "../infrastructure/entities/Anomaly";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { User } from "../infrastructure/entities/User";
import { getAuth } from "@clerk/express";
import { NotFoundError, ValidationError } from "../domain/errors/errors";

const anomalyRouter = express.Router();

// Admin: Get all anomalies
anomalyRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, severity, status } = req.query;
        const filter: any = {};
        if (type) filter.type = type;
        if (severity) filter.severity = severity;
        if (status) filter.status = status;

        const anomalies = await Anomaly.find(filter)
            .populate({
                path: 'solarUnitId',
                populate: {
                    path: 'userId',
                    model: 'User'
                }
            })
            .sort({ timestamp: -1 });
        res.status(200).json(anomalies);
    } catch (error) {
        next(error);
    }
});

// User: Get anomalies for their solar units
anomalyRouter.get("/user", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = getAuth(req);
        const clerkUserId = auth.userId;
        console.log("Anomaly User Route - Clerk User ID from Auth:", clerkUserId);

        const user = await User.findOne({ clerkUserId });
        console.log("Anomaly User Route - User found in DB:", user);
        if (!user) throw new NotFoundError("User not found");

        const solarUnits = await SolarUnit.find({ userId: user._id });
        const unitIds = solarUnits.map(u => u._id);

        const { type, severity, status } = req.query;
        const filter: any = { solarUnitId: { $in: unitIds } };
        if (type) filter.type = type;
        if (severity) filter.severity = severity;
        if (status) filter.status = status;

        const anomalies = await Anomaly.find(filter).sort({ timestamp: -1 });
        res.status(200).json(anomalies);
    } catch (error) {
        next(error);
    }
});

// Get anomalies for a specific solar unit
anomalyRouter.get("/solar-unit/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { type, severity, status } = req.query;
        const filter: any = { solarUnitId: id };
        if (type) filter.type = type;
        if (severity) filter.severity = severity;
        if (status) filter.status = status;

        const anomalies = await Anomaly.find(filter).sort({ timestamp: -1 });
        res.status(200).json(anomalies);
    } catch (error) {
        next(error);
    }
});

// Resolve an anomaly
anomalyRouter.patch("/:id/resolve", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const anomaly = await Anomaly.findByIdAndUpdate(id, { status: "RESOLVED" }, { new: true });
        if (!anomaly) throw new NotFoundError("Anomaly not found");
        res.status(200).json(anomaly);
    } catch (error) {
        next(error);
    }
});

export default anomalyRouter;
