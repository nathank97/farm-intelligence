import { prisma } from '@/lib/prisma/client';
import type { UserRole } from '@/types/database';

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return profile?.role ?? null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'ADMIN';
}

export async function isAuthenticated(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return !!profile;
}
