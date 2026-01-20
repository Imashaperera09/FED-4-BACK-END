import mongoose from 'mongoose';
import { triggerSync } from './jobs/energy-sync-job';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://imashaperera09_db_user:1234@cluster0.sq36bbb.mongodb.net/test?retryWrites=true&w=majority";

async function runSync() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB.");

        await triggerSync();

        console.log("Sync completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error during manual sync:", error);
        process.exit(1);
    }
}

runSync();
