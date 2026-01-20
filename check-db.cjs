const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({ email: String, clerkUserId: String });
const SolarUnitSchema = new mongoose.Schema({ serialNumber: String, userId: mongoose.Schema.Types.ObjectId });
const EnergyGenerationRecordSchema = new mongoose.Schema({ solarUnitId: mongoose.Schema.Types.ObjectId, energyGenerated: Number, timestamp: Date });

const User = mongoose.model("User", UserSchema);
const SolarUnit = mongoose.model("SolarUnit", SolarUnitSchema);
const EnergyGenerationRecord = mongoose.model("EnergyGenerationRecord", EnergyGenerationRecordSchema);

async function checkDb() {
    try {
        await mongoose.connect("mongodb+srv://imashaperera09_db_user:1234@cluster0.sq36bbb.mongodb.net/test?retryWrites=true&w=majority");
        const user = await User.findOne({ email: "imashachamodi0609@gmail.com" });
        const unit = await SolarUnit.findById("696d19e282e4f058c828fe51");

        const records = await EnergyGenerationRecord.find({ solarUnitId: "696d19e282e4f058c828fe51" }).sort({ timestamp: -1 }).limit(10);

        console.log(JSON.stringify({ user, unit, recordsCount: records.length, latestRecords: records }, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDb();
