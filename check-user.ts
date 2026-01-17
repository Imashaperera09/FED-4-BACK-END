
import { User } from "./src/infrastructure/entities/User";
import mongoose from "mongoose";
import "dotenv/config";

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);

        const user = await User.findOne({ firstName: "Imasha" });

        if (user) {
            console.log("User Found:");
            console.log("MongoDB ID (_id):", user._id.toString());
            console.log("Clerk ID (clerkId):", user.clerkUserId);
        } else {
            console.log("User 'Imasha' not found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
