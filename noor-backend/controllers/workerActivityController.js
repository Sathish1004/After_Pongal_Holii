const db = require('../config/db');

/**
 * Worker Activity Controller
 * Handles daily activity logging for workers including:
 * - Attendance
 * - Tasks Assigned
 * - Tasks Completed
 * - Overtime
 */

// Get worker activity data for a specific worker
exports.getWorkerActivity = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { startDate, endDate } = req.query;

        // Default to current month if no dates provided
        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        const query = `
            SELECT 
                activity_date,
                metric_type,
                is_checked
            FROM worker_daily_activity
            WHERE worker_id = ?
            AND activity_date BETWEEN ? AND ?
            ORDER BY activity_date ASC
        `;

        const [rows] = await db.query(query, [workerId, start, end]);

        // Transform data into week-based structure
        const activityData = transformToWeeklyData(rows, start, end);

        res.json({
            success: true,
            workerId,
            startDate: start,
            endDate: end,
            activityData
        });
    } catch (error) {
        console.error('Error fetching worker activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch worker activity',
            error: error.message
        });
    }
};

// Toggle activity status for a specific day and metric
exports.toggleActivity = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { activityDate, metricType, isChecked } = req.body;

        // Validate metric type
        const validMetrics = ['attendance', 'tasks_assigned', 'tasks_completed', 'overtime'];
        if (!validMetrics.includes(metricType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid metric type'
            });
        }

        // Check if record exists
        const checkQuery = `
            SELECT id FROM worker_daily_activity
            WHERE worker_id = ? AND activity_date = ? AND metric_type = ?
        `;
        const [existing] = await db.query(checkQuery, [workerId, activityDate, metricType]);

        if (existing.length > 0) {
            // Update existing record
            const updateQuery = `
                UPDATE worker_daily_activity
                SET is_checked = ?, updated_at = NOW()
                WHERE id = ?
            `;
            await db.query(updateQuery, [isChecked, existing[0].id]);
        } else {
            // Insert new record
            const insertQuery = `
                INSERT INTO worker_daily_activity 
                (worker_id, activity_date, metric_type, is_checked, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            `;
            await db.query(insertQuery, [workerId, activityDate, metricType, isChecked]);
        }

        res.json({
            success: true,
            message: 'Activity updated successfully',
            data: {
                workerId,
                activityDate,
                metricType,
                isChecked
            }
        });
    } catch (error) {
        console.error('Error toggling activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update activity',
            error: error.message
        });
    }
};

// Get productivity trend for a worker
exports.getProductivityTrend = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { startDate, endDate } = req.query;

        const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        const query = `
            SELECT 
                WEEK(activity_date, 1) as week_number,
                COUNT(CASE WHEN metric_type = 'tasks_completed' AND is_checked = 1 THEN 1 END) as completed_count,
                COUNT(CASE WHEN metric_type = 'tasks_assigned' AND is_checked = 1 THEN 1 END) as assigned_count
            FROM worker_daily_activity
            WHERE worker_id = ?
            AND activity_date BETWEEN ? AND ?
            GROUP BY week_number
            ORDER BY week_number ASC
        `;

        const [rows] = await db.query(query, [workerId, start, end]);

        // Calculate completion percentage per week
        const trend = rows.map(row => ({
            week: `W${row.week_number}`,
            completionRate: row.assigned_count > 0
                ? Math.round((row.completed_count / row.assigned_count) * 100)
                : 0,
            tasksCompleted: row.completed_count,
            tasksAssigned: row.assigned_count
        }));

        res.json({
            success: true,
            workerId,
            trend
        });
    } catch (error) {
        console.error('Error fetching productivity trend:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch productivity trend',
            error: error.message
        });
    }
};

// Get worker details with basic stats
exports.getWorkerDetails = async (req, res) => {
    try {
        const { workerId } = req.params;

        const workerQuery = `
            SELECT id, name, email, phone, role, status
            FROM employees
            WHERE id = ?
        `;
        const [worker] = await db.query(workerQuery, [workerId]);

        if (worker.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        // Get current month stats
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const statsQuery = `
            SELECT 
                COUNT(CASE WHEN metric_type = 'attendance' AND is_checked = 1 THEN 1 END) as attendance_days,
                COUNT(CASE WHEN metric_type = 'tasks_completed' AND is_checked = 1 THEN 1 END) as tasks_completed,
                COUNT(CASE WHEN metric_type = 'overtime' AND is_checked = 1 THEN 1 END) as overtime_days
            FROM worker_daily_activity
            WHERE worker_id = ?
            AND MONTH(activity_date) = ?
            AND YEAR(activity_date) = ?
        `;
        const [stats] = await db.query(statsQuery, [workerId, currentMonth, currentYear]);

        res.json({
            success: true,
            worker: worker[0],
            monthlyStats: stats[0]
        });
    } catch (error) {
        console.error('Error fetching worker details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch worker details',
            error: error.message
        });
    }
};

// Helper function to transform data into weekly structure
function transformToWeeklyData(rows, startDate, endDate) {
    const weeks = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Initialize 4 weeks structure
    for (let i = 1; i <= 4; i++) {
        weeks[`Week ${i}`] = {
            attendance: Array(7).fill(false),
            tasks_assigned: Array(7).fill(false),
            tasks_completed: Array(7).fill(false),
            overtime: Array(7).fill(false)
        };
    }

    // Fill in actual data
    rows.forEach(row => {
        const date = new Date(row.activity_date);
        const daysSinceStart = Math.floor((date - start) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(daysSinceStart / 7);
        const dayIndex = daysSinceStart % 7;

        if (weekIndex >= 0 && weekIndex < 4 && dayIndex >= 0 && dayIndex < 7) {
            const weekKey = `Week ${weekIndex + 1}`;
            if (weeks[weekKey] && weeks[weekKey][row.metric_type]) {
                weeks[weekKey][row.metric_type][dayIndex] = row.is_checked === 1;
            }
        }
    });

    return weeks;
}

module.exports = exports;
