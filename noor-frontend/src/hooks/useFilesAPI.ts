import { useState, useCallback } from "react";
import api from "../services/api";

/**
 * Custom hook for Files API operations
 * Handles calendar data, file listing by date, and file preview
 */
export const useFilesAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [filesByDate, setFilesByDate] = useState<any[]>([]);

  /**
   * Fetch calendar data for a specific month
   * Returns dates with file counts
   */
  const fetchCalendar = useCallback(
    async (month: string, siteId?: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("month", month);
        if (siteId) params.append("siteId", siteId.toString());

        const response = await api.get(`/files/calendar?${params.toString()}`);
        setCalendarData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        console.error("Error fetching calendar:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Fetch all files for a specific date
   * Returns grouped files (images, videos, audio, etc.)
   */
  const fetchFilesByDate = useCallback(
    async (date: string, siteId?: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("date", date);
        if (siteId) params.append("siteId", siteId.toString());

        const response = await api.get(`/files/by-date?${params.toString()}`);
        setFilesByDate(response.data.files?.all || []);
        return response.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        console.error("Error fetching files by date:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get file preview details
   */
  const fetchFilePreview = useCallback(async (fileId: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/files/preview/${fileId}`);
      return response.data.file;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      console.error("Error fetching file preview:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search files
   */
  const searchFiles = useCallback(
    async (query: string, filters?: any) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("query", query);
        if (filters?.type) params.append("type", filters.type);
        if (filters?.startDate) params.append("startDate", filters.startDate);
        if (filters?.endDate) params.append("endDate", filters.endDate);
        if (filters?.siteId)
          params.append("siteId", filters.siteId.toString());

        const response = await api.get(`/files/search?${params.toString()}`);
        return response.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        console.error("Error searching files:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get file statistics
   */
  const fetchStats = useCallback(async (siteId?: number, year?: string, month?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (siteId) params.append("siteId", siteId.toString());
      if (year) params.append("year", year);
      if (month) params.append("month", month);

      const response = await api.get(`/files/stats?${params.toString()}`);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      console.error("Error fetching stats:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a file
   */
  const deleteFile = useCallback(async (fileId: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/files/${fileId}`);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      console.error("Error deleting file:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calendarData,
    filesByDate,
    fetchCalendar,
    fetchFilesByDate,
    fetchFilePreview,
    searchFiles,
    fetchStats,
    deleteFile,
  };
};
