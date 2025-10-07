/**
 * Subject Routes
 */

import express from 'express';
import subjectController from '../controllers/subjectController.js';
import { subjectValidations, paginationValidation } from '../utils/validation.js';
import { authenticate, authorize, hasPermission, checkResourceAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET /api/subjects
router.get('/', 
  paginationValidation,
  subjectController.getAllSubjects
);

// GET /api/subjects/stats
router.get('/stats', 
  authorize('admin'),
  subjectController.getAllSubjectStats
);

// GET /api/subjects/search
router.get('/search', subjectController.searchSubjects);

// GET /api/subjects/my
router.get('/my', 
  authorize('instructor'),
  subjectController.getMySubjects
);

// GET /api/subjects/instructor/:instructorId
router.get('/instructor/:instructorId', 
  authorize('admin', 'instructor'),
  subjectController.getSubjectsByInstructor
);

// POST /api/subjects
router.post('/', 
  authorize('admin'),
  subjectValidations.create,
  subjectController.createSubject
);

// PUT /api/subjects/bulk
router.put('/bulk', 
  authorize('admin'),
  subjectController.bulkUpdateSubjects
);

// GET /api/subjects/:id
router.get('/:id', subjectController.getSubjectById);

// PUT /api/subjects/:id
router.put('/:id', 
  authorize('admin', 'instructor'),
  subjectValidations.update,
  subjectController.updateSubject
);

// DELETE /api/subjects/:id
router.delete('/:id', 
  authorize('admin'),
  subjectController.deleteSubject
);

// GET /api/subjects/:id/topics
router.get('/:id/topics', subjectController.getSubjectTopics);

// POST /api/subjects/:id/topics
router.post('/:id/topics', 
  authorize('admin', 'instructor'),
  subjectController.addTopic
);

// PUT /api/subjects/:id/topics/:topicId
router.put('/:id/topics/:topicId', 
  authorize('admin', 'instructor'),
  subjectController.updateTopic
);

// DELETE /api/subjects/:id/topics/:topicId
router.delete('/:id/topics/:topicId', 
  authorize('admin', 'instructor'),
  subjectController.deleteTopic
);

// PUT /api/subjects/:id/topics/reorder
router.put('/:id/topics/reorder', 
  authorize('admin', 'instructor'),
  subjectController.reorderTopics
);

// GET /api/subjects/:id/instructors
router.get('/:id/instructors', subjectController.getSubjectInstructors);

// POST /api/subjects/:id/instructors
router.post('/:id/instructors', 
  authorize('admin'),
  subjectController.addInstructor
);

// PUT /api/subjects/:id/instructors/:instructorId
router.put('/:id/instructors/:instructorId', 
  authorize('admin'),
  subjectController.updateInstructorPermissions
);

// DELETE /api/subjects/:id/instructors/:instructorId
router.delete('/:id/instructors/:instructorId', 
  authorize('admin'),
  subjectController.removeInstructor
);

// GET /api/subjects/:id/stats
router.get('/:id/stats', 
  authorize('admin', 'instructor'),
  subjectController.getSubjectStats
);

export default router;
