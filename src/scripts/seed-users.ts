import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  { name: "Administrator",   email: "admin@halal-kms.com",       role: "ADMIN",              password: "admin123" },
  { name: "Petugas Farm",    email: "farm@halal-kms.com",        role: "CP1_FARM",            password: "farm123" },
  { name: "Petugas Pakan",   email: "feed@halal-kms.com",        role: "CP2_FEED",            password: "feed123" },
  { name: "Petugas Transport", email: "transport@halal-kms.com", role: "CP3_TRANSPORT",       password: "transport123" },
  { name: "Petugas RPH",     email: "slaughter@halal-kms.com",   role: "CP4_SLAUGHTER",       password: "slaughter123" },
  { name: "Petugas Post-S",  email: "postslaughter@halal-kms.com", role: "CP5_POST_SLAUGHTER", password: "post123" },
  { name: "Petugas Olahan",  email: "processing@halal-kms.com",  role: "CP6_PROCESSING",      password: "processing123" },
  { name: "Petugas Gudang",  email: "storage@halal-kms.com",     role: "CP7_STORAGE",         password: "storage123" },
  { name: "Petugas Distribusi", email: "distribution@halal-kms.com", role: "CP8_DISTRIBUTION", password: "distribution123" },
  { name: "Petugas Retail",  email: "retail@halal-kms.com",      role: "CP9_RETAIL",          password: "retail123" },

];

async function main() {
  console.log("🔐 Seeding users (10 roles)...\n");

  for (const u of USERS) {
    const hashed = await hash(u.password, 12);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashed },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        password: hashed,
      },
    });

    console.log(`  ✅ ${user.role.padEnd(20)} → ${user.email} (pass: ${u.password})`);
  }

  console.log("\n🎉 Done! 10 users seeded.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
