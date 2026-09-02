import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";

const requiredEnvVars = ["SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD", "SEED_ADMIN_NAME"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required env vars for seeding: ${missing.join(", ")}`);
}

const seedUsers = [
  {
    name: process.env.SEED_ADMIN_NAME,
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: "super-admin",
    phone: process.env.SEED_ADMIN_PHONE || undefined,
  },
];

const run = async () => {
  try {
    await connectDatabase();

    for (const payload of seedUsers) {
      const existingUser = await User.findOne({ email: payload.email });

      if (existingUser) {
        existingUser.name = payload.name;
        existingUser.role = payload.role;
        if (payload.phone) existingUser.phone = payload.phone;
        existingUser.password = payload.password;
        await existingUser.save();
        console.log(`Updated ${payload.email}`);
      } else {
        await User.create(payload);
        console.log(`Created ${payload.email}`);
      }
    }

    console.log("User seeding completed");
  } catch (error) {
    console.error("User seeding failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();