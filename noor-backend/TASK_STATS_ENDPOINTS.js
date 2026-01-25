/**
 * Backend API Endpoint for Task Analytics
 * Add this to noor-backend/routes or your existing task routes
 *
 * Endpoint: GET /api/tasks/stats
 * Authentication: Optional (you can add verifyToken middleware if needed)
 * Response: { totalTasks, completedTasks, pendingTasks }
 */

// ============================================
// OPTION 1: Add to existing tasksRoutes.js
// ============================================

const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * GET /api/tasks/stats
 * Returns total, completed, and pending task counts
 */
router.get("/stats", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'completed' OR status = 'closed' THEN 1 ELSE 0 END) as completedTasks
       FROM tasks 
       WHERE deleted_at IS NULL`,
    );

    const totalTasks = result[0]?.totalTasks || 0;
    const completedTasks = result[0]?.completedTasks || 0;
    const pendingTasks = Math.max(0, totalTasks - completedTasks);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching task stats:", error);
    res.status(500).json({
      error: "Failed to fetch task statistics",
      message: error.message,
    });
  }
});

module.exports = router;

// ============================================
// OPTION 2: Add to your main index.js/server
// ============================================

/*
const taskStatsRoutes = require('./routes/taskStats');
app.use('/api/tasks', taskStatsRoutes);
*/

// ============================================
// OPTION 3: Database Query (MySQL)
// ============================================

// If you need the raw SQL query:
/*
SELECT 
  COUNT(*) as totalTasks,
  SUM(CASE WHEN status = 'completed' OR status = 'closed' THEN 1 ELSE 0 END) as completedTasks,
  COUNT(*) - SUM(CASE WHEN status = 'completed' OR status = 'closed' THEN 1 ELSE 0 END) as pendingTasks
FROM tasks 
WHERE deleted_at IS NULL;
*/

// ============================================
// OPTION 4: Complete Backend Implementation
// ============================================

/**
 * Task Stats Controller
 * Save as: noor-backend/controllers/taskStatsController.js
 */

const db = require("../db");

const taskStatsController = {
  /**
   * Get overview statistics for all tasks
   * Calculation:
   * - Total = all non-deleted tasks
   * - Completed = tasks with status 'completed' or 'closed'
   * - Pending = total - completed
   */
  getOverviewStats: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT 
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'completed' OR status = 'closed' THEN 1 ELSE 0 END) as completedTasks
         FROM tasks 
         WHERE deleted_at IS NULL`,
      );

      const totalTasks = result[0]?.totalTasks || 0;
      const completedTasks = result[0]?.completedTasks || 0;
      const pendingTasks = Math.max(0, totalTasks - completedTasks);

      // Calculate percentages
      const completedPercent =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const pendingPercent =
        totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0;

      res.json({
        totalTasks,
        completedTasks,
        pendingTasks,
        completedPercent: parseFloat(completedPercent.toFixed(1)),
        pendingPercent: parseFloat(pendingPercent.toFixed(1)),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching task stats:", error);
      res.status(500).json({
        error: "Failed to fetch task statistics",
        message: error.message,
      });
    }
  },

  /**
   * Get task statistics by project
   */
  getStatsByProject: async (req, res) => {
    try {
      const { projectId } = req.params;

      const result = await db.query(
        `SELECT 
          COUNT(*) as totalTasks,
          SUM(CASE WHEN status = 'completed' OR status = 'closed' THEN 1 ELSE 0 END) as completedTasks
         FROM tasks 
         WHERE project_id = ? AND deleted_at IS NULL`,
        [projectId],
      );

      const totalTasks = result[0]?.totalTasks || 0;
      const completedTasks = result[0]?.completedTasks || 0;
      const pendingTasks = Math.max(0, totalTasks - completedTasks);

      const completedPercent =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const pendingPercent =
        totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0;

      res.json({
        projectId,
        totalTasks,
        completedTasks,
        pendingTasks,
        completedPercent: parseFloat(completedPercent.toFixed(1)),
        pendingPercent: parseFloat(pendingPercent.toFixed(1)),
      });
    } catch (error) {
      console.error("Error fetching project task stats:", error);
      res.status(500).json({
        error: "Failed to fetch project statistics",
        message: error.message,
      });
    }
  },

  /**
   * Get task statistics by status
   */
  getStatsByStatus: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT 
          status,
          COUNT(*) as count
         FROM tasks 
         WHERE deleted_at IS NULL
         GROUP BY status
         ORDER BY count DESC`,
      );

      const total = result.reduce((sum, row) => sum + row.count, 0);
      const data = result.map((row) => ({
        status: row.status,
        count: row.count,
        percentage:
          total > 0 ? parseFloat(((row.count / total) * 100).toFixed(1)) : 0,
      }));

      res.json({
        total,
        byStatus: data,
      });
    } catch (error) {
      console.error("Error fetching status stats:", error);
      res.status(500).json({
        error: "Failed to fetch status statistics",
        message: error.message,
      });
    }
  },
};

module.exports = taskStatsController;

// ============================================
// INTEGRATION: Add to noor-backend/index.js
// ============================================

/*
const taskStatsController = require('./controllers/taskStatsController');

// Routes
app.get('/api/tasks/stats', taskStatsController.getOverviewStats);
app.get('/api/tasks/stats/project/:projectId', taskStatsController.getStatsByProject);
app.get('/api/tasks/stats/by-status', taskStatsController.getStatsByStatus);
*/

// ============================================
// API RESPONSE EXAMPLES
// ============================================

/*
GET /api/tasks/stats
{
  "totalTasks": 534,
  "completedTasks": 8,
  "pendingTasks": 526,
  "completedPercent": 1.5,
  "pendingPercent": 98.5,
  "timestamp": "2026-01-25T08:30:00.000Z"
}

GET /api/tasks/stats/project/123
{
  "projectId": 123,
  "totalTasks": 50,
  "completedTasks": 45,
  "pendingTasks": 5,
  "completedPercent": 90.0,
  "pendingPercent": 10.0
}

GET /api/tasks/stats/by-status
{
  "total": 100,
  "byStatus": [
    { "status": "completed", "count": 50, "percentage": 50.0 },
    { "status": "in_progress", "count": 30, "percentage": 30.0 },
    { "status": "pending", "count": 20, "percentage": 20.0 }
  ]
}
*/
