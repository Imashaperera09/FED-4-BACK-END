
import mongoose from "mongoose";
import { User } from "../infrastructure/entities/User";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import "dotenv/config";

async function listData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        const users = await User.find();
        console.log("Users:", users.map(u => ({ id: u._id, name: u.firstName + ' ' + u.lastName, clerkId: u.clerkUserId })));

        const units = await SolarUnit.find();
        console.log("Units:", units.map(u => ({ id: u._id, serial: u.serialNumber, userId: u.userId })));

    } catch (error) {
        console.error("Error listing data:", error);
    } finally {
        await mongoose.disconnect();
    }
}

listData();
