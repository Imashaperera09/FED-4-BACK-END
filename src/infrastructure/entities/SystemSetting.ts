import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSetting extends Document {
    appName: string;
    maintenanceMode: boolean;
    emailNotifications: boolean;
    logRetention: number;
}

const SystemSettingSchema: Schema = new Schema({
    appName: { type: String, default: "SolarNova Admin" },
    maintenanceMode: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    logRetention: { type: Number, default: 30 },
}, { timestamps: true });

export const SystemSetting = mongoose.model<ISystemSetting>("SystemSetting", SystemSettingSchema);
