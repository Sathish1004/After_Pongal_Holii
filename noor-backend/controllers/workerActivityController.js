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
        // Ensure end date includes the full day (though split T00:00 works for BETWEEN 'YD' and 'TD')
        // Actually, simple ISO split is consistent with valid query params
        const end = endDate || new Date().toISOString().split('T')[0];

        // 1. Get Daily Attendance Log (System Generated - Attendance Only)
        // We still fetch all metrics to preserve 'locked' statuses if needed, 
        // but task counts will be overridden by real data.
        const activityQuery = `
            SELECT activity_date, metric_type, is_checked, is_locked
            FROM worker_daily_activity
            WHERE worker_id = ? AND activity_date BETWEEN ? AND ?
        `;

        // 2. Get Real Task Counts from Task Table
        // Logic: 
        // tasks_assigned = tasks CREATED/ASSIGNED on that date
        // tasks_completed = of those tasks, how many are 'completed' (approved)
        // tasks_pending = tasks_assigned - tasks_completed
        const taskQuery = `
            SELECT 
                DATE(t.created_at) as date,
                COUNT(*) as total_assigned,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as total_completed
            FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE ta.employee_id = ?
            AND t.created_at BETWEEN ? AND ?
            GROUP BY DATE(t.created_at)
        `;

        const [activityRows] = await db.query(activityQuery, [workerId, start, end]);
        // For task query, we need to ensure end date covers the full day or use DATE() comparison?
        // 'BETWEEN start AND end' compares strings/dates. 
        // If start='2026-01-21', end='2026-01-21', it might match only 00:00.
        // For safety, we append time or relying on DATE(created_at) logic?
        // In string comparison, '2026-01-21' matches '2026-01-21 00:00:00'.
        // Better: t.created_at >= start AND t.created_at <= end + ' 23:59:59'?
        // Existing query logic uses BETWEEN date strings. I'll stick to provided strings but append time for safety?
        // Or assume frontend sends inclusive range.
        // I will use `DATE(t.created_at) BETWEEN ? AND ?` to be safe against time parts.
        const taskQuerySafe = `
            SELECT 
                DATE(t.created_at) as date,
                COUNT(*) as total_assigned,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as total_completed
            FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE ta.employee_id = ?
            AND DATE(t.created_at) BETWEEN ? AND ?
            GROUP BY DATE(t.created_at)
        `;
        const [taskRows] = await db.query(taskQuerySafe, [workerId, start, end]);

        // Transform data into simple Date Map
        const activityMap = {};

        const initDate = (dateStr) => {
            if (!activityMap[dateStr]) {
                activityMap[dateStr] = {
                    attendance: false,
                    tasks_assigned: 0,
                    tasks_completed: 0,
                    tasks_pending: 0,
                    attendance_locked: false,
                    tasks_assigned_locked: false,
                    tasks_completed_locked: false
                };
            }
        };

        // Process Attendance Log
        activityRows.forEach(row => {
            const d = new Date(row.activity_date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            initDate(dateStr);

            if (row.metric_type === 'attendance') {
                activityMap[dateStr].attendance = row.is_checked === 1;
                activityMap[dateStr].attendance_locked = row.is_locked === 1;
            }
            if (row.metric_type === 'tasks_assigned') activityMap[dateStr].tasks_assigned_locked = row.is_locked === 1;
            if (row.metric_type === 'tasks_completed') activityMap[dateStr].tasks_completed_locked = row.is_locked === 1;
        });

        // Process Real Task Counts
        taskRows.forEach(row => {
            const d = new Date(row.date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            initDate(dateStr);

            const assigned = Number(row.total_assigned || 0);
            const completed = Number(row.total_completed || 0);

            activityMap[dateStr].tasks_assigned = assigned;
            activityMap[dateStr].tasks_completed = completed;
            activityMap[dateStr].tasks_pending = assigned - completed;
        });

        res.json({
            success: true,
            workerId,
            startDate: start,
            endDate: end,
            activityData: activityMap
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
// ⚠️ DISABLED: Daily Activity Log is SYSTEM-GENERATED ONLY
exports.toggleActivity = async (req, res) => {
    try {
        // 🚫 MANUAL EDITING IS NOT ALLOWED
        // Daily Activity Log is auto-generated based on admin approvals
        return res.status(403).json({
            success: false,
            message: 'Daily Activity Log is system-generated and cannot be manually edited. Activities are automatically recorded when admin approves completed tasks.',
            readOnly: true
        });

        /* ORIGINAL CODE - DISABLED FOR READ-ONLY MODE
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
            SELECT id, is_locked FROM worker_daily_activity
            WHERE worker_id = ? AND activity_date = ? AND metric_type = ?
        `;
        const [existing] = await db.query(checkQuery, [workerId, activityDate, metricType]);

        if (existing.length > 0) {
            // 🔒 CHECK IF LOCKED - Prevent editing after admin approval
            if (existing[0].is_locked) {
                return res.status(403).json({
                    success: false,
                    message: 'Activity is locked after admin approval and cannot be modified',
                    locked: true
                });
            }

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
        */
    } catch (error) {
        console.error('Error in toggleActivity:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
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

// Get worker details with detailed performance stats
exports.getWorkerDetails = async (req, res) => {
    try {
        const { workerId } = req.params;
        const { startDate, endDate } = req.query;

        // Default to current month if no dates provided
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // 1. Fetch Worker Profile
        const workerQuery = `
            SELECT id, name, email, phone, role, status, profile_image
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

        // 2. Fetch Detailed Task Metrics for the range
        // Logic:
        // - Assigned: Task created/assigned in range
        // - Completed: Task assigned in range AND status='completed' (Or should it be completed in range? "Performance" usually tracks the cohort of assigned tasks)
        // - "A task is Good/On Time if completed on or before due date"
        // - "Late if completed after due date"
        // - "Overdue if due date crossed and not completed"
        // - "Ongoing - Needs Changes if: Proof uploaded / Admin requested changes" (status: waiting_for_approval, change_required)

        // We filter tasks based on CREATED_AT (Assigned Date) falling in the range to establish the "Assigned Tasks" cohort.
        // This is standard for "Completion Rate of Assigned Tasks".

        // Broaden range to include any activity in the window for Charting purposes
        const tasksQuery = `
            SELECT 
                t.id,
                t.status,
                t.created_at,
                t.due_date,
                t.completed_at,
                t.entered_at
            FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE ta.employee_id = ?
            AND (
                DATE(t.created_at) BETWEEN ? AND ? 
                OR DATE(t.completed_at) BETWEEN ? AND ?
                OR DATE(t.due_date) BETWEEN ? AND ?
            )
        `;

        const [tasks] = await db.query(tasksQuery, [workerId, start, end, start, end, start, end]);

        let assigned = 0;
        let completed = 0;
        let overdue = 0;
        let onTime = 0;
        let late = 0;
        let ongoing = 0;

        const currentDate = new Date();

        tasks.forEach(task => {
            assigned++;

            const isCompleted = task.status === 'completed';
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            const completedAt = task.completed_at ? new Date(task.completed_at) : null;

            // Normalize dates for comparison (ignore time)
            if (dueDate) dueDate.setHours(23, 59, 59, 999);

            if (isCompleted) {
                completed++;
                if (dueDate && completedAt) {
                    if (completedAt <= dueDate) {
                        onTime++;
                    } else {
                        late++;
                    }
                } else {
                    // If no due date, count as onTime or just completed? 
                    // Assumption: No due date = On Time if completed.
                    onTime++;
                }
            } else {
                // Not completed check
                if (dueDate && currentDate > dueDate) {
                    overdue++;
                }

                if (task.status === 'waiting_for_approval' || task.status === 'change_required' || task.status === 'in_progress') {
                    // Logic: "Ongoing – Needs Changes if Proof uploaded / Admin requested changes"
                    // in_progress might be just started. 
                    // waiting_for_approval = proof uploaded. 
                    // change_required = admin requested changes.
                    ongoing++;
                }
            }
        });

        const performanceScore = assigned > 0
            ? Math.round((onTime / assigned) * 100)
            : 0;

        // Performance Percentage: (onTime / assigned) * 100
        const performancePercentage = assigned > 0
            ? Math.round((onTime / assigned) * 100)
            : 0;

        // Performance Label Rules
        let performanceLabel = 'Poor';
        if (performancePercentage >= 80) performanceLabel = 'Good';
        else if (performancePercentage >= 50) performanceLabel = 'Average';

        const breakdown = { onTime, late, overdue, ongoing };

        // Fetch Attendance (for charts/legacy)
        const attendanceQuery = `
            SELECT COUNT(*) as count 
            FROM worker_daily_activity 
            WHERE worker_id = ? 
            AND metric_type = 'attendance' 
            AND is_checked = 1
            AND activity_date BETWEEN ? AND ?
        `;
        const [attendance] = await db.query(attendanceQuery, [workerId, start, end]);

        const stats = {
            attendance_days: attendance[0].count,
            performance_breakdown: breakdown,
            task_breakdown: breakdown
        };

        // Construct Unified Worker Object
        const workerData = {
            ...worker[0],
            tasksAssigned: assigned,
            tasksCompleted: completed,
            tasksOverdue: overdue,
            performancePercentage: performancePercentage,
            performanceLabel: performanceLabel
        };

        res.json({
            success: true,
            worker: workerData, // Unified object
            monthlyStats: stats, // Partial stats for charts
            tasks: tasks,
            params: { startDate: start, endDate: end }
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
            overtime: Array(7).fill(false),
            // Lock status arrays
            attendance_locked: Array(7).fill(false),
            tasks_assigned_locked: Array(7).fill(false),
            tasks_completed_locked: Array(7).fill(false),
            overtime_locked: Array(7).fill(false)
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
                // Store lock status
                weeks[weekKey][`${row.metric_type}_locked`][dayIndex] = row.is_locked === 1;
            }
        }
    });

    return weeks;
}

module.exports = exports;
