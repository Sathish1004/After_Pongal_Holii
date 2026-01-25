// cSpell:ignore Gantt gantt

import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { useGanttTasks } from "../../hooks/useGanttTasks";
import { TaskColumn } from "./TaskColumn";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GanttChartProps {
  taskColumnWidth?: number;
  dateRangeStart?: string; // ISO date: "2025-01-10"
  dateRangeEnd?: string; // ISO date: "2025-03-21"
}

/**
 * GanttChart Component - Displays tasks with timeline
 *
 * Features:
 * - Fetches real task data from API
 * - Shows task name and project in left column
 * - Displays status indicators on timeline
 * - Responsive layout for mobile and web
 * - Loading and error states
 */
export const GanttChart: React.FC<GanttChartProps> = ({
  taskColumnWidth = 200,
  dateRangeStart,
  dateRangeEnd,
}) => {
  const insets = useSafeAreaInsets();
  const { tasks, loading, error, refetch } = useGanttTasks();

  // Generate date range for columns
  const dateColumns = useMemo(() => {
    const start = new Date(dateRangeStart || "2025-01-10");
    const end = new Date(dateRangeEnd || "2025-03-21");
    const dates: string[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
      dates.push(d.toISOString().split("T")[0]);
    }

    return dates;
  }, [dateRangeStart, dateRangeEnd]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Completed":
        return "#10b981"; // Green
      case "Ongoing":
        return "#3b82f6"; // Blue
      case "Delayed":
        return "#ef4444"; // Red
      default:
        return "#9ca3af"; // Gray
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr + "T00:00:00");
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading tasks</Text>
          <Text style={styles.errorDetails}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading Gantt chart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 8) + 80,
        }}
      >
        <View style={styles.tableWrapper}>
          {/* Header */}
          <View style={styles.headerRow}>
            {/* Task Column Header */}
            <View
              style={[
                styles.headerCell,
                styles.taskColumnHeader,
                { width: taskColumnWidth },
              ]}
            >
              <Text style={styles.headerText}>Task</Text>
            </View>

            {/* Date Column Headers */}
            {dateColumns.map((date) => (
              <View
                key={date}
                style={[styles.headerCell, styles.dateColumnHeader]}
              >
                <Text style={styles.headerText}>{formatDate(date)}</Text>
              </View>
            ))}
          </View>

          {/* Task Rows */}
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <View key={task.taskId} style={styles.row}>
                {/* Task Column */}
                <TaskColumn task={task} columnWidth={taskColumnWidth} />

                {/* Date Columns with Status Indicators */}
                {dateColumns.map((date) => {
                  const taskStart = new Date(task.startDate);
                  const taskEnd = new Date(task.endDate);
                  const columnDate = new Date(date);

                  // Check if task falls within this date range
                  const isInRange =
                    columnDate >= taskStart && columnDate <= taskEnd;

                  return (
                    <View
                      key={`${task.taskId}-${date}`}
                      style={[
                        styles.dateCell,
                        isInRange && {
                          backgroundColor: getStatusColor(task.status),
                          opacity: 0.7,
                        },
                      ]}
                    >
                      {isInRange && (
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(task.status) },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks to display</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
          <Text style={styles.legendText}>Ongoing</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>Delayed</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  tableWrapper: {
    flexDirection: "column",
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
  },

  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },

  taskColumnHeader: {
    justifyContent: "center",
  },

  dateColumnHeader: {
    minWidth: 80,
  },

  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  dateCell: {
    minWidth: 80,
    minHeight: 60,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  legend: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    gap: 20,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
  },

  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 8,
  },

  errorDetails: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  emptyContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
  },
});
