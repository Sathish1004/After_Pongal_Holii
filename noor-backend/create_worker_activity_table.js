const db = require('./config/db');

async function createWorkerActivityTable() {
    try {
        console.log('Creating worker_daily_activity table...');

        // Create table without foreign key first
        const createQuery = `
            CREATE TABLE IF NOT EXISTS worker_daily_activity (
                id INT AUTO_INCREMENT PRIMARY KEY,
                worker_id INT NOT NULL,
                activity_date DATE NOT NULL,
                metric_type ENUM('attendance', 'tasks_assigned', 'tasks_completed', 'overtime') NOT NULL,
                is_checked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_worker_date_metric (worker_id, activity_date, metric_type),
                INDEX idx_worker_date (worker_id, activity_date),
                INDEX idx_metric_type (metric_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;

        await db.query(createQuery);
        console.log('✓ worker_daily_activity table created successfully');

        // Verify table structure
        const [columns] = await db.query('DESCRIBE worker_daily_activity');
        console.log('\nTable structure:');
        console.table(columns);

        console.log('\n✓ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating worker_daily_activity table:', error.message);
        process.exit(1);
    }
}

createWorkerActivityTable();
