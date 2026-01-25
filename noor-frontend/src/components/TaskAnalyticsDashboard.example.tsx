/**
 * Quick Integration Example
 * Add this to your AdminDashboardScreen.tsx
 */

import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import TaskAnalyticsCard from "./TaskAnalyticsCard";
import axios from "axios";

interface TaskStats {
  total: number;
  completed: number;
}

/**
 * TaskAnalyticsDashboard
 * Container component that fetches and displays task analytics
 */
export const TaskAnalyticsDashboard = () => {
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTaskStats();
  }, []);

  const fetchTaskStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Option 1: If you have a dedicated stats endpoint
      const response = await axios.get("/api/tasks/stats");
      setStats({
        total: response.data.totalTasks,
        completed: response.data.completedTasks,
      });

      // Option 2: If you need to calculate from task list
      // const tasksResponse = await axios.get('/api/tasks');
      // const tasks = tasksResponse.data;
      // setStats({
      //   total: tasks.length,
      //   completed: tasks.filter(t => t.status === 'completed').length,
      // });
    } catch (err) {
      console.error("Failed to fetch task stats:", err);
      setError("Failed to load task analytics");

      // Fallback data for demo
      setStats({ total: 534, completed: 8 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          padding: 20,
          backgroundColor: "#fee2e2",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#991b1b", fontSize: 14 }}>{error}</Text>
      </View>
    );
  }

  return <TaskAnalyticsCard total={stats.total} completed={stats.completed} />;
};

/**
 * INTEGRATION INSTRUCTIONS
 *
 * 1. Import in AdminDashboardScreen.tsx:
 *    import { TaskAnalyticsDashboard } from '../components/TaskAnalyticsDashboard';
 *
 * 2. Add to your render (inside ScrollView or SafeAreaView):
 *    <TaskAnalyticsDashboard />
 *
 * 3. Make sure you have the API endpoint set up:
 *    GET /api/tasks/stats
 *    Response: { totalTasks: number, completedTasks: number }
 *
 * 4. Optional: Create the backend endpoint in your Node.js server:
 *
 *    app.get('/api/tasks/stats', async (req, res) => {
 *      try {
 *        const result = await db.query(
 *          'SELECT COUNT(*) as total, ' +
 *          'SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed ' +
 *          'FROM tasks WHERE deleted_at IS NULL'
 *        );
 *        res.json({
 *          totalTasks: result[0].total,
 *          completedTasks: result[0].completed || 0
 *        });
 *      } catch (error) {
 *        res.status(500).json({ error: error.message });
 *      }
 *    });
 */

/**
 * STANDALONE USAGE (Without API)
 *
 * For testing or when data comes from props:
 *
 * import TaskAnalyticsCard from '../components/TaskAnalyticsCard';
 *
 * <TaskAnalyticsCard total={534} completed={8} />
 */
