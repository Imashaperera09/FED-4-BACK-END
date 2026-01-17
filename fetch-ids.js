
import fs from 'fs';

async function fetchData() {
    try {
        const usersRes = await fetch('http://localhost:8000/api/users');
        const users = await usersRes.json();

        const invoicesRes = await fetch('http://localhost:8000/api/invoices');
        const invoices = await invoicesRes.json();

        const imasha = users.find(u => u.firstName === 'Imasha');

        let output = '';
        if (imasha) {
            output += `USER_ID:${imasha._id}\n`;
        } else {
            output += 'USER_NOT_FOUND\n';
        }

        if (invoices.length > 0) {
            // Get the most recent invoice
            const invoice = invoices[0];
            output += `INVOICE_ID:${invoice._id}\n`;
            output += `CURRENT_INVOICE_USER_ID:${invoice.userId}\n`;
        } else {
            output += 'NO_INVOICES\n';
        }

        fs.writeFileSync('ids.txt', output);
        console.log('IDs written to ids.txt');

    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

fetchData();
