const db = require('./config/db');

async function addProjectStatus() {
    try {
        console.log('Adding completion_status and completion_percentage columns to sites...');

        const updates = [
            "ADD COLUMN completion_status ENUM('IN_PROGRESS', 'COMPLETED') DEFAULT 'IN_PROGRESS'",
            "ADD COLUMN completion_percentage DECIMAL(5,2) DEFAULT 0.00",
            "ADD COLUMN completed_at DATETIME DEFAULT NULL"
        ];

        for (const update of updates) {
            try {
                await db.query(`ALTER TABLE sites ${update}`);
                console.log(`Executed: ${update}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipped (exists): ${update}`);
                } else {
                    console.error(`Error: ${update}`, err.message);
                }
            }
        }

        console.log('Successfully added project status columns!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addProjectStatus();
