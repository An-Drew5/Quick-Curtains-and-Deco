import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const { default: prisma } = await import("../lib/prisma.js");

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error(
    "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.",
  );
  process.exit(1);
}

async function main() {
  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(
        `Admin with email ${adminEmail} already exists. Skipping creation.`,
      );
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const newAdmin = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        role: "admin",
      },
    });

    console.log(`Admin user created successfully: ${newAdmin.email}`);
  } catch (error) {
    console.error("Failed to seed admin user:", error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
