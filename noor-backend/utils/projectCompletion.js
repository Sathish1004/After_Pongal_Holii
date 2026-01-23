const db = require('../config/db');

/**
 * Calculate project completion based on:
 * - All phases completed
 * - All tasks completed
 * - All milestones completed  
 * - All material requests approved
 * 
 * Returns completion status and percentage
 */
async function calculateProjectCompletion(siteId) {
    try {
        // 1. Check all phases
        const [phases] = await db.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status = "Completed" THEN 1 ELSE 0 END) as completed FROM phases WHERE site_id = ?',
            [siteId]
        );

        // 2. Check all tasks
        const [tasks] = await db.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status = "Completed" THEN 1 ELSE 0 END) as completed FROM tasks WHERE phase_id IN (SELECT id FROM phases WHERE site_id = ?)',
            [siteId]
        );

        // 3. Check all milestones
        const [milestones] = await db.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status = "Completed" THEN 1 ELSE 0 END) as completed FROM milestones WHERE site_id = ?',
            [siteId]
        );

        // 4. Check all materials
        const [materials] = await db.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status IN ("Approved", "Received") THEN 1 ELSE 0 END) as completed FROM material_requests WHERE site_id = ?',
            [siteId]
        );

        const phasesData = phases[0] || { total: 0, completed: 0 };
        const tasksData = tasks[0] || { total: 0, completed: 0 };
        const milestonesData = milestones[0] || { total: 0, completed: 0 };
        const materialsData = materials[0] || { total: 0, completed: 0 };

        // Calculate total items and completed items
        const totalItems = phasesData.total + tasksData.total + milestonesData.total + materialsData.total;
        const completedItems = phasesData.completed + tasksData.completed + milestonesData.completed + materialsData.completed;

        // Calculate percentage
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100 * 100) / 100 : 0;

        // Determine status - COMPLETED only if ALL items are 100% done
        const isCompleted = totalItems > 0 && completedItems === totalItems;
        const status = isCompleted ? 'COMPLETED' : 'IN_PROGRESS';

        return {
            status,
            percentage,
            breakdown: {
                phases: phasesData,
                tasks: tasksData,
                milestones: milestonesData,
                materials: materialsData
            }
        };
    } catch (error) {
        console.error('Error calculating project completion:', error);
        throw error;
    }
}

/**
 * Update project completion status in database
 */
async function updateProjectCompletion(siteId) {
    try {
        const completion = await calculateProjectCompletion(siteId);

        const completedAt = completion.status === 'COMPLETED' ? new Date() : null;

        await db.query(
            `UPDATE sites 
             SET completion_status = ?, 
                 completion_percentage = ?,
                 completed_at = ?
             WHERE id = ?`,
            [completion.status, completion.percentage, completedAt, siteId]
        );

        console.log(`Updated project ${siteId}: ${completion.status} (${completion.percentage}%)`);
        return completion;
    } catch (error) {
        console.error('Error updating project completion:', error);
        throw error;
    }
}

module.exports = {
    calculateProjectCompletion,
    updateProjectCompletion
};
