import mongoose from 'mongoose';
export const connectDB = async () => {
    try {
        console.log("Connecting to MongoDB...");
        const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://imashaperera09_db_user:1234@cluster0.sq36bbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
    }
    catch (error) {
        console.error("Error while connecting to MongoDB:", error);
    }
};
