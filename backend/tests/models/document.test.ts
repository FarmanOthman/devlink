import { prisma } from '../setup';
import { Role, DocumentType } from '@prisma/client';

describe('Document Model', () => {
  const testUser = {
    name: 'Test Developer',
    email: `dev_${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role: Role.DEVELOPER,
  };

  const testDocument = {
    fileUrl: 'https://example.com/resume.pdf',
    documentType: DocumentType.RESUME,
  };

  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({ data: testUser });
    userId = user.id;
  });

  describe('Basic CRUD', () => {
    it('should create a document', async () => {
      const document = await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      expect(document).toHaveProperty('id');
      expect(document.fileUrl).toBe(testDocument.fileUrl);
      expect(document.documentType).toBe(testDocument.documentType);
      expect(document.userId).toBe(userId);
    });

    it('should enforce unique user constraint', async () => {
      await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      await expect(
        prisma.document.create({
          data: {
            ...testDocument,
            fileUrl: 'https://example.com/another-resume.pdf',
            userId,
          },
        })
      ).rejects.toThrow();
    });

    it('should read a document', async () => {
      const document = await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      const foundDocument = await prisma.document.findUnique({
        where: { id: document.id },
        include: {
          user: true,
        },
      });

      expect(foundDocument).not.toBeNull();
      expect(foundDocument?.fileUrl).toBe(testDocument.fileUrl);
      expect(foundDocument?.documentType).toBe(testDocument.documentType);
      expect(foundDocument?.user.name).toBe(testUser.name);
    });

    it('should update a document', async () => {
      const document = await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      const newFileUrl = 'https://example.com/updated-resume.pdf';
      const updatedDocument = await prisma.document.update({
        where: { id: document.id },
        data: {
          fileUrl: newFileUrl,
          documentType: DocumentType.PORTFOLIO,
        },
      });

      expect(updatedDocument.fileUrl).toBe(newFileUrl);
      expect(updatedDocument.documentType).toBe(DocumentType.PORTFOLIO);
    });

    it('should delete a document', async () => {
      const document = await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      await prisma.document.delete({
        where: { id: document.id },
      });

      const deletedDocument = await prisma.document.findUnique({
        where: { id: document.id },
      });

      expect(deletedDocument).toBeNull();
    });
  });

  describe('Relationships', () => {
    it('should be accessible through user relationship', async () => {
      await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      const userWithDocument = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          document: true,
        },
      });

      expect(userWithDocument?.document).not.toBeNull();
      expect(userWithDocument?.document?.fileUrl).toBe(testDocument.fileUrl);
      expect(userWithDocument?.document?.documentType).toBe(testDocument.documentType);
    });

    it('should be deleted when user is deleted', async () => {
      const document = await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      await prisma.user.delete({
        where: { id: userId },
      });

      const deletedDocument = await prisma.document.findUnique({
        where: { id: document.id },
      });

      expect(deletedDocument).toBeNull();
    });
  });

  describe('Document Types', () => {
    it('should handle different document types', async () => {
      const documentTypes = [
        { type: DocumentType.RESUME, url: 'https://example.com/resume.pdf' },
        { type: DocumentType.COVER_LETTER, url: 'https://example.com/cover-letter.pdf' },
        { type: DocumentType.PORTFOLIO, url: 'https://example.com/portfolio.pdf' },
        { type: DocumentType.OTHER, url: 'https://example.com/other.pdf' },
      ];

      // Create a new user for each document type to avoid unique constraint
      for (const doc of documentTypes) {
        const user = await prisma.user.create({
          data: {
            ...testUser,
            email: `dev_${Date.now()}_${doc.type}@example.com`,
          },
        });

        const document = await prisma.document.create({
          data: {
            fileUrl: doc.url,
            documentType: doc.type,
            userId: user.id,
          },
        });

        expect(document.documentType).toBe(doc.type);
        expect(document.fileUrl).toBe(doc.url);
      }
    });

    it('should update document type', async () => {
      const document = await prisma.document.create({
        data: {
          ...testDocument,
          userId,
        },
      });

      const documentTypes = [
        DocumentType.COVER_LETTER,
        DocumentType.PORTFOLIO,
        DocumentType.OTHER,
      ];

      for (const type of documentTypes) {
        const updatedDocument = await prisma.document.update({
          where: { id: document.id },
          data: { documentType: type },
        });

        expect(updatedDocument.documentType).toBe(type);
      }
    });
  });
}); 