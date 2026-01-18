import mongoose, { Schema } from "mongoose";
const SystemSettingSchema = new Schema({
    appName: { type: String, default: "SolarNova Admin" },
    maintenanceMode: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    logRetention: { type: Number, default: 30 },
}, { timestamps: true });
export const SystemSetting = mongoose.model("SystemSetting", SystemSettingSchema);
