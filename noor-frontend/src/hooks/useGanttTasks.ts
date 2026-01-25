// cSpell:ignore Gantt gantt
import { useState, useEffect } from 'react';
import api from '../services/api';

export interface GanttTask {
  taskId: number;
  taskName: string;
  projectName: string | null;
  startDate: string; // ISO 8601 format: "2025-01-24"
  endDate: string;
  status: 'Completed' | 'Ongoing' | 'Delayed';
  assignedTo: string | null;
}

export interface UseGanttTasksResult {
  tasks: GanttTask[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch Gantt chart tasks from backend
 * 
 * Usage:
 * const { tasks, loading, error } = useGanttTasks();
 * 
 * API Response Expected:
 * {
 *   success: true,
 *   data: [
 *     {
 *       taskId: 3844,
 *       taskName: "Site Planning",
 *       projectName: "JK House",
 *       startDate: "2025-01-24",
 *       endDate: "2025-02-15",
 *       status: "Ongoing",
 *       assignedTo: "John Doe"
 *     },
 *     ...
 *   ]
 * }
 */
export const useGanttTasks = (): UseGanttTasksResult => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call your backend endpoint
      // Make sure your API service is configured with the correct base URL
      const response = await api.get('/tasks/gantt'); // Adjust endpoint as needed

      if (response.data && response.data.data) {
        const tasksData: GanttTask[] = response.data.data.map((task: any) => ({
          taskId: task.taskId || task.id,
          taskName: task.taskName || task.name || 'Untitled Task',
          projectName: task.projectName || null,
          startDate: task.startDate || new Date().toISOString().split('T')[0],
          endDate: task.endDate || new Date().toISOString().split('T')[0],
          status: task.status || 'Ongoing',
          assignedTo: task.assignedTo || null,
        }));

        setTasks(tasksData);
      }
    } catch (err: any) {
      console.error('Failed to fetch Gantt tasks:', err);
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
};
