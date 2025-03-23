import express, { RequestHandler } from 'express';
import {
  createOrUpdateDocument,
  getDocuments,
  getDocumentById,
  getDocumentByUserId,
  deleteDocument
} from '../controllers/modules/documentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck, { ResourceType } from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// POST /documents: Create or update a document
router.post('/documents', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  createOrUpdateDocument as RequestHandler
);

// GET /documents: Admin-only route to get all documents
router.get('/documents', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  getDocuments as RequestHandler
);

// GET /documents/user/:userId: Get document for a specific user
router.get('/documents/user/:userId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.USER) as RequestHandler,
  getDocumentByUserId as RequestHandler
);

// GET /documents/:id: Get document by ID
router.get('/documents/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.DOCUMENT) as RequestHandler,
  getDocumentById as RequestHandler
);

// DELETE /documents/:id: Delete a document
router.delete('/documents/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck(ResourceType.DOCUMENT) as RequestHandler,
  deleteDocument as RequestHandler
);

export default router;
