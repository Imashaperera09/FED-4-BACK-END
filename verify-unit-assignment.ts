import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stemlink';

async function verify() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const solarUnitId = '696d19e282e4f058c828fe51'; // From the user's screenshot URL

        const SolarUnit = mongoose.model('SolarUnit', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            serialNumber: String,
        }));

        const unit = await SolarUnit.findById(solarUnitId);
        console.log('Current Solar Unit in DB:', JSON.stringify(unit, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

verify();
