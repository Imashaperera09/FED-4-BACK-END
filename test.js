import { connectDB } from "./src/infrastructure/db.js";
import mongoose from "mongoose";

const runTest = async () => {
    try {
        console.log("A");
        await connectDB();
        console.log("B");
        
        // Small delay to ensure clean output
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Close the MongoDB connection to exit the process
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
        
        // Exit cleanly
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
};

runTest();
