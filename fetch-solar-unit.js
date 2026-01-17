
import fs from 'fs';

async function fetchSolarUnit() {
    try {
        const unitsRes = await fetch('http://localhost:8000/api/solar-units');
        const units = await unitsRes.json();

        const userId = "69629467d87e67616ba80aa5";
        const unit = units.find(u => u.userId === userId || (u.userId && u.userId._id === userId));

        let output = '';
        if (unit) {
            output += `SOLAR_UNIT_ID:${unit._id}\n`;
            console.log(`Found Unit: ${unit._id} for User: ${userId}`);
        } else {
            output += 'UNIT_NOT_FOUND\n';
            console.log('No unit found for user');
        }

        fs.writeFileSync('solar-unit-id.txt', output);

    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

fetchSolarUnit();
