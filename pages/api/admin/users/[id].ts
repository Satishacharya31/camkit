import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!session.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // GET - Get single user details
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          _count: {
            select: { contents: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  // PUT - Update user (role, name)
  if (req.method === 'PUT') {
    try {
      const { role, name } = req.body;

      // Prevent admin from demoting themselves
      if (id === session.user.id && role === 'USER') {
        return res.status(400).json({ error: 'You cannot demote yourself' });
      }

      const updateData: { role?: 'USER' | 'ADMIN'; name?: string } = {};

      if (role && ['USER', 'ADMIN'].includes(role)) {
        updateData.role = role;
      }

      if (name !== undefined) {
        updateData.name = name;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ user: updatedUser, message: 'User updated successfully' });
    } catch (error) {
      console.error('Failed to update user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // DELETE - Delete user
  if (req.method === 'DELETE') {
    try {
      // Prevent admin from deleting themselves
      if (id === session.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }

      // Delete user (cascades to contents, sessions, accounts via Prisma schema)
      await prisma.user.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
