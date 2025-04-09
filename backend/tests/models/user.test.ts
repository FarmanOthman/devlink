import { prisma } from '../setup';
import { Role } from '@prisma/client';

describe('User Model', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: Role.DEVELOPER,
  };

  it('should create a new user', async () => {
    const user = await prisma.user.create({
      data: testUser,
    });

    expect(user).toHaveProperty('id');
    expect(user.name).toBe(testUser.name);
    expect(user.email).toBe(testUser.email);
    expect(user.role).toBe(testUser.role);
  });

  it('should read a user', async () => {
    const createdUser = await prisma.user.create({
      data: testUser,
    });

    const user = await prisma.user.findUnique({
      where: { id: createdUser.id },
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe(testUser.name);
  });

  it('should update a user', async () => {
    const createdUser = await prisma.user.create({
      data: testUser,
    });

    const updatedUser = await prisma.user.update({
      where: { id: createdUser.id },
      data: { bio: 'Updated bio' },
    });

    expect(updatedUser.bio).toBe('Updated bio');
  });

  it('should delete a user', async () => {
    const createdUser = await prisma.user.create({
      data: testUser,
    });

    await prisma.user.delete({
      where: { id: createdUser.id },
    });

    const deletedUser = await prisma.user.findUnique({
      where: { id: createdUser.id },
    });

    expect(deletedUser).toBeNull();
  });

  it('should enforce unique email constraint', async () => {
    await prisma.user.create({
      data: testUser,
    });

    await expect(
      prisma.user.create({
        data: testUser,
      })
    ).rejects.toThrow();
  });
}); 