import express from "express";
import dotenv from "dotenv/config";
import solarUnitRouter from "./api/solar-unit.js";
import { connectDB } from "./infrastructure/db.js";


const server = express();
server.use(express.json());

server.use("/api/solar-units", solarUnitRouter);


// Connect to MongoDB before starting the server
connectDB();

console.log("process")

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
