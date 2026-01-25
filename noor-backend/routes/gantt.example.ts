// cSpell:ignore gantt Gantt

/**
 * BACKEND IMPLEMENTATION EXAMPLE
 * 
 * This file shows how to implement the /tasks/gantt endpoint
 * in your Node.js/Express backend
 * 
 * Installation:
 * npm install express mysql2/promise dotenv
 * npm install --save-dev @types/express
 * 
 * Setup:
 * 1. Create a database connection pool (shown below)
 * 2. Create this route handler
 * 3. Add it to your router
 * 4. Test with: curl http://localhost:5000/api/tasks/gantt
 */

// ============================================================================
// DATABASE CONNECTION (using MySQL 2)
// ============================================================================

import mysql from 'mysql2/promise';
import express from 'express';

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'construction_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ============================================================================
// ROUTE HANDLER
// ============================================================================

interface GanttTaskResponse {
  taskId: number;
  taskName: string;
  projectName: string | null;
  startDate: string;
  endDate: string;
  status: string;
  assignedTo: string | null;
}

/**
 * GET /api/tasks/gantt
 * 
 * Fetches all tasks with their project information for Gantt chart display
 * 
 * Query Parameters (optional):
 * - startDate: ISO date string (e.g., "2025-01-01")
 * - endDate: ISO date string (e.g., "2025-12-31")
 * - projectId: integer (filter by specific project)
 * - status: string (filter by status: 'Pending', 'Ongoing', 'Completed', 'Delayed')
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "taskId": 3844,
 *       "taskName": "Site Planning",
 *       "projectName": "JK House",
 *       "startDate": "2025-01-24",
 *       "endDate": "2025-02-15",
 *       "status": "Ongoing",
 *       "assignedTo": "John Doe"
 *     },
 *     ...
 *   ]
 * }
 */
// @ts-ignore - Request/Response types require @types/express
router.get('/tasks/gantt', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // Build dynamic WHERE clause based on query params
    const filters: string[] = [];
    const params: any[] = [];

    // Filter by date range if provided
    if (req.query.startDate) {
      filters.push('t.start_date >= ?');
      params.push(req.query.startDate);
    }

    if (req.query.endDate) {
      filters.push('t.end_date <= ?');
      params.push(req.query.endDate);
    }

    // Filter by project if provided
    if (req.query.projectId) {
      filters.push('t.project_id = ?');
      params.push(parseInt(req.query.projectId as string));
    }

    // Filter by status if provided
    if (req.query.status) {
      filters.push('t.status = ?');
      params.push(req.query.status);
    }

    const whereClause =
      filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';

    // SQL Query - JOIN tasks with projects and users tables
    const query = `
      SELECT 
        t.id as taskId,
        t.name as taskName,
        COALESCE(p.name, NULL) as projectName,
        DATE_FORMAT(t.start_date, '%Y-%m-%d') as startDate,
        DATE_FORMAT(t.end_date, '%Y-%m-%d') as endDate,
        t.status,
        COALESCE(u.name, NULL) as assignedTo
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ${whereClause}
      ORDER BY t.start_date ASC, t.id ASC
      LIMIT 500
    `;

    console.log('Executing query:', query);
    console.log('With params:', params);

    const rows = await conn.query(query, params);
    const tasks: GanttTaskResponse[] = rows[0] as GanttTaskResponse[];

    // Validate and sanitize data
    const validatedTasks = tasks.map((task) => ({
      taskId: task.taskId || 0,
      taskName: (task.taskName || 'Untitled').slice(0, 255),
      projectName:
        task.projectName && task.projectName.trim() ? task.projectName : null,
      startDate: task.startDate || new Date().toISOString().split('T')[0],
      endDate: task.endDate || new Date().toISOString().split('T')[0],
      status: task.status || 'Pending',
      assignedTo:
        task.assignedTo && task.assignedTo.trim() ? task.assignedTo : null,
    }));

    res.json({
      success: true,
      data: validatedTasks,
      count: validatedTasks.length,
    });
  } catch (error: any) {
    console.error('Error fetching Gantt tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tasks',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (conn) conn.release();
  }
});

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

/**
 * SQL Schema for your database:
 * 
 * CREATE TABLE projects (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(255) NOT NULL,
 *   location VARCHAR(255),
 *   description TEXT,
 *   status ENUM('Planning', 'Active', 'Completed', 'On Hold'),
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   UNIQUE KEY (name)
 * );
 * 
 * CREATE TABLE tasks (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(255) NOT NULL,
 *   description TEXT,
 *   project_id INT,
 *   start_date DATE NOT NULL,
 *   end_date DATE NOT NULL,
 *   status ENUM('Pending', 'Ongoing', 'Completed', 'Delayed') DEFAULT 'Pending',
 *   assigned_to INT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
 *   FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
 *   INDEX idx_project (project_id),
 *   INDEX idx_dates (start_date, end_date),
 *   INDEX idx_status (status)
 * );
 * 
 * CREATE TABLE users (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255) UNIQUE,
 *   role ENUM('admin', 'employee'),
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * Sample Data:
 * 
 * INSERT INTO projects (name, location) VALUES
 * ('JK House', 'Downtown'),
 * ('City Plaza', 'Uptown');
 * 
 * INSERT INTO users (name, email, role) VALUES
 * ('John Doe', 'john@example.com', 'employee'),
 * ('Jane Smith', 'jane@example.com', 'employee');
 * 
 * INSERT INTO tasks (name, project_id, start_date, end_date, status, assigned_to) VALUES
 * ('Site Planning', 1, '2025-01-24', '2025-02-15', 'Ongoing', 1),
 * ('Foundation Work', 1, '2025-02-01', '2025-02-28', 'Delayed', 2),
 * ('Material Procurement', NULL, '2025-01-20', '2025-03-10', 'Completed', NULL);
 */

export default router;

// ============================================================================
// USAGE IN YOUR EXPRESS APP
// ============================================================================

/**
 * import ganttRouter from './routes/gantt';
 * 
 * app.use('/api', ganttRouter);
 * 
 * OR in your main app setup:
 * 
 * app.get('/api/tasks/gantt', async (req, res) => {
 *   // ... handler code above ...
 * });
 * 
 * Test with:
 * curl http://localhost:5000/api/tasks/gantt
 * 
 * With filters:
 * curl "http://localhost:5000/api/tasks/gantt?startDate=2025-01-01&endDate=2025-12-31&status=Ongoing"
 */
