/**
 * Module Access Middleware
 * Restricts instructor/knowledge examiner access to their assigned modules (PCAA Req 11)
 * Admin and Exam Manager bypass this restriction.
 */

import { sendErrorResponse } from '../utils/response.js';

/**
 * Checks if user has access to the requested module.
 * Extracts module from req.query.module, req.body.module, or req.params.module
 * Admin and exam_manager roles bypass the check.
 * Instructors with empty assignedModules get access to all modules (backwards compatibility).
 */
export const enforceModuleAccess = (req, res, next) => {
  const { user } = req;
  if (!user) {
    return sendErrorResponse(res, 'Authentication required.', 401);
  }

  // Admin and exam_manager bypass module restriction
  if (['admin', 'exam_manager'].includes(user.role)) {
    return next();
  }

  // If instructor has no assigned modules, allow all (backwards compatibility)
  if (!user.assignedModules || user.assignedModules.length === 0) {
    return next();
  }

  // Extract module from request
  const requestedModule = req.query.module || req.body.module || req.params.module;

  // If no specific module requested (e.g., listing all), filter will be applied in controller
  if (!requestedModule) {
    // Attach assigned modules to request for controller to filter
    req.allowedModules = user.assignedModules;
    return next();
  }

  // Check if user has access to the requested module
  if (!user.assignedModules.includes(requestedModule)) {
    return sendErrorResponse(
      res,
      `Access denied. You are not authorized for module: ${requestedModule}`,
      403
    );
  }

  next();
};

export default { enforceModuleAccess };
