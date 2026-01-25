const db = require("../config/db");

/**
 * GET /api/files/calendar
 * Returns file counts grouped by date for a specific month
 * Query params: month (YYYY-MM), siteId (optional)
 */
exports.getFilesCalendar = async (req, res) => {
  try {
    const { month, siteId } = req.query;
    const { id: adminId } = req.user || {};

    // Validate month format
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res
        .status(400)
        .json({ message: "Invalid month format. Use YYYY-MM" });
    }

    const [year, monthNum] = month.split("-");
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split("T")[0]; // Last day of month

    // Build query based on role
    let query = `
      SELECT 
        DATE(tm.created_at) as date,
        COUNT(tm.id) as count,
        GROUP_CONCAT(DISTINCT tm.type) as types
      FROM task_messages tm
      LEFT JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN phases p ON t.phase_id = p.id
      WHERE tm.type IN ('image', 'video', 'audio', 'document', 'link')
      AND DATE(tm.created_at) BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    // If siteId provided, filter by site
    if (siteId) {
      query += ` AND (p.site_id = ? OR tm.site_id = ?)`;
      params.push(siteId, siteId);
    }

    query += ` GROUP BY DATE(tm.created_at)
      ORDER BY date ASC`;

    const [results] = await db.query(query, params);

    // Format results
    const calendarData = results.map((row) => ({
      date: row.date,
      count: row.count,
      types: row.types ? row.types.split(",") : [],
    }));

    res.json({
      month,
      dates: calendarData,
    });
  } catch (error) {
    console.error("Error fetching files calendar:", error);
    res.status(500).json({ message: "Error fetching calendar data" });
  }
};

/**
 * GET /api/files/by-date
 * Returns all files for a specific date
 * Query params: date (YYYY-MM-DD), siteId (optional)
 */
exports.getFilesByDate = async (req, res) => {
  try {
    const { date, siteId } = req.query;
    const { id: adminId } = req.user || {};

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Calculate date range (start of day to end of day)
    const dateStart = `${date} 00:00:00`;
    const dateEnd = `${date} 23:59:59`;

    let query = `
      SELECT 
        tm.id,
        tm.sender_id,
        tm.task_id,
        CASE 
          WHEN tm.media_url IS NOT NULL AND tm.media_url != '' THEN tm.media_url
          ELSE tm.content 
        END as url,
        tm.type,
        tm.created_at,
        t.name as task_name,
        p.name as phase_name,
        e.name as uploaded_by,
        e.profile_image as uploader_image,
        tm.site_id,
        p.id as phase_id,
        p.site_id as phase_site_id
      FROM task_messages tm
      LEFT JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN phases p ON t.phase_id = p.id
      LEFT JOIN employees e ON tm.sender_id = e.id
      WHERE tm.type IN ('image', 'video', 'audio', 'document', 'link')
      AND tm.created_at BETWEEN ? AND ?
    `;

    const params = [dateStart, dateEnd];

    // If siteId provided, filter by site
    if (siteId) {
      query += ` AND (p.site_id = ? OR tm.site_id = ?)`;
      params.push(siteId, siteId);
    }

    query += ` ORDER BY tm.created_at DESC`;

    const [files] = await db.query(query, params);

    // Group files by type
    const grouped = {
      images: [],
      videos: [],
      audio: [],
      documents: [],
      links: [],
    };

    files.forEach((file) => {
      if (file.type === "image") grouped.images.push(file);
      else if (file.type === "video") grouped.videos.push(file);
      else if (file.type === "audio") grouped.audio.push(file);
      else if (file.type === "document") grouped.documents.push(file);
      else if (file.type === "link") grouped.links.push(file);
    });

    res.json({
      date,
      totalCount: files.length,
      files: {
        all: files,
        grouped,
      },
    });
  } catch (error) {
    console.error("Error fetching files by date:", error);
    res.status(500).json({ message: "Error fetching files for date" });
  }
};

/**
 * GET /api/files/preview/:fileId
 * Returns file details for preview
 */
exports.getFilePreview = async (req, res) => {
  try {
    const { fileId } = req.params;

    const [files] = await db.query(
      `
      SELECT 
        tm.id,
        tm.sender_id,
        tm.task_id,
        CASE 
          WHEN tm.media_url IS NOT NULL AND tm.media_url != '' THEN tm.media_url
          ELSE tm.content 
        END as url,
        tm.type,
        tm.created_at,
        t.name as task_name,
        p.name as phase_name,
        e.name as uploaded_by,
        e.profile_image as uploader_image,
        tm.site_id,
        p.id as phase_id
      FROM task_messages tm
      LEFT JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN phases p ON t.phase_id = p.id
      LEFT JOIN employees e ON tm.sender_id = e.id
      WHERE tm.id = ? AND tm.type IN ('image', 'video', 'audio', 'document', 'link')
    `,
      [fileId],
    );

    if (files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json({ file: files[0] });
  } catch (error) {
    console.error("Error fetching file preview:", error);
    res.status(500).json({ message: "Error fetching file details" });
  }
};

/**
 * GET /api/files/search
 * Search files by name, type, uploader, or date range
 */
exports.searchFiles = async (req, res) => {
  try {
    const { query, type, startDate, endDate, siteId } = req.query;

    let sql = `
      SELECT 
        tm.id,
        tm.sender_id,
        tm.task_id,
        CASE 
          WHEN tm.media_url IS NOT NULL AND tm.media_url != '' THEN tm.media_url
          ELSE tm.content 
        END as url,
        tm.type,
        tm.created_at,
        t.name as task_name,
        p.name as phase_name,
        e.name as uploaded_by,
        tm.site_id
      FROM task_messages tm
      LEFT JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN phases p ON t.phase_id = p.id
      LEFT JOIN employees e ON tm.sender_id = e.id
      WHERE tm.type IN ('image', 'video', 'audio', 'document', 'link')
    `;

    const params = [];

    // Text search
    if (query) {
      sql += ` AND (t.name LIKE ? OR e.name LIKE ? OR tm.content LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Type filter
    if (type) {
      sql += ` AND tm.type = ?`;
      params.push(type);
    }

    // Date range filter
    if (startDate && endDate) {
      sql += ` AND DATE(tm.created_at) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    // Site filter
    if (siteId) {
      sql += ` AND (p.site_id = ? OR tm.site_id = ?)`;
      params.push(siteId, siteId);
    }

    sql += ` ORDER BY tm.created_at DESC LIMIT 100`;

    const [files] = await db.query(sql, params);

    res.json({
      count: files.length,
      files,
    });
  } catch (error) {
    console.error("Error searching files:", error);
    res.status(500).json({ message: "Error searching files" });
  }
};

/**
 * DELETE /api/files/:fileId
 * Delete a file (admin only)
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { id: adminId } = req.user || {};

    // Check if file exists
    const [files] = await db.query(`SELECT * FROM task_messages WHERE id = ?`, [
      fileId,
    ]);

    if (files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    // Delete file
    await db.query(`DELETE FROM task_messages WHERE id = ?`, [fileId]);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Error deleting file" });
  }
};

/**
 * GET /api/files/stats
 * Get file statistics for dashboard
 */
exports.getFileStats = async (req, res) => {
  try {
    const { siteId, year, month } = req.query;

    let query = `
      SELECT 
        tm.type,
        COUNT(tm.id) as count,
        DATE(tm.created_at) as date
      FROM task_messages tm
      LEFT JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN phases p ON t.phase_id = p.id
      WHERE tm.type IN ('image', 'video', 'audio', 'document', 'link')
    `;

    const params = [];

    if (siteId) {
      query += ` AND (p.site_id = ? OR tm.site_id = ?)`;
      params.push(siteId, siteId);
    }

    if (year && month) {
      query += ` AND YEAR(tm.created_at) = ? AND MONTH(tm.created_at) = ?`;
      params.push(year, month);
    } else if (year) {
      query += ` AND YEAR(tm.created_at) = ?`;
      params.push(year);
    }

    query += ` GROUP BY tm.type, DATE(tm.created_at)
      ORDER BY DATE(tm.created_at) DESC`;

    const [results] = await db.query(query, params);

    // Summary
    const summary = {
      total: 0,
      byType: {
        image: 0,
        video: 0,
        audio: 0,
        document: 0,
        link: 0,
      },
    };

    results.forEach((row) => {
      summary.total += row.count;
      summary.byType[row.type] = (summary.byType[row.type] || 0) + row.count;
    });

    res.json({
      summary,
      daily: results,
    });
  } catch (error) {
    console.error("Error fetching file stats:", error);
    res.status(500).json({ message: "Error fetching file statistics" });
  }
};
