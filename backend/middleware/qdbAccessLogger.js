/**
 * QDB Access Logger Middleware
 * Automatically logs access to Question Database routes (PCAA Req 10)
 */

import QDBAccessLog from '../models/QDBAccessLog.js';

/**
 * Middleware factory - logs QDB access after the response is sent
 * @param {string} action - The action type (view_list, view_question, create, edit, etc.)
 * @param {Function} detailsFn - Optional function(req) returning { questionId, questionSerialNo, module, description }
 */
export const logQDBAccess = (action, detailsFn = null) => {
  return (req, res, next) => {
    // Log after the response is sent (non-blocking)
    res.on('finish', () => {
      // Only log successful requests
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const details = detailsFn ? detailsFn(req) : {};
        QDBAccessLog.logAccess(req, action, details);
      }
    });
    next();
  };
};

export default { logQDBAccess };
