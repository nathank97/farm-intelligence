/**
 * Seed Script — Minimal
 *
 * Only creates the admin user profile.
 * Real data comes from uploading the 3 Excel files via /admin/upload.
 *
 * BEFORE RUNNING:
 * 1. Create a user in Supabase Dashboard → Authentication → Users
 * 2. Copy their UUID and replace the placeholder below
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001"; // Replace with real Supabase user ID
  const ADMIN_EMAIL = "admin@farm.example"; // Replace with real email

  await prisma.userProfile.upsert({
    where: { email: ADMIN_EMAIL },
    create: { id: ADMIN_USER_ID, email: ADMIN_EMAIL, fullName: "Farm Admin", role: UserRole.ADMIN },
    update: { role: UserRole.ADMIN },
  });

  console.log("✅ Admin profile created. Upload Excel files via /admin/upload to populate data.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
