const db = require('./config/db');

/**
 * Migration: Add locking mechanism to worker_daily_activity table
 * This ensures activity logs become immutable after admin approval
 */
async function addActivityLockColumns() {
    try {
        console.log('Adding lock columns to worker_daily_activity table...');

        // Check and add is_locked column
        try {
            await db.query(`
                ALTER TABLE worker_daily_activity
                ADD COLUMN is_locked BOOLEAN DEFAULT FALSE
            `);
            console.log('✓ Added is_locked column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('  is_locked column already exists');
            } else throw err;
        }

        // Check and add locked_by column
        try {
            await db.query(`
                ALTER TABLE worker_daily_activity
                ADD COLUMN locked_by INT NULL
            `);
            console.log('✓ Added locked_by column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('  locked_by column already exists');
            } else throw err;
        }

        // Check and add locked_at column
        try {
            await db.query(`
                ALTER TABLE worker_daily_activity
                ADD COLUMN locked_at TIMESTAMP NULL
            `);
            console.log('✓ Added locked_at column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('  locked_at column already exists');
            } else throw err;
        }

        // Verify columns
        const [columns] = await db.query('DESCRIBE worker_daily_activity');
        console.log('\nUpdated table structure:');
        console.table(columns);

        console.log('\n✓ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding lock columns:', error.message);
        process.exit(1);
    }
}

addActivityLockColumns();
