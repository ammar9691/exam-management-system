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

// Get specific result by ID (student view with question-wise breakdown)
export const getResultById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user._id;

  const result = await Result.findOne({
    _id: id,
    student: studentId
  })
    .populate('exam', 'title subject totalMarks duration')
    .populate({
      path: 'answers.question',
      select: 'question options difficulty subject topic marks'
    });

  if (!result) {
    return sendNotFoundResponse(res, 'Result');
  }

  // Build question-wise breakdown for the student UI
  const questionBreakdown = result.answers.map((answer, index) => {
    const q = answer.question; // populated Question document

    // Some older results might not have populated question details
    const options = Array.isArray(q?.options)
      ? q.options.map((opt, idx) => ({
          index: idx,
          text: opt.text,
          isCorrect: !!opt.isCorrect,
          isSelected: Array.isArray(answer.selectedOptions)
            ? answer.selectedOptions.includes(idx)
            : false
        }))
      : [];

    const correctOptionIndexes = Array.isArray(q?.options)
      ? q.options.reduce((acc, opt, idx) => {
          if (opt.isCorrect) acc.push(idx);
          return acc;
        }, [])
      : [];

    return {
      index,
      questionId: q?._id,
      text: q?.question,
      subject: q?.subject,
      topic: q?.topic,
      difficulty: q?.difficulty,
      marksAssigned: q?.marks,
      marksObtained: answer.marksObtained,
      isCorrect: answer.isCorrect,
      timeSpent: answer.timeSpent,
      flagged: answer.flagged,
      options,
      selectedOptionIndexes: Array.isArray(answer.selectedOptions)
        ? answer.selectedOptions
        : [],
      correctOptionIndexes
    };
  });

  const resultData = {
    _id: result._id,
    exam: result.exam,
    // Flatten some scoring fields for easier frontend use
    marksObtained: result.scoring.marksObtained,
    totalMarks: result.scoring.totalMarks,
    percentage: result.scoring.percentage,
    passed: result.scoring.passed,
    scoring: result.scoring,
    stats: result.stats,
    analytics: result.analytics,
    submittedAt: result.submittedAt,
    status: result.status,
    feedback: result.feedback,
    questions: questionBreakdown
  };

  sendSuccessResponse(res, 'Result retrieved successfully', resultData);
});

export default {
  getResultById
};
