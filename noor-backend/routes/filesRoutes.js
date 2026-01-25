const express = require("express");
const router = express.Router();
const filesController = require("../controllers/filesController");
const { verifyToken } = require("../middleware/authMiddleware");

/**
 * CALENDAR ROUTES
 */

/**
 * GET /api/files/calendar
 * Returns file counts grouped by date for a specific month
 * Query: month=YYYY-MM, siteId=optional
 */
router.get("/calendar", verifyToken, filesController.getFilesCalendar);

/**
 * GET /api/files/by-date
 * Returns all files for a specific date
 * Query: date=YYYY-MM-DD, siteId=optional
 */
router.get("/by-date", verifyToken, filesController.getFilesByDate);

/**
 * SEARCH & STATS ROUTES
 */

/**
 * GET /api/files/search
 * Search files by various criteria
 * Query: query, type, startDate, endDate, siteId
 */
router.get("/search", verifyToken, filesController.searchFiles);

/**
 * GET /api/files/stats
 * Get file statistics
 * Query: siteId, year, month
 */
router.get("/stats", verifyToken, filesController.getFileStats);

/**
 * INDIVIDUAL FILE ROUTES
 */

/**
 * GET /api/files/preview/:fileId
 * Get file details for preview
 */
router.get("/preview/:fileId", verifyToken, filesController.getFilePreview);

/**
 * DELETE /api/files/:fileId
 * Delete a file
 */
router.delete("/:fileId", verifyToken, filesController.deleteFile);

module.exports = router;
