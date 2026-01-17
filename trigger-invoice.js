
async function triggerInvoice() {
    try {
        const response = await fetch('http://localhost:8000/api/invoices/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                solarUnitId: "69628a731777df70aa20a28a"
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
        }

        const data = await response.json();
        console.log('Invoice generated successfully:', data);

    } catch (error) {
        console.error('Error triggering invoice:', error.message);
    }
}

triggerInvoice();
