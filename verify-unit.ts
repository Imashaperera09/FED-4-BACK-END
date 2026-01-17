
import { SolarUnit } from "./src/infrastructure/entities/SolarUnit";
import mongoose from "mongoose";
import "dotenv/config";
import fs from "fs";

async function verifyUnit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);

        const allUnits = await SolarUnit.find({});

        let output = "";
        allUnits.forEach(u => {
            output += `ID: ${u._id}, UserID: ${u.userId}, Serial: ${u.serialNumber}\n`;
        });

        fs.writeFileSync("units.txt", output);
        console.log("Units written to units.txt");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyUnit();
