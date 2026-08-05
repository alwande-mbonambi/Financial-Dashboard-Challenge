const summaryService = require('../services/summaryService');

const summaryController = {
  // GET /api/summary?startDate=2026-01-01&endDate=2026-01-31&compareStartDate=2025-01-01&compareEndDate=2025-01-31
  async getSummary(req, res) {
    try {
      const { startDate, endDate, compareStartDate, compareEndDate } = req.query;

      const currentWindow = startDate && endDate ? { startDate, endDate } : null;
      const compareWindow = compareStartDate && compareEndDate ? { startDate: compareStartDate, endDate: compareEndDate } : null;

      const data = await summaryService.getDashboardSummary(currentWindow, compareWindow);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard summary',
        error: error.message,
      });
    }
  },
};

module.exports = summaryController;