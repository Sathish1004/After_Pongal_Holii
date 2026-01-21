const fs = require('fs');
const db = require('../config/db');

async function checkSchema() {
    try {
        const tables = ['phases', 'tasks', 'transactions'];
        let output = '';
        for (const table of tables) {
            const [rows] = await db.query(`SHOW CREATE TABLE ${table}`);
            output += `\n\n--- ${table.toUpperCase()} ---\n`;
            output += rows[0]['Create Table'];
        }
        fs.writeFileSync('scripts/schema_output.txt', output);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
