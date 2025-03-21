import express, { RequestHandler } from 'express';
import {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  deleteAuditLog,
} from '../controllers/auditLogController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// POST /audit-logs: System creates audit logs automatically (no auth needed)
router.post('/audit-logs', createAuditLog as RequestHandler);

// GET /audit-logs/user/:userId: Only Admins can view audit logs
router.get('/audit-logs/user/:userId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  getAuditLogs as RequestHandler
);

// GET /audit-logs/:id: Only Admins can view audit log details
router.get('/audit-logs/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  getAuditLogById as RequestHandler
);

// DELETE /audit-logs/:id: Only Admins can delete audit logs
router.delete('/audit-logs/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  deleteAuditLog as RequestHandler
);

export default router;
