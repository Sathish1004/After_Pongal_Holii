const db = require('../config/db');

/**
 * Auto-log worker daily activity
 * @param {number} workerId - Employee ID
 * @param {string} metricType - 'attendance' | 'tasks_assigned' | 'tasks_completed' | 'overtime'
 * @param {string} activityDate - Date in YYYY-MM-DD format (optional, defaults to today)
 */
const logWorkerActivity = async (workerId, metricType, activityDate = null) => {
    try {
        const date = activityDate || new Date().toISOString().split('T')[0];

        // Insert or update activity log
        await db.query(`
            INSERT INTO worker_daily_activity (worker_id, activity_date, metric_type, is_checked)
            VALUES (?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE 
                is_checked = TRUE,
                updated_at = CURRENT_TIMESTAMP
        `, [workerId, date, metricType]);

        console.log(`✓ Activity logged: Worker ${workerId} - ${metricType} on ${date}`);
    } catch (error) {
        console.error('Error logging worker activity:', error);
    }
};

/**
 * Log task assignment activity
 * @param {number} workerId - Employee ID
 * @param {string} assignmentDate - Date when task was assigned
 */
const logTaskAssigned = async (workerId, assignmentDate = null) => {
    await logWorkerActivity(workerId, 'tasks_assigned', assignmentDate);
};

/**
 * Log task completion activity (also marks attendance)
 * @param {number} workerId - Employee ID  
 * @param {string} completionDate - Date when task was completed
 */
const logTaskCompleted = async (workerId, completionDate = null) => {
    const date = completionDate || new Date().toISOString().split('T')[0];

    // Mark both task completed AND attendance
    await logWorkerActivity(workerId, 'tasks_completed', date);
    await logWorkerActivity(workerId, 'attendance', date);
};

/**
 * Log overtime activity
 * @param {number} workerId - Employee ID
 * @param {string} overtimeDate - Date of overtime
 */
const logOvertime = async (workerId, overtimeDate = null) => {
    await logWorkerActivity(workerId, 'overtime', overtimeDate);
};

/**
 * Lock worker activity logs after admin approval
 * This makes the activity immutable and permanent
 * @param {number} workerId - Employee ID
 * @param {string} activityDate - Date to lock (optional, defaults to today)
 * @param {number} adminId - ID of admin who approved
 */
const lockWorkerActivity = async (workerId, activityDate = null, adminId) => {
    try {
        const date = activityDate || new Date().toISOString().split('T')[0];

        // Lock all activity types for this worker on this date
        await db.query(`
            UPDATE worker_daily_activity
            SET is_locked = TRUE,
                locked_by = ?,
                locked_at = CURRENT_TIMESTAMP
            WHERE worker_id = ?
            AND activity_date = ?
            AND is_checked = TRUE
        `, [adminId, workerId, date]);

        console.log(`🔒 Activity locked: Worker ${workerId} on ${date} by Admin ${adminId}`);
    } catch (error) {
        console.error('Error locking worker activity:', error);
    }
};

module.exports = {
    logWorkerActivity,
    logTaskAssigned,
    logTaskCompleted,
    logOvertime,
    lockWorkerActivity
};
