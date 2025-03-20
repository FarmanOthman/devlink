import express, { RequestHandler } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
} from '../controllers/documentController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import ownershipCheck from '../middlewares/ownershipMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// POST /documents: Only Developers and Admins can upload documents
router.post('/documents', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.ADMIN]) as RequestHandler,
  createDocument as RequestHandler
);

// GET /documents/user/:userId: Users can view their own documents, Admins can view any user's documents
router.get('/documents/user/:userId', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('user') as RequestHandler,
  getDocuments as RequestHandler
);

// GET /documents/:id: Users can view their own documents, Admins can view any document
router.get('/documents/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('document') as RequestHandler,
  getDocumentById as RequestHandler
);

// PUT /documents/:id: Users can update their own documents, Admins can update any document
router.put('/documents/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('document') as RequestHandler,
  updateDocument as RequestHandler
);

// DELETE /documents/:id: Users can delete their own documents, Admins can delete any document
router.delete('/documents/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.DEVELOPER, UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  ownershipCheck('document') as RequestHandler,
  deleteDocument as RequestHandler
);

export default router;
