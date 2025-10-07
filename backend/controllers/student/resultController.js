/**
 * Student Result Controller
 * Handles student result viewing operations
 */

import Result from '../../models/Result.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../../utils/response.js';

// Get specific result by ID
export const getResultById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user._id;

  const result = await Result.findOne({
    _id: id,
    student: studentId
  }).populate('exam', 'title subject totalMarks');

  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  const resultData = {
    _id: result._id,
    exam: result.exam,
    scoring: result.scoring,
    stats: result.stats,
    analytics: result.analytics,
    submittedAt: result.submittedAt,
    status: result.status,
    feedback: result.feedback
  };

  sendSuccessResponse(res, 'Result retrieved successfully', resultData);
});

export default {
  getResultById
};