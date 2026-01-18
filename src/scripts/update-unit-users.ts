
import mongoose from "mongoose";
import { User } from "../infrastructure/entities/User";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import "dotenv/config";

async function updateUnitUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        // 1. Find or Create User 2 (John Doe)
        let user2 = await User.findOne({ email: "john@example.com" });
        if (!user2) {
            user2 = await User.create({
                clerkUserId: "user_john_doe_123",
                email: "john@example.com",
                firstName: "John",
                lastName: "Doe",
                role: "USER"
            });
            console.log("Created User: John Doe");
        } else {
            console.log("Found User: John Doe");
        }

        // 2. Find or Create User 3 (Jane Smith)
        let user3 = await User.findOne({ email: "jane@example.com" });
        if (!user3) {
            user3 = await User.create({
                clerkUserId: "user_jane_smith_456",
                email: "jane@example.com",
                firstName: "Jane",
                lastName: "Smith",
                role: "USER"
            });
            console.log("Created User: Jane Smith");
        } else {
            console.log("Found User: Jane Smith");
        }

        // 3. Update SU-0002
        const unit2 = await SolarUnit.findOne({ serialNumber: "SU-0002" });
        if (unit2) {
            unit2.userId = user2._id;
            await unit2.save();
            console.log("Assigned SU-0002 to John Doe");
        } else {
            console.log("SU-0002 not found");
        }

        // 4. Update SU-0003
        const unit3 = await SolarUnit.findOne({ serialNumber: "SU-0003" });
        if (unit3) {
            unit3.userId = user3._id;
            await unit3.save();
            console.log("Assigned SU-0003 to Jane Smith");
        } else {
            console.log("SU-0003 not found");
        }

    } catch (error) {
        console.error("Error updating users:", error);
    } finally {
        await mongoose.disconnect();
    }
}

updateUnitUsers();
