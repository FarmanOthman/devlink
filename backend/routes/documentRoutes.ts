import express, { RequestHandler } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
} from '../controllers/documentController';
import authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

// All document routes should be protected as they relate to user data
router.post('/documents', authMiddleware, createDocument as RequestHandler);
router.get('/documents/user/:userId', authMiddleware, getDocuments as RequestHandler);
router.get('/documents/:id', authMiddleware, getDocumentById as RequestHandler);
router.put('/documents/:id', authMiddleware, updateDocument as RequestHandler);
router.delete('/documents/:id', authMiddleware, deleteDocument as RequestHandler);

export default router;
