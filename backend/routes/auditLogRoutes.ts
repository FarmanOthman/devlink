import express from 'express';
import {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
  deleteAuditLog,
} from '../controllers/auditLogController';

const router = express.Router();

// CRUD Routes for AuditLog
router.post('/audit-logs', createAuditLog);
router.get('/audit-logs/:userId', getAuditLogs); // Fetch all audit logs for a user
router.get('/audit-logs/:id', getAuditLogById);
router.delete('/audit-logs/:id', deleteAuditLog);

export default router;
