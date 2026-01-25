// cSpell:ignore Gantt gantt

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GanttTask } from "../../hooks/useGanttTasks";

interface TaskColumnProps {
  task: GanttTask;
  columnWidth?: number;
}

/**
 * TaskColumn Component - Displays task ID, name, and project in Gantt chart
 *
 * Shows:
 * - Task #3844 – Site Planning (bold, larger font)
 * - JK House (smaller, gray, fallback to "Unknown Project")
 */
export const TaskColumn: React.FC<TaskColumnProps> = ({
  task,
  columnWidth = 200,
}) => {
  // Fallback to "Unknown Project" if projectName is null/empty
  const displayProjectName =
    task.projectName && task.projectName.trim()
      ? task.projectName
      : "Unknown Project";

  return (
    <View style={[styles.container, { width: columnWidth }]}>
      {/* Task ID and Name */}
      <Text style={styles.taskName} numberOfLines={2}>
        Task #{task.taskId} – {task.taskName}
      </Text>

      {/* Project Name */}
      <Text
        style={[
          styles.projectName,
          !task.projectName && styles.projectNameFallback,
        ]}
        numberOfLines={1}
      >
        {displayProjectName}
      </Text>

      {/* Optional: Assigned To (uncomment if needed) */}
      {/* {task.assignedTo && (
        <Text style={styles.assignedTo} numberOfLines={1}>
          Assigned to: {task.assignedTo}
        </Text>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    justifyContent: "center",
    minHeight: 60,
  },

  taskName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },

  projectName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 2,
  },

  projectNameFallback: {
    fontStyle: "italic",
    color: "#9ca3af",
  },

  assignedTo: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
});
