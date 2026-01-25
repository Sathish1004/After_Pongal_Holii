// cSpell:ignore Gantt gantt

import React from "react";
import { View, StyleSheet } from "react-native";
import { GanttChart } from "./GanttChart";

/**
 * GanttChartScreen - Example usage of GanttChart component
 *
 * This screen demonstrates how to use the Gantt chart with customizable
 * date ranges and column widths.
 */
export const GanttChartScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <GanttChart
        taskColumnWidth={200}
        dateRangeStart="2025-01-10"
        dateRangeEnd="2025-03-21"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});

/**
 * ============================================================================
 * BACKEND RESPONSE FORMAT - What your API should return
 * ============================================================================
 *
 * GET /tasks/gantt
 *
 * Success Response (200 OK):
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
 *     {
 *       "taskId": 3752,
 *       "taskName": "Foundation Work",
 *       "projectName": "JK House",
 *       "startDate": "2025-02-01",
 *       "endDate": "2025-02-28",
 *       "status": "Delayed",
 *       "assignedTo": "Jane Smith"
 *     },
 *     {
 *       "taskId": 3845,
 *       "taskName": "Material Procurement",
 *       "projectName": null,
 *       "startDate": "2025-01-20",
 *       "endDate": "2025-03-10",
 *       "status": "Completed",
 *       "assignedTo": null
 *     }
 *   ]
 * }
 *
 * Error Response (400+):
 * {
 *   "success": false,
 *   "message": "Failed to fetch tasks"
 * }
 *
 * ============================================================================
 * REQUIRED DATABASE FIELDS
 * ============================================================================
 *
 * Table: tasks (or similar)
 * - id or taskId (integer, primary key)
 * - name or taskName (string, 2-255 chars)
 * - project_id (integer, foreign key) → join with projects table
 * - start_date or startDate (date/timestamp)
 * - end_date or endDate (date/timestamp)
 * - status (enum: 'Pending' | 'Ongoing' | 'Completed' | 'Delayed')
 * - assigned_to (integer, foreign key to users) - OPTIONAL
 *
 * Table: projects
 * - id (integer, primary key)
 * - name or projectName (string, 2-255 chars)
 *
 * ============================================================================
 * IMPLEMENTATION CHECKLIST
 * ============================================================================
 *
 * Backend (Node.js/Express):
 *
 * [ ] Create endpoint GET /tasks/gantt
 * [ ] Query tasks with LEFT JOIN to projects table
 * [ ] Return data in the format specified above
 * [ ] Handle null projectName gracefully
 * [ ] Add date range filtering (optional query params)
 *     Example: GET /tasks/gantt?startDate=2025-01-01&endDate=2025-12-31
 * [ ] Validate date formats (ISO 8601)
 * [ ] Add error handling and logging
 *
 * Example Node.js/Express code:
 *
 * router.get('/tasks/gantt', async (req, res) => {
 *   try {
 *     const tasks = await db.query(`
 *       SELECT
 *         t.id as taskId,
 *         t.name as taskName,
 *         p.name as projectName,
 *         t.start_date as startDate,
 *         t.end_date as endDate,
 *         t.status,
 *         u.name as assignedTo
 *       FROM tasks t
 *       LEFT JOIN projects p ON t.project_id = p.id
 *       LEFT JOIN users u ON t.assigned_to = u.id
 *       ORDER BY t.start_date ASC
 *     `);
 *
 *     res.json({ success: true, data: tasks });
 *   } catch (error) {
 *     res.status(500).json({ success: false, message: error.message });
 *   }
 * });
 *
 * Frontend (React Native):
 *
 * [ ] Create useGanttTasks hook (provided)
 * [ ] Create TaskColumn component (provided)
 * [ ] Create GanttChart component (provided)
 * [ ] Import and use GanttChart in your screen
 * [ ] Test with various date ranges
 * [ ] Test null projectName fallback
 * [ ] Test loading and error states
 * [ ] Ensure safe area insets applied (mobile notch handling)
 *
 * ============================================================================
 * USAGE IN YOUR SCREEN
 * ============================================================================
 *
 * import { GanttChartScreen } from './components/GanttChart/GanttChartScreen';
 *
 * export const MyProjectsScreen = () => {
 *   return <GanttChartScreen />;
 * };
 *
 * Or with custom dates:
 *
 * <GanttChart
 *   taskColumnWidth={220}
 *   dateRangeStart="2025-01-01"
 *   dateRangeEnd="2025-12-31"
 * />
 *
 * ============================================================================
 * CUSTOMIZATION OPTIONS
 * ============================================================================
 *
 * Props for GanttChart:
 * - taskColumnWidth?: number (default: 200px)
 * - dateRangeStart?: string (default: "2025-01-10")
 * - dateRangeEnd?: string (default: "2025-03-21")
 *
 * Styling:
 * - Edit styles in GanttChart.tsx for colors and sizing
 * - Status colors: Completed (#10b981), Ongoing (#3b82f6), Delayed (#ef4444)
 * - All colors defined in getStatusColor() function
 *
 * Extending:
 * - Add assignedTo display by uncommenting in TaskColumn.tsx
 * - Modify date column width (currently 80px)
 * - Add click handlers to show task details
 * - Add filtering by status or project
 * - Add sorting options
 *
 * ============================================================================
 */
