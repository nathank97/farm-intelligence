import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/auth/supabase-server';
import { prisma } from '@/lib/prisma/client';
import ProtectedShell from './ProtectedShell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure UserProfile exists
  let profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name ?? null,
        role: 'VIEWER',
      },
    });
  }

  return (
    <ProtectedShell
      email={profile.email}
      role={profile.role}
    >
      {children}
    </ProtectedShell>
  );
}
