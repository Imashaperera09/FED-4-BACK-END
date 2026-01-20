
import { User } from "./src/infrastructure/entities/User";
import mongoose from "mongoose";
import "dotenv/config";

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);

        const user = await User.findOne({}); // Find any user or update with specific criteria

        if (user) {
            console.log("User Found:");
            console.log("MongoDB ID (_id):", user._id.toString());
            console.log("Clerk ID (clerkId):", user.clerkUserId);
        } else {
            console.log("User not found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
