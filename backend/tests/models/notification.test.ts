import { prisma } from '../setup';
import { Role, NotificationType } from '@prisma/client';

describe('Notification Model', () => {
  const testUser = {
    name: 'Test Developer',
    email: `dev_${Date.now()}@example.com`,
    password: 'hashedPassword123',
    role: Role.DEVELOPER,
  };

  const testNotification = {
    message: 'Test notification message',
    type: NotificationType.GENERAL,
    isRead: false,
  };

  let userId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({ data: testUser });
    userId = user.id;
  });

  describe('Basic CRUD', () => {
    it('should create a notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          ...testNotification,
          userId,
        },
      });

      expect(notification).toHaveProperty('id');
      expect(notification.message).toBe(testNotification.message);
      expect(notification.type).toBe(testNotification.type);
      expect(notification.isRead).toBe(testNotification.isRead);
      expect(notification.userId).toBe(userId);
    });

    it('should read a notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          ...testNotification,
          userId,
        },
      });

      const foundNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
        include: {
          user: true,
        },
      });

      expect(foundNotification).not.toBeNull();
      expect(foundNotification?.message).toBe(testNotification.message);
      expect(foundNotification?.type).toBe(testNotification.type);
      expect(foundNotification?.user.name).toBe(testUser.name);
    });

    it('should update a notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          ...testNotification,
          userId,
        },
      });

      const updatedNotification = await prisma.notification.update({
        where: { id: notification.id },
        data: {
          message: 'Updated message',
          isRead: true,
          type: NotificationType.APPLICATION_UPDATE,
        },
      });

      expect(updatedNotification.message).toBe('Updated message');
      expect(updatedNotification.isRead).toBe(true);
      expect(updatedNotification.type).toBe(NotificationType.APPLICATION_UPDATE);
    });

    it('should delete a notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          ...testNotification,
          userId,
        },
      });

      await prisma.notification.delete({
        where: { id: notification.id },
      });

      const deletedNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(deletedNotification).toBeNull();
    });
  });

  describe('Relationships', () => {
    it('should be accessible through user relationship', async () => {
      await prisma.notification.create({
        data: {
          ...testNotification,
          userId,
        },
      });

      const userWithNotifications = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          notifications: true,
        },
      });

      expect(userWithNotifications?.notifications).toHaveLength(1);
      expect(userWithNotifications?.notifications[0].message).toBe(testNotification.message);
      expect(userWithNotifications?.notifications[0].type).toBe(testNotification.type);
    });

    it('should be deleted when user is deleted', async () => {
      const notification = await prisma.notification.create({
        data: {
          ...testNotification,
          userId,
        },
      });

      await prisma.user.delete({
        where: { id: userId },
      });

      const deletedNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(deletedNotification).toBeNull();
    });
  });

  describe('Notification Types', () => {
    it('should handle different notification types', async () => {
      const notificationTypes = [
        { type: NotificationType.GENERAL, message: 'General notification' },
        { type: NotificationType.APPLICATION_UPDATE, message: 'Application updated' },
        { type: NotificationType.INTERVIEW_REQUEST, message: 'Interview requested' },
        { type: NotificationType.JOB_MATCH, message: 'New job match' },
        { type: NotificationType.MESSAGE, message: 'New message' },
      ];

      for (const notification of notificationTypes) {
        const createdNotification = await prisma.notification.create({
          data: {
            userId,
            message: notification.message,
            type: notification.type,
            isRead: false,
          },
        });

        expect(createdNotification.type).toBe(notification.type);
        expect(createdNotification.message).toBe(notification.message);
      }

      const userWithNotifications = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          notifications: {
            orderBy: {
              type: 'asc',
            },
          },
        },
      });

      expect(userWithNotifications?.notifications).toHaveLength(notificationTypes.length);
    });
  });

  describe('Querying', () => {
    it('should filter notifications by read status', async () => {
      // Create both read and unread notifications
      await Promise.all([
        prisma.notification.create({
          data: {
            ...testNotification,
            userId,
            isRead: true,
          },
        }),
        prisma.notification.create({
          data: {
            ...testNotification,
            userId,
            isRead: false,
          },
        }),
      ]);

      const unreadNotifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
      });

      const readNotifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: true,
        },
      });

      expect(unreadNotifications).toHaveLength(1);
      expect(readNotifications).toHaveLength(1);
    });

    it('should filter notifications by type', async () => {
      await Promise.all([
        prisma.notification.create({
          data: {
            ...testNotification,
            userId,
            type: NotificationType.GENERAL,
          },
        }),
        prisma.notification.create({
          data: {
            ...testNotification,
            userId,
            type: NotificationType.APPLICATION_UPDATE,
          },
        }),
      ]);

      const generalNotifications = await prisma.notification.findMany({
        where: {
          userId,
          type: NotificationType.GENERAL,
        },
      });

      const applicationNotifications = await prisma.notification.findMany({
        where: {
          userId,
          type: NotificationType.APPLICATION_UPDATE,
        },
      });

      expect(generalNotifications).toHaveLength(1);
      expect(applicationNotifications).toHaveLength(1);
    });
  });
}); 