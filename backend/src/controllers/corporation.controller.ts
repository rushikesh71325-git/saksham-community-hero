import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCorporations = async (req: Request, res: Response) => {
  try {
    const corporations = await prisma.corporation.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json({ data: corporations });
  } catch (error) {
    console.error('Error fetching corporations:', error);
    return res.status(500).json({ error: 'Failed to fetch corporations' });
  }
};
