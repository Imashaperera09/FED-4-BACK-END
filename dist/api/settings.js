import express from "express";
import { SystemSetting } from "../infrastructure/entities/SystemSetting";
const settingsRouter = express.Router();
// Get settings (create default if not exists)
settingsRouter.get("/", async (req, res, next) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({});
        }
        res.status(200).json(settings);
    }
    catch (error) {
        next(error);
    }
});
// Update settings
settingsRouter.put("/", async (req, res, next) => {
    try {
        const { appName, maintenanceMode, emailNotifications, logRetention } = req.body;
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({ appName, maintenanceMode, emailNotifications, logRetention });
        }
        else {
            settings.appName = appName ?? settings.appName;
            settings.maintenanceMode = maintenanceMode ?? settings.maintenanceMode;
            settings.emailNotifications = emailNotifications ?? settings.emailNotifications;
            settings.logRetention = logRetention ?? settings.logRetention;
            await settings.save();
        }
        res.status(200).json(settings);
    }
    catch (error) {
        next(error);
    }
});
export default settingsRouter;
