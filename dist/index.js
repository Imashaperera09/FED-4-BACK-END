import express from "express";
import "dotenv/config";
import solarUnitRouter from "./api/solar-unit";
import { connectDB } from "./infrastructure/db";
import energyGenerationRecordRouter from "./api/energy-generation-record";
const server = express();
server.use(express.json());
server.use("/api/solar-units", solarUnitRouter);
server.use("/api/energy-generation-records", energyGenerationRecordRouter);
// Connect to MongoDB before starting the server
connectDB();
console.log("process");
const PORT = 8002;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
/*Identify the resources
Solar Unit
Energy Generation Record
User
House
*/
