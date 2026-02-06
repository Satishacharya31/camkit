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
    return res.status(400).json({ error: 'Invalid ID' });
  }

  // GET - Fetch single user with their content
  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          contents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  // PUT - Update user role
  if (req.method === 'PUT') {
    try {
      const { role } = req.body;

      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { role },
      });

      return res.status(200).json(user);
    } catch (error) {
      console.error('Failed to update user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // DELETE - Delete user and their content
  if (req.method === 'DELETE') {
    try {
      // Prevent deleting yourself
      if (id === session.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }

      await prisma.user.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'User deleted' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
