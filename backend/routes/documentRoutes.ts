import express from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from '../controllers/documentController';

const router = express.Router();

// CRUD Routes for Document
router.post('/documents', createDocument);
router.get('/documents/:userId', getDocuments); // Fetch all documents for a user
router.get('/documents/:id', getDocumentById);
router.put('/documents/:id', updateDocument);
router.delete('/documents/:id', deleteDocument);

export default router;
